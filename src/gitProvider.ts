import { injectable, inversify } from '../deps.ts';

export interface GitProviderBuildable {
  new (url: URL): GitProvider;
}

export interface GitProvider {
  /**
   * @param from The Commit SHA or tag to go from
   * @param to The Commit SHA or tag to go until.
   * @description returns the git diff URL for the given provider.
   */
  gitDiffUrl(from: string, to?: string): string;
  /**
   * @param commit The current commit SHA.
   * @description returns the URL for the current commit SHA.
   */
  commitUrl(commit: string): string;
}

inversify.injectable();

export class GitProvider {
  // Class left empty on purpose. Do not directly user this class
}

export function makeGitProvider(n: GitProviderBuildable, url: URL) {
  return new n(url);
}
