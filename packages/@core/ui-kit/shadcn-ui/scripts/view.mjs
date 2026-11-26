import { spawnSync } from 'node:child_process';
import process from 'node:process';
import readline from 'node:readline/promises';

let items = process.argv.slice(2).filter((arg) => arg !== '--');

if (items.length === 0) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const answer = (
    await rl.question('Component name (e.g. trace or @shadcn/trace): ')
  ).trim();
  rl.close();
  if (!answer) {
    process.exit(0);
  }
  items = answer.split(/\s+/);
}

const normalized = items.map((item) => {
  if (!/^[\w@/-]+$/.test(item)) {
    console.error(`Invalid registry item: ${item}`);
    process.exit(1);
  }
  return item.startsWith('@') || item.includes('/') ? item : `@shadcn/${item}`;
});

const result = spawnSync(
  'pnpm',
  ['dlx', 'shadcn-vue@latest', 'view', ...normalized],
  { shell: process.platform === 'win32', stdio: 'inherit' },
);

process.exit(result.status ?? 1);
