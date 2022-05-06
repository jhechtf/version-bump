import {
  CalculateBumpArgs,
  GenerateCommitArgs,
  GitConvention,
} from '../gitConvention.ts';
import { injectable } from '../../deps.ts';

@injectable()
export default class TestPreset extends GitConvention {
  calculateBump({
    currentVersion,
    args: {
      releaseAs,
      firstRelease,
    },
  }: CalculateBumpArgs) {
    if (releaseAs || firstRelease) return releaseAs || currentVersion;
    console.info('Current Version', currentVersion);
    const cur = currentVersion.split('.').map((v) => Number(v));
    console.info('new version', cur[0] + 1);
    return (cur[0] + 1).toString();
  }

  generateCommit({
    version,
  }: GenerateCommitArgs) {
    return Promise.resolve(`Release ${version}`);
  }
}
