import { type Args, parse } from './deps.ts';
import { argDefaults } from './defaults.ts';
import { container as inversifyContainer } from './src/container.ts';

/**
 * @description returns a parsed deno argument
 */
const parsed = parse(Deno.args, {
  alias: {
    releaseAs: 'release-as',
    allowEmpty: 'allow-empty',
  },
  string: ['release-as', 'allow-empty'],
  boolean: ['dryRun', 'historic', 'retag', 'y'],
  default: argDefaults,
});

inversifyContainer.bind<Args>('args').toConstantValue(parsed);

export default parsed;
