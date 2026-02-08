import { randomBytes } from 'crypto';

/**
 * Generates a unique case ID in the format: CIVIC-XXXX-XXXX
 * Uses random bytes to ensure uniqueness
 */
export const generateCaseId = (): string => {
  // Generate 4 random hex characters (2 bytes = 4 hex chars)
  const part1 = randomBytes(2).toString('hex').toUpperCase();
  const part2 = randomBytes(2).toString('hex').toUpperCase();
  
  return `CIVIC-${part1}-${part2}`;
};

/**
 * Generates a unique case ID and checks for collisions
 * Retries if collision detected (very unlikely)
 */
export const generateUniqueCaseId = async (
  checkIssues: (caseId: string) => Promise<boolean>,
  checkSuggestions: (caseId: string) => Promise<boolean>,
  maxRetries: number = 10
): Promise<string> => {
  for (let i = 0; i < maxRetries; i++) {
    const caseId = generateCaseId();
    const existsInIssues = await checkIssues(caseId);
    const existsInSuggestions = await checkSuggestions(caseId);
    
    if (!existsInIssues && !existsInSuggestions) {
      return caseId;
    }
  }
  
  // If we've exhausted retries, add timestamp to ensure uniqueness
  const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
  return `CIVIC-${randomBytes(2).toString('hex').toUpperCase()}-${timestamp}`;
};
