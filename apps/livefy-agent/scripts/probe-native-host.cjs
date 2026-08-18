/* global require, process, Buffer, setTimeout, clearTimeout, console */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { spawn } = require('node:child_process');

const executable = process.argv[2];
const executableArgs = process.argv.slice(3);
if (!executable) throw new Error('Native host executable path is required.');

const child = spawn(executable, executableArgs, { stdio: ['pipe', 'pipe', 'pipe'] });
const payload = Buffer.from(JSON.stringify({ id: 'probe-1', type: 'PING', payload: {} }), 'utf8');
const header = Buffer.alloc(4);
header.writeUInt32LE(payload.length, 0);
child.stdin.write(Buffer.concat([header, payload]));

let output = Buffer.alloc(0);
let stderr = '';
let completed = false;
const timeout = setTimeout(() => {
  if (completed) return;
  console.error('Native host probe timed out.');
  child.kill();
  process.exitCode = 1;
}, 10000);
child.stdout.on('data', chunk => {
  output = Buffer.concat([output, chunk]);
  if (output.length < 4) return;
  const length = output.readUInt32LE(0);
  if (output.length < 4 + length) return;
  completed = true;
  clearTimeout(timeout);
  console.log(output.subarray(4, 4 + length).toString('utf8'));
  child.stdin.end();
  child.kill();
});
child.stderr.on('data', chunk => { stderr += chunk.toString('utf8'); });
child.on('exit', code => {
  if (stderr.trim()) console.error(stderr.trim());
  if (!completed) process.exitCode = code || 1;
});
