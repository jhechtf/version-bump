import { fileExists } from '../util.ts';
import { type Args, inject, injectable, resolve } from '../../deps.ts';
import { Git } from '../git.ts';
import JsonStrategy from './json.ts';

@injectable()
export default class DenoJsonStrategy extends JsonStrategy {
  constructor(
    @inject(Git) public readonly git: Git,
    @inject('cwd') public readonly cwd: string,
    @inject('args') public readonly args: Args,
  ) {
    super(git, cwd, args, 'deno.json');
  }

  async getCurrentVersion(): Promise<string> {
    this.fileName = await this.getFilePath();
    return super.getCurrentVersion();
  }

  async bump(newVersion: string): Promise<boolean> {
    this.fileName = await this.getFilePath();
    return super.bump(newVersion);
  }

  async getFilePath() {
    if (await fileExists(resolve(this.cwd, 'deno.jsonc'))) {
      return resolve(this.cwd, 'deno.jsonc');
    } else {
      return resolve(this.cwd, 'deno.json');
    }
  }
}
