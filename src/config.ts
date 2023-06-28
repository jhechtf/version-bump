import { type Args, inject, injectable } from '../deps.ts';
import { type LoggerInstance } from '../logger.ts';
import { container } from './container.ts';
export interface ConfigArgs {
  releaseAs: string;
  allowEmpty: boolean;
  dryRun: boolean;
  preset: string;
  versionStrategy: string;
  changelogWriter: string;
  changelogPath: string;
  versionPrefix: string;
  gitProvider: string;
  // historic options below
  historic: boolean;
  retag: boolean;
}

@injectable()
export default class ConfigLoader {
  constructor(
    @inject('cwd') public readonly cwd: string,
    @inject('args') public readonly args: Args,
    @inject('logger') public readonly log: LoggerInstance,
  ) {
  }

  async loadConfig() {
    const configPath = `${this.cwd}/${this.args.config}`;
    this.log.debug('Config path', configPath);
    const fileContents = await Deno.readTextFile(configPath)
      .then((res) => JSON.parse(res) as Partial<ConfigArgs>)
      .catch(() => ({}));

    const newArgs = Object.assign(this.args, fileContents);
    this.log.debug('Args after load', newArgs);
    container.rebind<Args>('args').toConstantValue(newArgs);
  }
}
