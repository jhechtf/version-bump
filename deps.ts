import 'https://esm.sh/@abraham/reflection@0.10.0';

export { green, red } from 'https://deno.land/std@0.132.0/fmt/colors.ts';

export * as semver from 'https://deno.land/x/semver@v1.4.0/mod.ts';

export { type Args, parse } from 'https://deno.land/std@0.132.0/flags/mod.ts';

export {
  container,
  type DependencyContainer,
  type FactoryFunction,
  inject,
  injectable,
  injectAll,
  predicateAwareClassFactory,
  registry,
  singleton,
} from 'https://esm.sh/tsyringe@4.6.0';

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
  emptyDir,
  ensureDir,
  ensureFile,
} from 'https://deno.land/std@0.132.0/fs/mod.ts';

export const VERSION = '0.2.1';
