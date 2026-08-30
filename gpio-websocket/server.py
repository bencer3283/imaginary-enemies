import asyncio
import os
import sys
import time
import logging
from typing import Set, Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import warnings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("gpio-websocket")

# Suppress noisy fallback warnings from gpiozero during pin factory discovery
warnings.filterwarnings("ignore", module="gpiozero")

# Configuration from environment variables
BUTTON_PIN = int(os.getenv("GPIO_PIN", os.getenv("BUTTON_PIN", "17")))
OUTPUT_PIN = int(os.getenv("OUTPUT_PIN", os.getenv("GPIO_OUTPUT_PIN", "27")))
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8080"))
BOUNCE_TIME = float(os.getenv("BOUNCE_TIME", "0.05"))
PULL_UP = os.getenv("PULL_UP", "true").lower() in ("true", "1", "yes")
FORCE_MOCK = os.getenv("MOCK_GPIO", "false").lower() in ("true", "1", "yes")

# Global event loop reference for threadsafe coroutine scheduling
main_event_loop: Optional[asyncio.AbstractEventLoop] = None


class ConnectionManager:
    """Manages active WebSocket client connections and message broadcasting."""

    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(f"WebSocket client connected. Total clients: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)
        logger.info(f"WebSocket client disconnected. Total clients: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        if not self.active_connections:
            logger.debug(f"Broadcast triggered but no active clients connected. Payload: {message}")
            return

        logger.info(f"Broadcasting event to {len(self.active_connections)} client(s): {message}")
        dead_connections = set()

        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.warning(f"Error sending message to client: {e}")
                dead_connections.add(connection)

        for dead in dead_connections:
            self.disconnect(dead)


manager = ConnectionManager()
button_instance: Optional[object] = None
output_device_instance: Optional[object] = None
is_mock_mode: bool = False


def setup_gpio():
    """Initializes the gpiozero Button (input) and DigitalOutputDevice (output), falling back to MockFactory if hardware is unavailable."""
    global button_instance, output_device_instance, is_mock_mode

    from gpiozero import Button, DigitalOutputDevice, Device

    if FORCE_MOCK:
        from gpiozero.pins.mock import MockFactory
        Device.pin_factory = MockFactory()
        is_mock_mode = True
        logger.info("GPIO mock mode forced via MOCK_GPIO environment variable.")
    else:
        try:
            Device.ensure_pin_factory()
            logger.info(f"Using default GPIO pin factory: {Device.pin_factory.__class__.__name__}")
        except Exception as e:
            logger.warning(f"Hardware pin factory unavailable ({e}). Falling back to MockFactory for simulation.")
            from gpiozero.pins.mock import MockFactory
            Device.pin_factory = MockFactory()
            is_mock_mode = True

    try:
        # Initialize Output GPIO pin (defaults to GPIO 27, initialized to LOW)
        output_device = DigitalOutputDevice(OUTPUT_PIN, active_high=True, initial_value=False)
        output_device.off()  # Explicitly ensure low at start
        output_device_instance = output_device
        logger.info(f"GPIO Output initialized on pin {OUTPUT_PIN} (state=LOW, mock={is_mock_mode})")

        # Initialize Button input pin
        button = Button(BUTTON_PIN, pull_up=PULL_UP, bounce_time=BOUNCE_TIME)

        def on_pressed():
            logger.info(f"GPIO Pin {BUTTON_PIN} PRESSED -> Setting GPIO {OUTPUT_PIN} HIGH")
            if output_device_instance:
                output_device_instance.on()

            payload = {
                "event": "button_press",
                "action": "pressed",
                "pin": BUTTON_PIN,
                "output_pin": OUTPUT_PIN,
                "output_state": "high",
                "timestamp": time.time(),
                "is_mock": is_mock_mode,
            }
            if main_event_loop and main_event_loop.is_running():
                asyncio.run_coroutine_threadsafe(manager.broadcast(payload), main_event_loop)

        def on_released():
            logger.info(f"GPIO Pin {BUTTON_PIN} RELEASED -> Setting GPIO {OUTPUT_PIN} LOW")
            if output_device_instance:
                output_device_instance.off()

            payload = {
                "event": "button_release",
                "action": "released",
                "pin": BUTTON_PIN,
                "output_pin": OUTPUT_PIN,
                "output_state": "low",
                "timestamp": time.time(),
                "is_mock": is_mock_mode,
            }
            if main_event_loop and main_event_loop.is_running():
                asyncio.run_coroutine_threadsafe(manager.broadcast(payload), main_event_loop)

        button.when_pressed = on_pressed
        button.when_released = on_released
        button_instance = button
        logger.info(f"GPIO Button listening on pin {BUTTON_PIN} (pull_up={PULL_UP}, bounce_time={BOUNCE_TIME}s, mock={is_mock_mode})")
    except Exception as e:
        logger.error(f"Failed to initialize GPIO devices: {e}")
        raise


@asynccontextmanager
async def lifespan(app: FastAPI):
    global main_event_loop
    main_event_loop = asyncio.get_running_loop()
    setup_gpio()
    yield
    if output_device_instance:
        try:
            output_device_instance.off()
            output_device_instance.close()
        except Exception:
            pass
    if button_instance:
        try:
            button_instance.close()
        except Exception:
            pass


app = FastAPI(
    title="GPIO WebSocket Server",
    description="FastAPI WebSocket bridge emitting events and controlling GPIO output",
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS for Next.js app communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Health check and status endpoint."""
    return {
        "status": "online",
        "service": "gpio-websocket",
        "button_pin": BUTTON_PIN,
        "output_pin": OUTPUT_PIN,
        "mock_mode": is_mock_mode,
        "active_clients": len(manager.active_connections),
        "endpoints": {
            "websocket": "/ws",
            "simulate_press": "POST /simulate-press",
            "status": "GET /",
        }
    }


class SimulatePayload(BaseModel):
    action: Optional[str] = "pressed"
    pin: Optional[int] = BUTTON_PIN


@app.post("/simulate-press")
async def simulate_press(payload: Optional[SimulatePayload] = None):
    """Simulate a button press/release event and toggle the output pin accordingly."""
    action = payload.action if payload and payload.action else "pressed"
    pin = payload.pin if payload and payload.pin is not None else BUTTON_PIN

    if action == "pressed":
        if output_device_instance:
            output_device_instance.on()
        output_state = "high"
        event_name = "button_press"
    else:
        if output_device_instance:
            output_device_instance.off()
        output_state = "low"
        event_name = "button_release"

    event_data = {
        "event": event_name,
        "action": action,
        "pin": pin,
        "output_pin": OUTPUT_PIN,
        "output_state": output_state,
        "timestamp": time.time(),
        "is_mock": is_mock_mode,
        "simulated": True,
    }

    # If in mock mode, trigger the mock button pin state if button instance exists
    if is_mock_mode and button_instance and hasattr(button_instance, "pin"):
        try:
            if hasattr(button_instance.pin, "drive_low") and hasattr(button_instance.pin, "drive_high"):
                if action == "pressed":
                    if PULL_UP:
                        button_instance.pin.drive_low()
                    else:
                        button_instance.pin.drive_high()
                else:
                    if PULL_UP:
                        button_instance.pin.drive_high()
                    else:
                        button_instance.pin.drive_low()
        except Exception as e:
            logger.debug(f"Mock pin driving exception: {e}")

    await manager.broadcast(event_data)
    return {"status": "event_emitted", "event": event_data}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for Next.js application to connect and receive button events."""
    await manager.connect(websocket)

    # Send initial welcome / connection ack
    await websocket.send_json({
        "event": "connected",
        "message": "Connected to GPIO WebSocket Server",
        "button_pin": BUTTON_PIN,
        "output_pin": OUTPUT_PIN,
        "timestamp": time.time(),
    })

    try:
        while True:
            # Keep connection open and handle incoming messages (e.g. ping/pong or client commands)
            data = await websocket.receive_text()
            logger.debug(f"Received message from client: {data}")
            if data == "ping":
                await websocket.send_json({"event": "pong", "timestamp": time.time()})
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.warning(f"WebSocket error: {e}")
        manager.disconnect(websocket)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host=HOST, port=PORT, reload=False)
