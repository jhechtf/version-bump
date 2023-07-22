import { VersionStrategy } from '../versionStrategy.ts';
import { inject, injectable, inversify, resolve } from '../../deps.ts';

@injectable()
export default class TestVersionStrategy extends VersionStrategy {
  constructor(
    @inject('cwd') public readonly cwd: string,
  ) {
    super();
  }

  async bump(newVersion: string) {
    try {
      await Deno.writeTextFile(resolve(this.cwd, '.version'), newVersion);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  async getCurrentVersion() {
    const current = await Deno.readTextFile(resolve(this.cwd, '.version'))
      .catch(() => '');
    if (current.trim().length === 0) return '0.1.0';
    return current;
  }
}
