import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createDiscovery, listDiscoveriesByUserId } from '@/lib/repositories/discoveries';
import type { CreateDiscoveryInput } from '@/types/discovery';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const items = await listDiscoveriesByUserId(user.id);
    return NextResponse.json({
      success: true,
      items,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load discoveries',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const input = await request.json() as CreateDiscoveryInput;
    const saved = await createDiscovery(user.id, input);

    return NextResponse.json({
      success: true,
      item: saved,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save discovery',
      },
      { status: 500 }
    );
  }
}
