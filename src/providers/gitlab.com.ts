import { IGitProvider } from 'src/provider.ts';

export default class GitlabProvider implements IGitProvider {
  constructor(public readonly url: URL) {
  }
  gitDiffUrl(from: string, to = 'HEAD'): string {
    return `https://${this.url.hostname}${
      this.url.port !== '443' ? ':' + this.url.port : ''
    }${this.url.pathname}/-/compare/${from}..${to}`;
  }
}
