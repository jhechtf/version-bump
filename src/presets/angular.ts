import {
  CalculateBumpArgs,
  GenerateCommitArgs,
  GitConvention,
} from 'src/gitConvention.ts';
import { Injectable, semver } from 'deps';

@Injectable()
export default class AngularPreset extends GitConvention {
  calculateBump({
    currentVersion,
    commits,
    args: {
      releaseAs,
      firstRelease,
    },
  }: CalculateBumpArgs) {
    if (releaseAs || firstRelease) return releaseAs || currentVersion;
    const v = semver.parse(currentVersion);
    if (!v) throw Error(`Cannot parse current version ${currentVersion}`);

    const bumps = {
      major: false,
      minor: false,
      patch: false,
    };

    for (const { subject, body } of commits) {
      if (subject.includes('BREAKING:') || body?.includes('BREAKING')) {
        v.inc('major');
        return Promise.resolve(v.toString());
      }

      if (/^feat/i.test(subject) && !bumps.minor) {
        bumps.patch = false;
        bumps.minor = true;
      }

      if (/^fix/i.test(subject) && !bumps.minor && !bumps.patch) {
        bumps.patch = true;
      }
    }

    if (bumps.minor) {
      v.inc('minor');
      return Promise.resolve(v.toString());
    }

    // Default to patch increases.
    v.inc('patch');
    return Promise.resolve(v.toString());
  }

  generateCommit({
    version,
  }: GenerateCommitArgs): Promise<string> {
    return Promise.resolve(`chore(release): version ${version}`);
  }
}
