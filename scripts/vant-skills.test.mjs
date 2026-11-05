import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { installSkill } from '../projects/vant-flow/skills/install.mjs';

test('installs a self-contained skill and preserves an existing customized installation', () => {
  const destination = fs.mkdtempSync(path.join(os.tmpdir(), 'vant-skills-'));
  try {
    const target = installSkill(destination);
    assert.ok(fs.existsSync(path.join(target, 'SKILL.md')));
    assert.ok(fs.existsSync(path.join(target, 'references/contracts.md')));
    assert.ok(fs.existsSync(path.join(target, 'examples/integration.ts')));
    fs.writeFileSync(path.join(target, 'SKILL.md'), 'Local customization');
    assert.throws(() => installSkill(destination), { code: 'EEXIST' });
    assert.equal(fs.readFileSync(path.join(target, 'SKILL.md'), 'utf8'), 'Local customization');
  } finally { fs.rmSync(destination, { recursive: true, force: true }); }
});

test('the CLI honors CODEX_HOME without installing into the real user profile', () => {
  const destination = fs.mkdtempSync(path.join(os.tmpdir(), 'vant-codex-home-'));
  try {
    const installer = fileURLToPath(new URL('../projects/vant-flow/skills/install.mjs', import.meta.url));
    const result = spawnSync(process.execPath, [installer, '--provider', 'codex'], {
      env: { ...process.env, CODEX_HOME: destination }, encoding: 'utf8'
    });
    assert.equal(result.status, 0, result.stderr);
    assert.ok(fs.existsSync(path.join(destination, 'skills/vant-flow/SKILL.md')));
  } finally { fs.rmSync(destination, { recursive: true, force: true }); }
});
