# Installing Apache Solr 9 on Linux

## Prerequisites

Solr requires Java JDK 11 or later.

### Ubuntu / Debian

```bash
sudo apt update
sudo apt install openjdk-17-jdk
```

### Fedora / RHEL / CentOS

```bash
sudo dnf install java-17-openjdk
```

Verify Java is available:

```bash
java -version
```

## Download and Install Solr

Download the latest Solr 9 tarball and extract it:

```bash
curl -LO https://downloads.apache.org/solr/solr/9.7.0/solr-9.7.0.tgz
tar xzf solr-9.7.0.tgz
sudo mv solr-9.7.0 /opt/solr
```

Check the Solr downloads page at https://solr.apache.org/downloads.html for the latest 9.x version if the URL above is out of date.

Add Solr to your PATH:

```bash
echo 'export PATH="/opt/solr/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

## Start Solr

```bash
solr start
```

If running as root, use:

```bash
solr start -force
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

- To stop Solr: `solr stop -all`
- To delete a core and start over: `solr delete -c bookstore`
- Check Solr logs: `solr status` or look in `/opt/solr/server/logs/`
- If port 8983 is already in use: `solr start -p 8984`
