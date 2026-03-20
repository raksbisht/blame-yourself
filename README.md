<p align="center">
  <img src="https://raw.githubusercontent.com/raksbisht/blame-yourself/main/logo.svg" alt="blame-yourself" width="600"/>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/blame-yourself"><img src="https://img.shields.io/npm/v/blame-yourself?color=39d353&labelColor=0d1117&style=flat-square" alt="npm version"/></a>
  <a href="https://www.npmjs.com/package/blame-yourself"><img src="https://img.shields.io/npm/dm/blame-yourself?color=58a6ff&labelColor=0d1117&style=flat-square" alt="downloads"/></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-a371f7?labelColor=0d1117&style=flat-square" alt="license"/></a>
  <img src="https://img.shields.io/badge/node-%3E%3D18-febc2e?labelColor=0d1117&style=flat-square" alt="node"/>
</p>

<p align="center">
  <strong>Answer the question: <em>"How much of this codebase did I actually write?"</em></strong>
</p>

<p align="center">
  Runs <code>git blame</code> across your entire repo and surfaces your authorship stats —<br/>
  lines written, ownership %, language breakdown, team leaderboard, and more.
</p>

---

## Install

```sh
npm install -g blame-yourself
```

or run instantly with no install:

```sh
npx blame-yourself
```

---

## Demo

```
blame-yourself

  You (Jay Smith <jay@example.com>)
  ─────────────────────────────────────
  Lines authored:  1,243 / 4,891
  Ownership:       25.4%
  Files touched:   38 / 102

  Commits:         147
  First commit:    Mar 04, 2024
  Last commit:     Mar 18, 2026
  Team rank:       2nd of 6 contributors

  Languages (by lines authored):
  ─────────────────────────────────────
  ts          ████████████████████  834 (28.1% of file)
  tsx         ████████████░░░░░░░░  312 (19.4% of file)
  css         ████░░░░░░░░░░░░░░░░  97 (31.2% of file)

  Contributors (by lines):
  ─────────────────────────────────────
  Jay Smith               ████████████████  1,243 (25.4%) ← you

  Top files by lines authored:
  ─────────────────────────────────────
  src/components/Editor.tsx            ████████████████████  214 (61.3%)
  src/lib/parser.ts                    ████████████░░░░░░░░  156 (44.2%)
  src/styles/main.css                  ████████░░░░░░░░░░░░  97 (31.2%)
```

---

## Usage

```sh
# Whole repo
blame-yourself

# Specific files
blame-yourself src/index.ts README.md

# Glob pattern — quote to prevent shell expansion
blame-yourself "src/**"
blame-yourself "**/*.ts"

# Multiple globs
blame-yourself "src/**" "lib/**" "*.config.js"

# Via flag (same as positional)
blame-yourself --path "src/**"

# Help
blame-yourself --help
```

---

## What it shows

| | Section | Description |
|---|---|---|
| 📝 | **Lines authored** | Lines `git blame` attributes to your `user.email` |
| 📊 | **Ownership %** | Your lines as a share of all tracked, non-binary lines |
| 📁 | **Files touched** | Files where you own at least one line |
| 🔖 | **Commits** | Your total commit count via `git log --author` |
| 📅 | **First / Last commit** | When you first contributed and last touched the repo |
| 🏆 | **Team rank** | Your position among all contributors by lines owned |
| 🌐 | **Languages** | Top 5 file extensions by lines authored, with per-type % |
| 👥 | **Contributors** | Full team leaderboard ranked by lines owned |
| 🗂️ | **Top files** | Your 10 most-authored files with bar charts |

---

## How it works

```
git ls-files          →  all tracked files (respects .gitignore)
     ↓
  filter              →  skip lockfiles, binaries, assets
     ↓
git blame --porcelain →  parse author-mail per line
     ↓
  match email         →  compare against git config user.email
     ↓
  aggregate           →  lines, files, languages, contributors
     ↓
  render              →  colored terminal output
```

> **Accuracy note:** the porcelain format only emits author metadata once per unique commit hash. `blame-yourself` caches each hash on first sight so every repeated-commit line is still correctly attributed.

---

## Filtered automatically

Lockfiles and binary files are always skipped so they don't skew your numbers.

**Lockfiles**

`package-lock.json` · `yarn.lock` · `pnpm-lock.yaml` · `Gemfile.lock` · `Cargo.lock` · `poetry.lock` · `Pipfile.lock` · `composer.lock` · `*.lock`

**Binary & asset extensions**

| Category | Extensions |
|---|---|
| Images | `.png` `.jpg` `.jpeg` `.gif` `.webp` `.svg` `.ico` `.bmp` |
| Fonts | `.woff` `.woff2` `.ttf` `.otf` `.eot` |
| Archives | `.zip` `.tar` `.gz` `.bz2` `.7z` |
| Media | `.mp3` `.mp4` `.wav` `.mov` `.webm` |
| Compiled | `.pyc` `.class` `.dll` `.so` `.dylib` |

Files that cause `git blame` to error are silently skipped.

---

## Requirements

| | |
|---|---|
| **Node.js** | >= 18 |
| **Git** | Installed and on your `PATH` |
| **Location** | Must run from inside a git repository |
| **Identity** | `git config user.email` must be set |

---

## FAQ

<details>
<summary><strong>It shows 0% even though I wrote everything</strong></summary>

Your `git config user.email` must exactly match the email on your commits:

```sh
git config user.email               # what the tool uses
git log --format="%ae" | sort -u    # emails recorded in commits
```

If they differ, either update your config or amend your commits.
</details>

<details>
<summary><strong>Numbers look wrong in a large repo</strong></summary>

Files over 50 MB are skipped to avoid memory issues. This rarely affects line counts in practice. All lockfiles and binaries are also excluded — run with a `--path` filter if you want to scope to a specific directory.
</details>

<details>
<summary><strong>Can I check someone else's stats?</strong></summary>

Not yet — `--author <email>` support is planned for a future release.
</details>

<details>
<summary><strong>Why is it slow on large repos?</strong></summary>

`git blame` has to read every line of every file. On repos with thousands of files this takes time — the progress indicator shows which file is being processed. Use `--path` to scope to a subdirectory for faster results:

```sh
blame-yourself "src/**"
```
</details>

---

## Author

Made by **[Rakesh Bisht](https://github.com/raksbisht/)**

---

## License

[MIT](./LICENSE)
