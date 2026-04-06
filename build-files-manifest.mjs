import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const root = path.dirname(__filename);
const manifestPath = path.join(root, 'files.json');

async function collectFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const out = [];

  for (const entry of entries) {
    if (entry.name === '.git') continue;

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = await collectFiles(fullPath);
      out.push(...nested);
      continue;
    }

    if (!entry.isFile()) continue;

    const rel = path.relative(root, fullPath).split(path.sep).join('/');
    if (rel === 'files.json') continue;

    const stats = await fs.stat(fullPath);
    const folder = path.posix.dirname(rel) === '.' ? 'root' : path.posix.dirname(rel);

    out.push({
      path: rel,
      name: path.basename(rel),
      folder,
      ext: path.extname(rel).slice(1).toLowerCase(),
      size: stats.size
    });
  }

  return out;
}

async function main() {
  const files = await collectFiles(root);
  const manifest = {
    files
  };

  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  process.stdout.write(`Generated files.json with ${files.length} files.\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error}\n`);
  process.exit(1);
});
