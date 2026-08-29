import { NextResponse } from 'next/server';
import { getScenarios } from '@/lib/scenarios';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const scenarios = await getScenarios();
    const intervalMs = 15000;
    const timestamp = Date.now();
    const currentIndex = scenarios.length > 0
      ? Math.floor(timestamp / intervalMs) % scenarios.length
      : 0;

    return NextResponse.json({
      scenarios,
      currentIndex,
      intervalMs,
      timestamp,
    });
  } catch (error) {
    console.error('Failed to get scenarios:', error);
    return NextResponse.json(
      { error: 'Failed to load scenarios' },
      { status: 500 }
    );
  }
}

