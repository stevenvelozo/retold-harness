# Installing SQLite on macOS

SQLite is the simplest database option for the retold-harness. It is file-based and requires no server process. The database is stored as a single file on disk.

## Prerequisites

- Node.js v22.5.0 or later (the harness uses the built-in `node:sqlite` module)
- npm

## Verify SQLite Is Available

The harness does not need a system-wide SQLite — it uses Node's built-in `node:sqlite` module, which bundles the SQLite engine as part of the runtime. No native compile, no install step.

The `sqlite3` command-line tool is still handy for inspecting the database file by hand. macOS ships with it pre-installed:

```bash
sqlite3 --version
```

If missing, `brew install sqlite` installs it.

## Install Dependencies

From the retold-harness directory:

```bash
npm install
```

No native compilation. No Xcode Command Line Tools required.

## Run the Harness with SQLite

SQLite is the default provider. Either of these commands will work:

```bash
npm start
```

```bash
HARNESS_PROVIDER=sqlite npm start
```

## Database File Location

The SQLite database file is created automatically at:

```
data/bookstore.sqlite
```

This path is relative to the retold-harness directory. You can inspect the database at any time using the command-line tool:

```bash
sqlite3 data/bookstore.sqlite
```

## Troubleshooting

- If `require('node:sqlite')` errors with "Unknown module", your Node version is older than 22.5.0 — upgrade Node.
- If the `data/` directory does not exist, the harness will create it on first run.
- To reset the database, delete `data/bookstore.sqlite` and restart the harness.
