import { NextResponse } from 'next/server';
import { getScenarios } from '@/lib/scenarios';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const scenarios = await getScenarios();
    return NextResponse.json({
      scenarios,
      total: scenarios.length,
    });
  } catch (error) {
    console.error('Failed to get scenarios:', error);
    return NextResponse.json(
      { error: 'Failed to load scenarios' },
      { status: 500 }
    );
  }
}

