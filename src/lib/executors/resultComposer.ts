import type { SolutionResult } from '@/types/radar';
import type { ExecutorResult } from '@/types/executor';

type ComposedResult = Pick<SolutionResult, 'usableOutput' | 'copyableTemplates' | 'nextRefinementPrompt'>;

function dedupeByTitle<T extends { title: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter(item => {
    if (seen.has(item.title)) return false;
    seen.add(item.title);
    return true;
  });
}

function mergeSectionsByHeading<T extends { heading: string; content: string }>(items: T[]): T[] {
  const sectionMap = new Map<string, string>();

  for (const item of items) {
    const existing = sectionMap.get(item.heading);
    const content = item.content.trim();

    if (!existing) {
      sectionMap.set(item.heading, content);
      continue;
    }

    if (existing.trim() === content) continue;

    sectionMap.set(item.heading, `${existing}\n\n${content}`);
  }

  return Array.from(sectionMap.entries()).map(([heading, content]) => ({
    heading,
    content,
  })) as T[];
}

export function composeExecutorResults(
  title: string,
  executorResults: ExecutorResult[],
  fallback: ComposedResult
): ComposedResult {
  const completedResults = executorResults.filter(result => result.status === 'completed');
  const sections = mergeSectionsByHeading(completedResults.flatMap(result => result.output.sections ?? []));
  const copyableTemplates = completedResults.flatMap(result => result.output.copyableBlocks ?? []);

  return {
    usableOutput: {
      title,
      sections: sections.length > 0 ? sections : fallback.usableOutput.sections,
    },
    copyableTemplates: dedupeByTitle(
      copyableTemplates.length > 0 ? copyableTemplates : fallback.copyableTemplates
    ),
    nextRefinementPrompt: fallback.nextRefinementPrompt,
  };
}
