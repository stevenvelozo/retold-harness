# Installing Apache Solr 9 on macOS

## Prerequisites

Solr requires Java JDK 11 or later. Install it if you do not have it:

```bash
brew install openjdk@17
```

Verify Java is available:

```bash
java -version
```

If `java` is not on your PATH after installing via Homebrew, link it:

```bash
sudo ln -sfn /opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk-17.jdk
```

## Install Solr via Homebrew

```bash
brew install solr
```

If you do not have Homebrew installed, visit https://brew.sh first.

## Start Solr

```bash
solr start
```

Verify Solr is running by visiting http://localhost:8983/solr/ in your browser. You should see the Solr Admin UI.

## Create the Bookstore Core

```bash
solr create -c bookstore
```

Confirm the core exists:

```bash
curl -s http://localhost:8983/solr/admin/cores?action=STATUS | grep bookstore
```

No seed data is needed. The schema (field definitions) is created automatically from Schema.json when the harness starts.

## Run the Harness with Solr

From the retold-harness-management-tool directory:

```bash
HARNESS_PROVIDER=solr npm start
```

### Docker Alternative

If you prefer not to install Solr locally:

```bash
docker compose up solr -d
```

This starts the `solr:9` image and runs `solr-precreate bookstore` to create the core automatically.

## Environment Variable Overrides

The harness uses these defaults. Override any of them as needed:

| Variable    | Default     |
|-------------|-------------|
| SOLR_HOST   | localhost   |
| SOLR_PORT   | 8983        |
| SOLR_CORE   | bookstore   |

Example with custom settings:

```bash
HARNESS_PROVIDER=solr SOLR_PORT=8984 SOLR_CORE=mycore npm start
```

## Troubleshooting

- If `solr` is not on your PATH, check: `brew --prefix solr`
- To stop Solr: `solr stop -all`
- To delete a core and start over: `solr delete -c bookstore`
- Check Solr logs: `solr status` or browse http://localhost:8983/solr/#/~logging
