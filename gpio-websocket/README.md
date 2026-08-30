# GPIO WebSocket Server

A FastAPI-based WebSocket bridge that listens for physical button presses on a Raspberry Pi GPIO pin using `gpiozero` and broadcasts real-time WebSocket events to connected clients (such as the Next.js frontend).

## Setup & Virtual Environment

The local Python virtual environment is located at `./venv`.

### 1. Activate the Virtual Environment

```bash
# From within the gpio-websocket directory
source venv/bin/activate
```

### 2. Run the Server

```bash
# Directly with the venv python
./venv/bin/python server.py

# Or after activating the venv:
python server.py
```

Or using `uvicorn`:
```bash
uvicorn server:app --host 0.0.0.0 --port 8000
```

---

## Configuration

You can customize the GPIO pin, port, and behavior using environment variables:

| Variable | Default | Description |
| :--- | :--- | :--- |
| `GPIO_PIN` | `17` | BCM pin number the physical button is connected to |
| `HOST` | `0.0.0.0` | Host interface to bind server to |
| `PORT` | `8000` | Port to run the server on |
| `BOUNCE_TIME` | `0.05` | Debounce time in seconds |
| `PULL_UP` | `true` | Set to `true` to use internal pull-up resistor (active LOW) |
| `MOCK_GPIO` | `false` | Force mock mode for simulation/testing without hardware |

Example:
```bash
GPIO_PIN=22 PORT=8080 python server.py
```

> **Note**: When executed on a non-Raspberry Pi machine (or without hardware GPIO access), the server automatically falls back to `gpiozero`'s `MockFactory` so that the WebSocket server remains fully functional for frontend development and testing.

---

## Endpoints

- **`ws://localhost:8000/ws`**: WebSocket endpoint for frontend clients.
- **`GET http://localhost:8000/`**: Server status, active client count, and pin info.
- **`POST http://localhost:8000/simulate-press`**: Trigger a simulated button press event without physical hardware.

---

## Simulating Button Presses via Terminal (`curl`)

You can test WebSocket event broadcasting directly from your terminal using `curl`:

### 1. Simple Press (Default Pin)
```bash
curl -X POST http://localhost:8000/simulate-press
```

### 2. Press with Explicit Pin & Action
```bash
curl -X POST http://localhost:8000/simulate-press \
  -H "Content-Type: application/json" \
  -d '{"action": "pressed", "pin": 17}'
```

### 3. Simulate Button Release
```bash
curl -X POST http://localhost:8000/simulate-press \
  -H "Content-Type: application/json" \
  -d '{"action": "released", "pin": 17}'
```

**Response Example:**
```json
{
  "status": "event_emitted",
  "event": {
    "event": "button_press",
    "action": "pressed",
    "pin": 17,
    "timestamp": 1725032876.123,
    "is_mock": true,
    "simulated": true
  }
}
```

---

## WebSocket Events

### 1. Button Press Event
Emitted when the button is pressed down:
```json
{
  "event": "button_press",
  "action": "pressed",
  "pin": 17,
  "timestamp": 1725032876.123,
  "is_mock": false
}
```

### 2. Button Release Event
Emitted when the button is released:
```json
{
  "event": "button_release",
  "action": "released",
  "pin": 17,
  "timestamp": 1725032876.456,
  "is_mock": false
}
```

---

## Next.js Integration Example

You can listen to button events in your Next.js application using a simple `useEffect` or custom hook:

```typescript
'use client';

import { useEffect, useState } from 'react';

export function useGpioButton(wsUrl = 'ws://localhost:8000/ws') {
  const [lastEvent, setLastEvent] = useState<any>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    function connect() {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setIsConnected(true);
        console.log('Connected to GPIO WebSocket');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.event === 'button_press') {
            console.log('Button pressed event received:', data);
            setLastEvent(data);
            // Handle Next.js state update or trigger action here
          }
        } catch (e) {
          console.error('Error parsing WebSocket message:', e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        // Automatically attempt reconnection
        reconnectTimeout = setTimeout(connect, 2000);
      };

      ws.onerror = (err) => {
        console.error('GPIO WebSocket error:', err);
        ws?.close();
      };
    }

    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      ws?.close();
    };
  }, [wsUrl]);

  return { lastEvent, isConnected };
}
```

