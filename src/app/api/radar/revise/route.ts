import { NextRequest, NextResponse } from 'next/server';
import { reviseSolutionResult } from '@/lib/solutionRevisionEngine';
import type { SolutionRevisionMode } from '@/lib/solutionWorkspace';
import type { SolutionResult } from '@/types/radar';

type ReviseRequestBody = {
  previousResult?: SolutionResult;
  instruction?: string;
  mode?: SolutionRevisionMode;
  contractId?: string;
};

const allowedModes = new Set<SolutionRevisionMode>(['revise', 'finalize', 'action']);

function isValidSolutionResult(value: unknown): value is SolutionResult {
  const result = value as SolutionResult | undefined;
  return Boolean(
    result?.problemCore?.summary
      && result?.usableOutput?.title
      && Array.isArray(result?.usableOutput?.sections)
      && Array.isArray(result?.copyableTemplates)
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as ReviseRequestBody;
    const instruction = body.instruction?.trim();

    if (!instruction) {
      return NextResponse.json(
        { error: 'Instruction is required.' },
        { status: 400 }
      );
    }

    if (!isValidSolutionResult(body.previousResult)) {
      return NextResponse.json(
        { error: 'A valid previousResult is required.' },
        { status: 400 }
      );
    }

    const mode = body.mode && allowedModes.has(body.mode) ? body.mode : undefined;
    const result = reviseSolutionResult({
      previousResult: body.previousResult,
      instruction,
      mode,
      contractId: body.contractId,
    });

    return NextResponse.json({ result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to revise solution result.';
    const status = message.includes('required') ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
