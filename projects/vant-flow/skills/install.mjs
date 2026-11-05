import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function installSkill(destination) {
  const source = path.join(path.dirname(fileURLToPath(import.meta.url)), 'vant-flow');
  const target = path.resolve(destination, 'vant-flow');
  fs.mkdirSync(path.dirname(target), { recursive: true });
  // Exclusive creation also protects existing customizations and symlink destinations.
  fs.mkdirSync(target);
  fs.cpSync(source, target, { recursive: true, force: false, errorOnExist: true });
  return target;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const providers = { codex: path.join(process.env.CODEX_HOME || path.join(os.homedir(), '.codex'), 'skills'), claude: path.join(os.homedir(), '.claude/skills') };
  const destination = args.length === 2 && args[0] === '--provider' ? providers[args[1]]
    : args.length === 2 && args[0] === '--dest' ? args[1] : undefined;
  if (!destination) {
    console.error('Usage: node install.mjs --provider codex|claude OR --dest <skills-directory>');
    process.exitCode = 1;
  } else {
    try { console.log(`Installed Vant Flow skill: ${installSkill(destination)}`); }
    catch (error) { console.error(`Skill installation failed: ${error.message}. Existing installations are never overwritten.`); process.exitCode = 1; }
  }
}
