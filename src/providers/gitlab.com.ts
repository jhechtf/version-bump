import { GitProvider } from '../gitProvider.ts';
import { injectable, inversify, unmanaged } from '../../deps.ts';

@injectable()
export default class GitlabProvider implements GitProvider {
  constructor(@unmanaged() public readonly url: URL) {
  }
  gitDiffUrl(from: string, to = 'HEAD'): string {
    return `https://${this.url.hostname}${this.url.pathname}/-/compare/${from}..${to}`;
  }
  commitUrl(commit: string): string {
    return `https://${this.url.hostname}${this.url.pathname}/-/commit/${commit}`;
  }
}
