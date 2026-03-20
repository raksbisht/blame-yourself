const LOCKFILES = new Set([
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'pnpm-lock.yml',
  'Gemfile.lock',
  'composer.lock',
  'Cargo.lock',
  'poetry.lock',
  'Pipfile.lock',
  'packages.lock.json',
]);

const BINARY_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif', '.svg',
  '.ico', '.bmp', '.tiff',
  '.woff', '.woff2', '.ttf', '.otf', '.eot',
  '.pdf', '.zip', '.tar', '.gz', '.bz2', '.xz', '.7z',
  '.mp3', '.mp4', '.wav', '.ogg', '.webm', '.mov', '.avi',
  '.exe', '.dll', '.so', '.dylib', '.a', '.lib',
  '.pyc', '.pyo', '.class',
  '.db', '.sqlite', '.sqlite3',
  '.DS_Store',
]);

export function shouldSkip(filepath) {
  const basename = filepath.split('/').pop();

  if (LOCKFILES.has(basename)) return true;
  if (basename.endsWith('.lock')) return true;

  const dotIndex = basename.lastIndexOf('.');
  if (dotIndex !== -1) {
    const ext = basename.slice(dotIndex).toLowerCase();
    if (BINARY_EXTENSIONS.has(ext)) return true;
  }

  return false;
}
