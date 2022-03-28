export interface IGitProvider {
  gitDiffUrl(from: string, to?: string): string;
}

export interface GitProviderBuildable {
  new (url: URL): IGitProvider;
}

export const providerMap = new Map<string, GitProviderBuildable>();

export function makeGitProvider(n: GitProviderBuildable, url: URL) {
  return new n(url);
}

export function GitProvider<T extends GitProviderBuildable>(host: string) {
  return (constructor: T) => {
    if(!providerMap.has(host)) {
      providerMap.set(host, constructor);
    }
  }
}

export function determineGitProvider(host: string): GitProviderBuildable | undefined {
  return providerMap.get(host);
}
