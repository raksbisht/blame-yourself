#!/usr/bin/env node

import { isGitRepo, getCurrentUser, getTrackedFiles, blameFile, getCommitStats, getAllContributorLines } from '../src/git.js';
import { shouldSkip } from '../src/filter.js';
import { printProgress, clearProgress, printResult } from '../src/display.js';

function die(msg) {
  console.error(`\nerror: ${msg}`);
  process.exit(1);
}

// Parse args
const argv = process.argv.slice(2);

if (argv.includes('--help') || argv.includes('-h')) {
  console.log('');
  console.log('  Usage: blame-yourself [file/glob ...]  [--path <glob>]');
  console.log('');
  console.log('  Examples:');
  console.log('    blame-yourself                        # whole repo');
  console.log('    blame-yourself abc.js xy.css          # specific files');
  console.log('    blame-yourself "src/**"               # glob pattern');
  console.log('    blame-yourself --path "src/**"        # same via flag');
  console.log('');
  console.log('  Options:');
  console.log('    --path <glob>   Same as passing a positional glob');
  console.log('    -h, --help      Show this help message');
  console.log('');
  process.exit(0);
}

// Collect all patterns: positional args + --path values
const patterns = [];
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--path') {
    if (!argv[i + 1]) die('--path requires a value, e.g. --path "src/**"');
    patterns.push(argv[++i]);
  } else if (!argv[i].startsWith('--')) {
    patterns.push(argv[i]);
  }
}

const pathPattern = patterns.length > 0 ? patterns.join(', ') : null;

if (!isGitRepo()) {
  die('not a git repository. Run this command from inside a git repo.');
}

const user = getCurrentUser();
if (!user) {
  die('could not read git user config. Set user.name and user.email with:\n\n  git config --global user.name "Your Name"\n  git config --global user.email "you@example.com"');
}

const allFiles = getTrackedFiles(patterns);
if (allFiles.length === 0) {
  die('no tracked files found. Make sure this repo has at least one commit.');
}

const files = allFiles.filter(f => !shouldSkip(f));

let totalLines = 0;
let ownedLines = 0;
let touchedFiles = 0;
const fileStats = [];
const langMap = new Map();       // ext -> { owned, total }
const globalAuthors = new Map(); // email -> { name, lines }

for (let i = 0; i < files.length; i++) {
  const filepath = files[i];
  printProgress(i + 1, files.length, filepath);

  const result = blameFile(filepath, user.email);
  if (result === null) continue;

  totalLines += result.total;
  ownedLines += result.owned;

  // merge per-file authors into global map
  for (const [email, { name, lines }] of result.authors) {
    const entry = globalAuthors.get(email) ?? { name, lines: 0 };
    entry.lines += lines;
    globalAuthors.set(email, entry);
  }

  // language breakdown
  const basename = filepath.split('/').pop();
  const dotIndex = basename.lastIndexOf('.');
  const ext = dotIndex !== -1 ? basename.slice(dotIndex + 1).toLowerCase() : 'other';
  const lang = langMap.get(ext) ?? { owned: 0, total: 0 };
  lang.owned += result.owned;
  lang.total += result.total;
  langMap.set(ext, lang);

  if (result.owned > 0) {
    touchedFiles++;
    fileStats.push({ filepath, owned: result.owned, total: result.total });
  }
}

clearProgress();

// commit stats (fast — git log, no blame)
const commitStats = getCommitStats(user.email);

// team leaderboard from blame data (sorted by lines, all contributors)
const leaderboard = [...globalAuthors.entries()]
  .sort((a, b) => b[1].lines - a[1].lines)
  .map(([email, { name, lines }]) => ({ email, name, lines }));

const rankIndex = leaderboard.findIndex(c => c.email.toLowerCase() === user.email.toLowerCase());
const teamRank = rankIndex === -1 ? null : { rank: rankIndex + 1, total: leaderboard.length };

// top languages by owned lines (top 5)
const topLangs = [...langMap.entries()]
  .filter(([, v]) => v.owned > 0)
  .sort((a, b) => b[1].owned - a[1].owned)
  .slice(0, 5)
  .map(([ext, v]) => ({ ext, owned: v.owned, total: v.total }));

const topFiles = fileStats
  .sort((a, b) => b.owned - a.owned)
  .slice(0, 10);

printResult({
  user,
  totalLines,
  ownedLines,
  totalFiles: files.length,
  touchedFiles,
  topFiles,
  commitStats,
  teamRank,
  topLangs,
  leaderboard,
  pathPattern,
});
