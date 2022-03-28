import { BumpStrategy } from 'src/strategy.ts';
import { readLines, resolve } from 'deps';

export default class DenoTsStrategy implements BumpStrategy {
  #cwd: string;
  FIND = /VERSION\s?(:|=)\s?('|")(?<currentVersion>.*?)\2(,|;)?/;
  constructor(readonly cwd: string = Deno.cwd()) {
    this.#cwd = cwd;
  }

  async bump(newVersion: string) {
    const content = await Deno.readTextFile(
      resolve(
        this.#cwd,
        'deps.ts',
      ),
    );

    // Replace the version
    const replaced = content.replace(
      this.FIND,
      `VERSION $1 $2${newVersion}$2$4`,
    );
    // Try to write the file
    try {
      await Deno.writeTextFile(resolve(this.#cwd, 'deps.ts'), replaced);
      return true;
    } catch (e) {
      // Output the error and return false;
      console.error(e);
      return false;
    }
  }

  async getCurrentVersion(): Promise<string> {
    const file = resolve(this.#cwd, 'deps.ts');
    const fileRef = await Deno.open(file);

    for await (const line of readLines(fileRef)) {
      if (this.FIND.test(line)) {
        const matches = this.FIND.exec(line);
        if (matches?.groups?.currentVersion) {
          return matches.groups.currentVersion;
        }
      }
    }

    throw new Deno.errors.NotFound('Cannot find version export in ' + file);
  }
}
