import { ERROR_PATTERNS } from '../config/errorPatterns';
import { TranslatedError } from '../types';

let nextId = 0;

export function translateError(rawError: string): TranslatedError | null {
  for (const pattern of ERROR_PATTERNS) {
    if (pattern.pattern.test(rawError)) {
      return {
        id: `err-${++nextId}`,
        rawError,
        title: pattern.title,
        explanation: pattern.explanation,
        commonCauses: pattern.commonCauses,
        suggestedFix: pattern.suggestedFix,
        relatedLessonId: pattern.relatedLessonId,
        relatedGlossaryTerms: pattern.relatedGlossaryTerms,
        severity: pattern.severity,
      };
    }
  }
  return null;
}
