export async function fileExists(path: string): Promise<boolean> {
  try {
    await Deno.stat(path);
    return true;
  } catch (e) {
    if (e && e instanceof Deno.errors.NotFound) {
      return false;
    } else {
      throw e;
    }
  }
}

export function capitalize(str: string): string {
  const diff = str.length - str.trimStart().length;
  const trimmedString = str.trimStart();
  return (str.trimStart().charAt(0).toLocaleUpperCase() +
    trimmedString.slice(1)).padStart(diff, ' ');
}

export async function runCommand(
  command: string,
  args: string[] = [],
  cwd = Deno.cwd(),
): Promise<{ code: number; stdout: string }> {
  const prefix = Deno.build.os === 'windows' ? ['cmd', '/c'] : [];
  const commandRun = await Deno.run({
    cmd: prefix.concat([
      command,
      ...args,
    ]),
    stderr: 'piped',
    stdout: 'piped',
    stdin: 'null',
    cwd,
  });

  const decoder = new TextDecoder();
  const { code } = await commandRun.status();
  const errorOutput = decoder.decode(await commandRun.stderrOutput());
  const output = decoder.decode(await commandRun.output());

  if (code !== 0) {
    throw Error(errorOutput);
  }

  commandRun.close();

  return {
    stdout: output,
    code,
  };
}
