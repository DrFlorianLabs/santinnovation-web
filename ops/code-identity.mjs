import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { REPO_ROOT, hashFile, canonicalJSON, sha256 } from './common.mjs';
const execute = promisify(execFile);
export async function codeIdentity() {
  let commit = null; let workingTreeDirty = null;
  try {
    const head = await execute('git', ['--no-optional-locks', 'rev-parse', 'HEAD'], { cwd: REPO_ROOT, timeout: 5000 });
    if (/^[a-f0-9]{40,64}$/.test(head.stdout.trim())) commit = head.stdout.trim();
    const status = await execute('git', ['--no-optional-locks', 'status', '--porcelain'], { cwd: REPO_ROOT, timeout: 5000 });
    workingTreeDirty = status.stdout.trim().length > 0;
  } catch { /* Archives remain restorable when the checkout has no Git metadata. */ }
  const files = {};
  for (const relative of ['package-lock.json', 'cms/package-lock.json', 'cms/scripts/export.ts', 'cms/scripts/ops-projection.ts', 'cms/src/payload.config.ts', 'scripts/project-content.mjs', 'ops/archive.mjs', 'ops/backup.mjs', 'ops/restore.mjs']) files[relative] = await hashFile(path.join(REPO_ROOT, relative));
  return { commit, workingTreeDirty, verificationFiles: files, fingerprint: sha256(canonicalJSON(files)), sourceCodeIncluded: false };
}
