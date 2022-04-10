import { IGitProvider } from 'src/provider.ts';

export default class BitbucketProvider implements IGitProvider {
  constructor(public readonly url: URL) {}
  gitDiffUrl(from: string, to = 'HEAD') {
    return `https://${this.url.hostname}${this.url.pathname}/compare/${from}..${to}`;
  }
  commitUrl(commit: string): string {
    return `https://${this.url.hostname}${this.url.pathname}/commit/${commit}`;
  }
}
