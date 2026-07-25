export interface GitClient {
  root(): Promise<string | undefined>;
}
