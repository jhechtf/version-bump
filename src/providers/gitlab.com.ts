import { GitProvider } from '../gitProvider.ts';

export default class GitlabProvider implements GitProvider {
  constructor(public readonly url: URL) {
  }
  gitDiffUrl(from: string, to = 'HEAD'): string {
    return `https://${this.url.hostname}${this.url.pathname}/-/compare/${from}..${to}`;
  }
  commitUrl(commit: string): string {
    return `https://${this.url.hostname}${this.url.pathname}/-/commit/${commit}`;
  }
}
