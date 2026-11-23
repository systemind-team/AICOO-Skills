// Runs only on disposable hosted QA runners.
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createServer } from 'node:http';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
assert.equal(process.env.GITHUB_ACTIONS, 'true');
const directory = join(homedir(), '.aicoo');
const payload = join(tmpdir(), 'aicoo-onboarding-qa.json');
const session = 'synthetic-preview-session';
const observed = [];
const server = createServer(async (req, res) => {
  let body = ''; for await (const part of req) body += part;
  observed.push([req.method, req.url, req.headers.authorization, body]);
  res.writeHead(200, {'content-type':'application/json'}); res.end('{"ok":true}');
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
try {
  const origin = 'http://127.0.0.1:' + server.address().port;
  const env = {...process.env, AICOO_API_BASE_URL: origin + '/api/v1'};
  delete env.AICOO_API_KEY; delete env.PULSE_API_KEY;
  await mkdir(directory);
  try {
    await writeFile(join(directory, 'credentials.json'), JSON.stringify({version:1, base_url:origin, client_id:'qa', access_token:session, expires_at:Date.now()+3600000}));
    await writeFile(payload, '\uFEFF' + JSON.stringify({query:'你好'}));
    const run = (...args) => promisify(execFile)(process.execPath, ['scripts/aicoo-request.mjs',...args], {env});
    for (const args of [['POST','init'],['GET','os/status'],['POST','os/notes/search','@'+payload]]) {
      const {stdout} = await run(...args); assert.deepEqual(JSON.parse(stdout), {ok:true}); assert.ok(!stdout.includes(session));
    }
    assert.deepEqual(observed.map(([m,path])=>[m,path]), [['POST','/api/v1/init'],['GET','/api/v1/os/status'],['POST','/api/v1/os/notes/search']]);
    assert.ok(observed.every(([, , auth]) => auth === 'Bearer ' + session));
    assert.deepEqual(JSON.parse(observed[2][3]), {query:'你好'});
  } finally { await rm(directory, {recursive:true}); await rm(payload, {force:true}); }
} finally { server.close(); }
