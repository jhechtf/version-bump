import { Args, Injectable } from 'deps';

export interface GitProviderBuildable {
  new (args: Args, url: URL): GitProvider;
}

export interface GitProvider {
  /**
   * 
   * @param from The Commit SHA or tag to go from
   * @param to The Commit SHA or tag to go until.
   * @description returns the git diff URL for the given provider.
   */
  gitDiffUrl(from: string, to?: string): string;
  /**
   * 
   * @param commit The current commit SHA.
   * @description returns the URL for the current commit SHA.
   */
  commitUrl(commit: string): string;
}

@Injectable()
export class GitProvider {
  // Class left empty on purpose. Do not directly user this class
}

export function makeGitProvider(n: GitProviderBuildable, args: Args, url: URL) {
  return new n(args, url);
}
