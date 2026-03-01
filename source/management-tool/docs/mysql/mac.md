# Installing MySQL 8 on macOS

## Install via Homebrew

```bash
brew install mysql@8.0
```

If you do not have Homebrew installed, visit https://brew.sh first.

## Start the MySQL Service

```bash
brew services start mysql@8.0
```

Verify the service is running:

```bash
brew services list | grep mysql
```

## Set the Root Password

MySQL installs with an empty root password by default on Homebrew. Set it to match the harness defaults:

```bash
mysql -u root -e "ALTER USER 'root'@'localhost' IDENTIFIED BY '1234567890';"
```

If MySQL was installed with a random temporary password, connect using that first:

```bash
mysql -u root -p
```

Then run:

```sql
ALTER USER 'root'@'localhost' IDENTIFIED BY '1234567890';
FLUSH PRIVILEGES;
```

## Create the Bookstore Database

```bash
mysql -u root -p1234567890 -e "CREATE DATABASE IF NOT EXISTS bookstore;"
```

## Verify the Connection

```bash
mysql -u root -p1234567890 -e "SHOW DATABASES;" | grep bookstore
```

You should see `bookstore` in the output.

## Run the Harness with MySQL

From the retold-harness-management-tool directory:

```bash
HARNESS_PROVIDER=mysql npm start
```

### Docker Alternative

If you prefer not to install MySQL locally:

```bash
docker compose up mysql -d
```

## Environment Variable Overrides

The harness uses these defaults. Override any of them as needed:

| Variable         | Default        |
|------------------|----------------|
| MYSQL_HOST       | localhost      |
| MYSQL_PORT       | 3306           |
| MYSQL_USER       | root           |
| MYSQL_PASSWORD   | 1234567890     |
| MYSQL_DATABASE   | bookstore      |

Example with custom settings:

```bash
HARNESS_PROVIDER=mysql MYSQL_PORT=3307 MYSQL_DATABASE=mydb npm start
```

## Troubleshooting

- If `mysql` is not on your PATH, add it: `echo 'export PATH="/opt/homebrew/opt/mysql@8.0/bin:$PATH"' >> ~/.zshrc`
- To stop the service: `brew services stop mysql@8.0`
- To reset everything: `brew services stop mysql@8.0 && brew reinstall mysql@8.0`
