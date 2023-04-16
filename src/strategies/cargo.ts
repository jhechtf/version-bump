import { VersionStrategy } from '../versionStrategy.ts';
import { inject, injectable, readLines, resolve } from '../../deps.ts';
import { Git } from '../git.ts';

@injectable()
export default class CargoStrategy extends VersionStrategy {
  constructor(
    @inject(Git) public readonly git: Git,
    @inject('cwd') public readonly cwd: string,
  ) {
    super();
  }

  async bump(newVersion: string) {
    let file = await Deno.readTextFile(resolve(this.cwd, 'Cargo.toml'));
    let header = '';
    const split = file.split('\n');

    for (let i =0, line = split[i]; line; line = split[++i]) {
      if (line.match(/\[.*\]/)) {
        header = line.trim();
      }
      if (header === '[package]' && line.includes('version = ')) {
        let newLine = line.replace(/".*"/, `"${newVersion}"`);
        split[i] = newLine; 
        break;
      }
    }

    await Deno.writeTextFile(resolve(this.cwd, 'Cargo.toml'), split.join('\n'));

    return true;
  }

  async getCurrentVersion(): Promise<string> {
    let header = '';
    const file = await Deno.open(resolve(this.cwd, 'Cargo.toml'));
    for await (const line of readLines(file)) {
      if (line.match(/\[.*\]/)) {
        header = line.trim();
      }
      if (header === '[package]' && line.includes('version = ')) {
        const v = line.split('=').at(1)?.replaceAll('"', '');
        if (v) {
          file.close();
          return v.trim();
        }
      }
    }
    return '0.1.0';
  }
}
