import { GitProvider } from '../gitProvider.ts';
import { injectable, inversify } from '../../deps.ts';

@injectable()
export default class TestGitProvider extends GitProvider {
  constructor(public readonly url: URL) {
    super();
  }
  gitDiffUrl(from: string, to: string) {
    return `https://custom-domain-name.com/repo/${from}..${to}`;
  }
  commitUrl(commit: string) {
    return `https://custom-domain-name.com/repo/-/${commit}`;
  }
}
