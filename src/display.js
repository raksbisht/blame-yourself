import pc from 'picocolors';

function commas(n) {
  return n.toLocaleString('en-US');
}

function pct(a, b) {
  if (b === 0) return '0.0%';
  return ((a / b) * 100).toFixed(1) + '%';
}

function bar(owned, max, width = 20) {
  const filled = Math.round((owned / max) * width);
  return pc.green('█'.repeat(filled)) + pc.dim('░'.repeat(width - filled));
}

function formatDate(dateStr) {
  if (!dateStr) return 'n/a';
  const [y, m, d] = dateStr.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(m) - 1]} ${d}, ${y}`;
}

function ordinal(n) {
  const s = ['th','st','nd','rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

export function printProgress(current, total, filename) {
  const short = filename.length > 40 ? '…' + filename.slice(-39) : filename;
  process.stderr.write(`\r${pc.dim(`[${current}/${total}]`)} ${pc.dim(short)}                    `);
}

export function clearProgress() {
  process.stderr.write('\r' + ' '.repeat(80) + '\r');
}

export function printResult({ user, totalLines, ownedLines, totalFiles, touchedFiles, topFiles, commitStats, teamRank, topLangs, leaderboard, pathPattern }) {
  const divider = pc.dim('─'.repeat(37));
  const label = `${user.name} ${pc.dim(`<${user.email}>`)}`;

  console.log('');
  console.log(pc.bold('blame-yourself') + (pathPattern ? `  ${pc.dim(`path: ${pathPattern}`)}` : ''));
  console.log('');
  console.log(`  You (${label})`);
  console.log(`  ${divider}`);
  console.log(`  ${pc.dim('Lines authored:')}  ${pc.green(pc.bold(commas(ownedLines)))} / ${commas(totalLines)}`);
  console.log(`  ${pc.dim('Ownership:')}       ${pc.cyan(pc.bold(pct(ownedLines, totalLines)))}`);
  console.log(`  ${pc.dim('Files touched:')}   ${pc.yellow(pc.bold(commas(touchedFiles)))} / ${commas(totalFiles)}`);

  // Commit stats
  if (commitStats && commitStats.count > 0) {
    console.log('');
    console.log(`  ${pc.dim('Commits:')}         ${pc.bold(commas(commitStats.count))}`);
    console.log(`  ${pc.dim('First commit:')}    ${formatDate(commitStats.first)}`);
    console.log(`  ${pc.dim('Last commit:')}     ${formatDate(commitStats.last)}`);
  }

  // Team rank
  if (teamRank) {
    const rankStr = pc.bold(ordinal(teamRank.rank));
    const totalContribs = pc.dim(`of ${teamRank.total} contributors`);
    console.log(`  ${pc.dim('Team rank:')}       ${rankStr} ${totalContribs}`);
  }

  // Language breakdown
  if (topLangs && topLangs.length > 0) {
    console.log('');
    console.log(`  ${pc.dim('Languages (by lines authored):')}`);
    console.log(`  ${divider}`);
    const maxOwned = topLangs[0].owned;
    for (const { ext, owned, total } of topLangs) {
      const label = ext.padEnd(10);
      console.log(`  ${pc.dim(label)}  ${bar(owned, maxOwned)}  ${pc.bold(commas(owned))} ${pc.dim(`(${pct(owned, total)} of file)`)}`);
    }
  }

  // Contributor leaderboard
  if (leaderboard && leaderboard.length > 0) {
    console.log('');
    console.log(`  ${pc.dim('Contributors (by lines):')}`);
    console.log(`  ${divider}`);
    const maxLines = leaderboard[0].lines;
    for (const { email, name, lines } of leaderboard) {
      const isYou = email.toLowerCase() === user.email.toLowerCase();
      const nameLabel = (isYou ? pc.bold(name) : pc.dim(name)).padEnd(isYou ? 22 : 30);
      const lineStr = isYou ? pc.green(pc.bold(commas(lines))) : pc.dim(commas(lines));
      const b = bar(lines, maxLines, 16);
      const share = pct(lines, totalLines);
      console.log(`  ${nameLabel}  ${b}  ${lineStr} ${pc.dim(`(${share})`)}${isYou ? pc.green(' ← you') : ''}`);
    }
  }

  // Top files
  if (topFiles && topFiles.length > 0) {
    console.log('');
    console.log(`  ${pc.dim('Top files by lines authored:')}`);
    console.log(`  ${divider}`);
    const maxOwned = topFiles[0].owned;
    for (const { filepath, owned, total } of topFiles) {
      const shortPath = filepath.length > 35 ? '…' + filepath.slice(-34) : filepath.padEnd(35);
      console.log(`  ${pc.dim(shortPath)}  ${bar(owned, maxOwned)}  ${pc.bold(commas(owned))} ${pc.dim(`(${pct(owned, total)})`)}`);
    }
  }

  console.log('');
}
