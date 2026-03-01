# Installing SQLite on Linux

SQLite is the simplest database option for the retold-harness. It is file-based and requires no server process. The database is stored as a single file on disk.

## Prerequisites

- Node.js (v14 or later)
- npm
- A C compiler and build tools (for compiling the native npm module)

## Verify SQLite Is Available

Many Linux distributions include SQLite by default. Check by running:

```bash
sqlite3 --version
```

If it is not installed, use your distribution's package manager:

**Debian / Ubuntu:**

```bash
sudo apt update
sudo apt install sqlite3
```

**Fedora / RHEL / CentOS:**

```bash
sudo dnf install sqlite
```

**Arch Linux:**

```bash
sudo pacman -S sqlite
```

Note: The `sqlite3` command-line tool is useful for inspecting the database, but it is not required to run the harness. The harness uses the `better-sqlite3` npm package, which bundles its own SQLite engine and compiles it during `npm install`.

## Install Build Tools

The `better-sqlite3` package requires a C compiler to build its native addon. Make sure build essentials are installed:

**Debian / Ubuntu:**

```bash
sudo apt install build-essential python3
```

**Fedora / RHEL / CentOS:**

```bash
sudo dnf groupinstall "Development Tools"
```

## Install Dependencies

From the retold-harness directory:

```bash
npm install
```

This will compile the native `better-sqlite3` module.

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

- If `npm install` fails with compilation errors, ensure `build-essential` (or equivalent) and `python3` are installed.
- If the `data/` directory does not exist, the harness will create it on first run.
- To reset the database, delete `data/bookstore.sqlite` and restart the harness.
