import 'https://esm.sh/@abraham/reflection@0.12.0';

import { unmanaged as _unmanaged } from 'https://esm.sh/inversify@6.0.1';

export { green, red } from 'https://deno.land/std@0.132.0/fmt/colors.ts';

export * as semver from 'https://deno.land/x/semver@v1.4.0/mod.ts';

export { type Args, parse } from 'https://deno.land/std@0.132.0/flags/mod.ts';

export * as inversify from 'https://esm.sh/inversify@6.0.1';
// Next line is a temporary shim.

export const unmanaged = _unmanaged as () => (
  // deno-lint-ignore no-explicit-any
  target: any,
  targetKey: string | undefined,
  index: number,
) => void;
export {
  Container,
  inject,
  injectable,
  type interfaces,
  postConstruct,
} from 'https://esm.sh/inversify@6.0.1';

export {
  bgGreen,
  bgRed,
  bgYellow,
} from 'https://deno.land/std@0.132.0/fmt/colors.ts';

export {
  dirname,
  fromFileUrl,
  join,
  posix,
  resolve,
  toFileUrl,
} from 'https://deno.land/std@0.132.0/path/mod.ts';

export { readLines } from 'https://deno.land/std@0.132.0/io/buffer.ts';

export {
  assertEquals,
  assertMatch,
  assertNotEquals,
  assertObjectMatch,
  assertRejects,
  assertThrows,
} from 'https://deno.land/std@0.132.0/testing/asserts.ts';

export {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  it,
} from 'https://deno.land/std@0.191.0/testing/bdd.ts';

export {
  emptyDir,
  ensureDir,
  ensureFile,
} from 'https://deno.land/std@0.132.0/fs/mod.ts';

export const VERSION = '2.0.1';
