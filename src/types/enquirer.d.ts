declare module 'enquirer' {
  export interface PromptQuestion {
    type: string;
    name: string;
    message: string;
    initial?: unknown;
  }

  export function prompt<TAnswers extends Record<string, unknown>>(
    question: PromptQuestion | PromptQuestion[],
  ): Promise<TAnswers>;

  const enquirer: {
    prompt: typeof prompt;
  };

  export default enquirer;
}
