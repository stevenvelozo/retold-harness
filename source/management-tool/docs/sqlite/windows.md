# Installing SQLite on Windows

SQLite is the simplest database option for the retold-harness. It is file-based and requires no server process. The database is stored as a single file on disk.

## Prerequisites

- Node.js (v14 or later)
- npm
- Windows build tools (for compiling the native npm module)

## Verify SQLite Is Available

SQLite does not come pre-installed on Windows. To install the command-line tool:

1. Download the **sqlite-tools** zip from https://www.sqlite.org/download.html (look for the "Precompiled Binaries for Windows" section).
2. Extract the zip to a folder such as `C:\sqlite`.
3. Add that folder to your system PATH.
4. Open a new terminal and verify:

```cmd
sqlite3 --version
```

Note: The `sqlite3` command-line tool is useful for inspecting the database, but it is not required to run the harness. The harness uses the `better-sqlite3` npm package, which bundles its own SQLite engine and compiles it during `npm install`.

## Install Windows Build Tools

The `better-sqlite3` package requires a C compiler to build its native addon. The easiest way to get the necessary tools is to run the following from an elevated (Administrator) PowerShell or Command Prompt:

```cmd
npm install -g windows-build-tools
```

Alternatively, install Visual Studio Build Tools with the "Desktop development with C++" workload from https://visualstudio.microsoft.com/visual-cpp-build-tools/.

## Install Dependencies

From the retold-harness directory:

```cmd
npm install
```

This will compile the native `better-sqlite3` module.

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

- If `npm install` fails with compilation errors, ensure Windows Build Tools or Visual Studio Build Tools are installed.
- If the `data\` directory does not exist, the harness will create it on first run.
- To reset the database, delete `data\bookstore.sqlite` and restart the harness.
