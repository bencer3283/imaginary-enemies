'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { ScenarioItem } from './scenarios';

const WS_URL = process.env.NEXT_PUBLIC_GPIO_WS_URL || 'ws://localhost:8080/ws';

export function useScenario() {
  const [scenarios, setScenarios] = useState<ScenarioItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  const scenariosRef = useRef<ScenarioItem[]>([]);

  useEffect(() => {
    scenariosRef.current = scenarios;
  }, [scenarios]);

  const nextScenario = useCallback(() => {
    setCurrentIndex((prev) => {
      const list = scenariosRef.current;
      if (list.length === 0) return 0;
      return (prev + 1) % list.length;
    });
  }, []);

  const prevScenario = useCallback(() => {
    setCurrentIndex((prev) => {
      const list = scenariosRef.current;
      if (list.length === 0) return 0;
      return (prev - 1 + list.length) % list.length;
    });
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadScenarios() {
      try {
        const res = await fetch('/api/scenarios');
        if (!res.ok) {
          throw new Error(`Failed to fetch scenarios: ${res.statusText}`);
        }
        const data = await res.json();
        if (isMounted && Array.isArray(data.scenarios) && data.scenarios.length > 0) {
          setScenarios(data.scenarios);
          setError(null);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const message = err instanceof Error ? err.message : 'Error fetching scenarios';
          console.error('Error fetching scenarios:', message);
          setError(message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadScenarios();

    return () => {
      isMounted = false;
    };
  }, []);

  // Connect to the Python GPIO WebSocket server
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: NodeJS.Timeout;
    let isUnmounted = false;

    function connect() {
      if (isUnmounted) return;

      try {
        ws = new WebSocket(WS_URL);

        ws.onopen = () => {
          if (isUnmounted) return;
          console.log('[GPIO WebSocket] Connected to', WS_URL);
          setIsConnected(true);
        };

        ws.onmessage = (event) => {
          if (isUnmounted) return;
          try {
            const data = JSON.parse(event.data);
            console.log('[GPIO WebSocket] Event received:', data);

            // Handle button press events
            if (
              data.event === 'button_press' ||
              data.event === 'button_pressed' ||
              data.action === 'pressed'
            ) {
              console.log('[GPIO WebSocket] Button press detected! Advancing to next scenario.');
              nextScenario();
            }
          } catch (e) {
            console.error('[GPIO WebSocket] Error parsing WebSocket message:', e);
          }
        };

        ws.onclose = () => {
          if (isUnmounted) return;
          console.log('[GPIO WebSocket] Disconnected. Reconnecting in 2 seconds...');
          setIsConnected(false);
          reconnectTimer = setTimeout(connect, 2000);
        };

        ws.onerror = (err) => {
          console.warn('[GPIO WebSocket] WebSocket error:', err);
          ws?.close();
        };
      } catch (err) {
        console.warn('[GPIO WebSocket] Failed to create WebSocket connection:', err);
        reconnectTimer = setTimeout(connect, 2000);
      }
    }

    connect();

    return () => {
      isUnmounted = true;
      clearTimeout(reconnectTimer);
      if (ws) {
        ws.close();
      }
    };
  }, [nextScenario]);

  const currentScenario: ScenarioItem | null =
    scenarios.length > 0 ? scenarios[currentIndex % scenarios.length] : null;

  return {
    scenarios,
    currentScenario,
    currentIndex,
    isLoading,
    error,
    isConnected,
    nextScenario,
    prevScenario,
  };
}

