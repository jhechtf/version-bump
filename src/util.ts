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
