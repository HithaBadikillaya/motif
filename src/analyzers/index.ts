export interface Analyzer<TInput, TResult> {
  analyze(input: TInput): Promise<TResult> | TResult;
}
