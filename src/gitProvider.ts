import { Args, Injectable } from 'deps';

export interface GitProviderBuildable {
  new (args: Args, url: URL): GitProvider;
}

export interface GitProvider {
  gitDiffUrl(from: string, to?: string): string;
  commitUrl(commit: string): string;
}

@Injectable()
export class GitProvider {
  // Class left empty on purpose. Do not directly user this class
}

export function makeGitProvider(n: GitProviderBuildable, args: Args, url: URL) {
  return new n(args, url);
}
