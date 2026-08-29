'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { ScenarioItem } from './scenarios';

const INTERVAL_MS = 15000;

export function useScenario() {
  const [scenarios, setScenarios] = useState<ScenarioItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const scenariosRef = useRef<ScenarioItem[]>([]);
  scenariosRef.current = scenarios;

  const updateIndex = useCallback(() => {
    const list = scenariosRef.current;
    if (list.length > 0) {
      const nextIdx = Math.floor(Date.now() / INTERVAL_MS) % list.length;
      setCurrentIndex(nextIdx);
    }
  }, []);

  const fetchScenarios = useCallback(async () => {
    try {
      const res = await fetch('/api/scenarios');
      if (!res.ok) {
        throw new Error(`Failed to fetch scenarios: ${res.statusText}`);
      }
      const data = await res.json();
      if (Array.isArray(data.scenarios) && data.scenarios.length > 0) {
        setScenarios(data.scenarios);
        const calcIdx = Math.floor(Date.now() / INTERVAL_MS) % data.scenarios.length;
        setCurrentIndex(calcIdx);
      }
      setError(null);
    } catch (err: any) {
      console.error('Error fetching scenarios:', err);
      setError(err?.message || 'Error fetching scenarios');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScenarios();

    // Re-fetch scenarios periodically to pick up any changes in the CSV file
    const refreshInterval = setInterval(() => {
      fetchScenarios();
    }, INTERVAL_MS * 2);

    return () => clearInterval(refreshInterval);
  }, [fetchScenarios]);

  // Synchronized 15-second rotation based on epoch time
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let intervalId: NodeJS.Timeout;

    const scheduleNextTick = () => {
      updateIndex();
      const now = Date.now();
      const delay = INTERVAL_MS - (now % INTERVAL_MS);

      timeoutId = setTimeout(() => {
        updateIndex();
        intervalId = setInterval(updateIndex, INTERVAL_MS);
      }, delay);
    };

    scheduleNextTick();

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [updateIndex, scenarios.length]);

  const currentScenario: ScenarioItem | null =
    scenarios.length > 0 ? scenarios[currentIndex % scenarios.length] : null;

  return {
    scenarios,
    currentScenario,
    currentIndex,
    isLoading,
    error,
  };
}

