import { Args, container, injectable, parse } from './deps.ts';
import { argDefaults } from './defaults.ts';
/**
 * @description returns a parsed deno argument
 */
const parsed = parse(Deno.args, {
  alias: {
    releaseAs: 'release-as',
    allowEmpty: 'allow-empty',
  },
  string: ['release-as', 'allow-empty'],
  boolean: ['dryRun'],
  default: argDefaults,
});

@injectable()
export class VersionArgs {
  args: Args = parsed;
}

container.register<Args>('args', { useValue: parsed });

export default parsed;
