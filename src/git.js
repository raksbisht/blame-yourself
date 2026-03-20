import { execSync, spawnSync } from 'node:child_process';

export function getCurrentUser() {
  try {
    const name = execSync('git config user.name', { encoding: 'utf8' }).trim();
    const email = execSync('git config user.email', { encoding: 'utf8' }).trim();
    return { name, email };
  } catch {
    return null;
  }
}

export function getTrackedFiles(patterns) {
  try {
    const extra = patterns && patterns.length > 0 ? ['--', ...patterns] : [];
    const result = spawnSync('git', ['ls-files', ...extra], { encoding: 'utf8', stdio: 'pipe' });
    return result.stdout.trim().split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

export function isGitRepo() {
  const result = spawnSync('git', ['rev-parse', '--git-dir'], {
    encoding: 'utf8',
    stdio: 'pipe',
  });
  return result.status === 0;
}

/**
 * Returns { total, owned } line counts for the given file.
 * owned = lines whose author-mail matches userEmail.
 * Returns null if the file should be skipped (binary, empty, error).
 */
export function getCommitStats(userEmail) {
  try {
    const log = execSync(
      `git log --author="${userEmail}" --format="%ad" --date=format:"%Y-%m-%d"`,
      { encoding: 'utf8' }
    ).trim();
    const dates = log.split('\n').filter(Boolean);
    if (dates.length === 0) return { count: 0, first: null, last: null };
    return {
      count: dates.length,
      first: dates[dates.length - 1],
      last: dates[0],
    };
  } catch {
    return { count: 0, first: null, last: null };
  }
}

export function getAllContributorLines() {
  try {
    const log = execSync('git log --format="%ae"', { encoding: 'utf8' }).trim();
    return log.split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Returns { total, owned, authors } where authors is a Map of
 * email -> { name, lines } for every contributor in the file.
 * Returns null if the file should be skipped (binary, empty, error).
 */
export function blameFile(filepath, userEmail) {
  const result = spawnSync('git', ['blame', '--porcelain', filepath], {
    encoding: 'utf8',
    stdio: 'pipe',
    maxBuffer: 50 * 1024 * 1024,
  });

  if (result.status !== 0 || result.stderr?.includes('binary')) {
    return null;
  }

  const lines = result.stdout.split('\n');
  let total = 0;
  let owned = 0;
  // Map<email, { name, lines }> — final per-author tally
  const authors = new Map();
  // Cache commit metadata so repeated hashes still resolve to the right author
  const commitCache = new Map(); // hash -> { email, name }
  let currentHash = null;
  let currentName = null;
  let currentEmail = null;

  for (const line of lines) {
    const hashMatch = line.match(/^([0-9a-f]{40}) /);
    if (hashMatch) {
      currentHash = hashMatch[1];
      total++;
      // If we've seen this commit before, pull cached author and credit the line now
      if (commitCache.has(currentHash)) {
        const { email, name } = commitCache.get(currentHash);
        const key = email.toLowerCase();
        const entry = authors.get(key) ?? { name, lines: 0 };
        entry.lines++;
        authors.set(key, entry);
        if (key === userEmail.toLowerCase()) owned++;
        currentHash = null; // mark as already credited
      } else {
        currentName = null;
        currentEmail = null;
      }
    } else if (currentHash && line.startsWith('author ')) {
      currentName = line.slice('author '.length).trim();
    } else if (currentHash && line.startsWith('author-mail ')) {
      const match = line.match(/^author-mail <(.+)>$/);
      currentEmail = match ? match[1] : null;
      if (currentEmail && currentName) {
        const key = currentEmail.toLowerCase();
        commitCache.set(currentHash, { email: currentEmail, name: currentName });
        const entry = authors.get(key) ?? { name: currentName, lines: 0 };
        entry.lines++;
        authors.set(key, entry);
        if (key === userEmail.toLowerCase()) owned++;
        currentHash = null; // credited
      }
    }
  }

  return { total, owned, authors };
}
