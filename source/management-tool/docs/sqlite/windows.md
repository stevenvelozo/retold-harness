# Installing SQLite on Windows

SQLite is the simplest database option for the retold-harness. It is file-based and requires no server process. The database is stored as a single file on disk.

## Prerequisites

- Node.js v22.5.0 or later (the harness uses the built-in `node:sqlite` module)
- npm

## Verify SQLite Is Available

The harness does not need a system-wide SQLite — it uses Node's built-in `node:sqlite` module, which bundles the SQLite engine as part of the runtime. No native compile, no Windows Build Tools, no Visual Studio.

The `sqlite3` command-line tool is still handy for inspecting the database file by hand. To install it on Windows:

1. Download the **sqlite-tools** zip from https://www.sqlite.org/download.html (look for the "Precompiled Binaries for Windows" section).
2. Extract the zip to a folder such as `C:\sqlite`.
3. Add that folder to your system PATH.
4. Open a new terminal and verify:

```cmd
sqlite3 --version
```

## Install Dependencies

From the retold-harness directory:

```cmd
npm install
```

No native compilation. No Windows Build Tools required.

## Run the Harness with SQLite

SQLite is the default provider. You can start the harness with:

```cmd
npm start
```

To explicitly set the SQLite provider, set the environment variable before starting:

**Command Prompt:**

```cmd
set HARNESS_PROVIDER=sqlite && npm start
```

**PowerShell:**

```powershell
$env:HARNESS_PROVIDER="sqlite"; npm start
```

## Database File Location

The SQLite database file is created automatically at:

```
data\bookstore.sqlite
```

This path is relative to the retold-harness directory. You can inspect the database at any time using the command-line tool:

```cmd
sqlite3 data\bookstore.sqlite
```

## Troubleshooting

- If `require('node:sqlite')` errors with "Unknown module", your Node version is older than 22.5.0 — upgrade Node.
- If the `data\` directory does not exist, the harness will create it on first run.
- To reset the database, delete `data\bookstore.sqlite` and restart the harness.
