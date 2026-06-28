import type { FixStep } from "@/types";

export function parseFixPrompt(fixPrompt: string): {
  isMultiStep: boolean;
  steps: FixStep[];
  rawPrompt: string;
} {
  const stepHeaderPattern = /STEP\s+(\d+)\s*[—-]\s*([^:\n]+):\s*/gi;
  const matches = Array.from(fixPrompt.matchAll(stepHeaderPattern));

  if (matches.length < 2) {
    return { isMultiStep: false, steps: [], rawPrompt: fixPrompt };
  }

  const steps: FixStep[] = matches.map((match, index) => {
    const stepNumber = parseInt(match[1], 10);
    const filePath = match[2].trim();
    const instructionStart = (match.index ?? 0) + match[0].length;
    const instructionEnd =
      index + 1 < matches.length
        ? (matches[index + 1].index ?? fixPrompt.length)
        : fixPrompt.length;
    const instruction = fixPrompt.slice(instructionStart, instructionEnd).trim();

    return { stepNumber, filePath, instruction };
  });

  return { isMultiStep: true, steps, rawPrompt: fixPrompt };
}

export function formatAllSteps(steps: FixStep[]): string {
  return steps
    .map(
      (step) =>
        `STEP ${step.stepNumber} — ${step.filePath}: ${step.instruction}`
    )
    .join("\n\n");
}
