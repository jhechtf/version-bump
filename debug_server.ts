import { Application } from 'https://deno.land/x/abc@v1.3.3/mod.ts';

const app = new Application();
await Deno.writeTextFile('pid', Deno.pid.toString());
app.get('/version-bump/*', async (c) => {
  console.info(c.path, c.params);
  const filePath = c.path.replace('/version-bump/', '');

  if (/^[^a-z]/.test(filePath)) return c.response;

  const content = await Deno.readTextFile(filePath)
    .catch((e) => e);

  if (content instanceof Error) {
    console.info('Whoops!');
    c.response.body = 'please hold...';
    c.response.status = 400;
    return c.response;
  }

  console.info('File Found, serving');
  return content;
}).start({ port: 3030 });
