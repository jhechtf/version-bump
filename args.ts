import { Args, Injectable, parse } from 'deps';
import { argDefaults } from './defaults.ts';
/**
 * @description returns a parsed deno argument
 */
const parsed = parse(Deno.args, {
  alias: {
    releaseAs: 'release-as',
    allowEmpty: 'allow-empty',
  },
  string: ['release-as'],
  default: argDefaults,
});

@Injectable({ isSingleton: true })
export class VersionArgs {
  args: Args = parsed;
}

export default parsed;
