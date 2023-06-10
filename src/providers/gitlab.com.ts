import { GitProvider } from '../gitProvider.ts';
import { Container, inversify } from '../../deps.ts';
const unmanaged = inversify.unmanaged as () => (
  target: any,
  targetKey: string | undefined,
  index: number,
) => void;

@inversify.injectable()
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
