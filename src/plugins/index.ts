export interface MotifPlugin {
  readonly name: string;
  activate(): Promise<void> | void;
}
