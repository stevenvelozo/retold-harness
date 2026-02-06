# Luxury Code IDE

Luxury Code provides a browser-based Visual Studio Code environment running inside the Docker container.  It gives you direct access to the source code, terminal, and debugger without installing anything on your workstation.

## Accessing the IDE

After launching the Docker container:

```bash
npm run docker-dev-build
npm run docker-dev-run
```

Open your browser to:

```
http://localhost:20001
```

## Login

The first time you open the editor, you will be prompted for a password:

```
Password: luxury
```

## What You Can Do

- Edit source code and configuration files directly
- Run `npm start` from the integrated terminal to start the API
- Run `npm test` to execute the test suite
- Debug Node.js applications with the built-in debugger
- Access the MariaDB database from the terminal

## Port Reference

| Port | Service |
|------|---------|
| 20001 | Luxury Code (VS Code) |
| 8086 | REST API |
| 31306 | MariaDB (mapped from 3306) |

## Customizing

The port mapping is configured in `package.json`:

```json
"docker-dev-run": "docker run -it -d --name retold-harness-dev -p 20001:8080 -p 8086:8086 -p 31306:3306 ..."
```

Change `20001:8080` to use a different local port for the IDE.
