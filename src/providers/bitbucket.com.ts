import { GitProvider } from '../gitProvider.ts';

export default class BitbucketProvider implements GitProvider {
  constructor(public readonly url: URL) {}
  gitDiffUrl(from: string, to = 'HEAD') {
    return `https://${this.url.hostname}${this.url.pathname}/compare/${from}..${to}`;
  }
  commitUrl(commit: string): string {
    return `https://${this.url.hostname}${this.url.pathname}/commit/${commit}`;
  }
}
