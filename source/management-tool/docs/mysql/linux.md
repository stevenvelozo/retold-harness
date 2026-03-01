# Installing MySQL 8 on Linux

## Install MySQL

### Ubuntu / Debian (apt)

```bash
sudo apt update
sudo apt install mysql-server-8.0
```

If the `mysql-server-8.0` package is not available, add the official MySQL APT repository:

```bash
wget https://dev.mysql.com/get/mysql-apt-config_0.8.29-1_all.deb
sudo dpkg -i mysql-apt-config_0.8.29-1_all.deb
sudo apt update
sudo apt install mysql-server
```

### Fedora / RHEL / CentOS (dnf)

```bash
sudo dnf install mysql-server
```

If MySQL 8 is not in the default repos, add the official repository:

```bash
sudo dnf install https://dev.mysql.com/get/mysql80-community-release-fc39-1.noarch.rpm
sudo dnf install mysql-community-server
```

## Start the MySQL Service

```bash
sudo systemctl start mysqld
sudo systemctl enable mysqld
```

Verify the service is running:

```bash
sudo systemctl status mysqld
```

## Set the Root Password

On some distributions, MySQL generates a temporary root password. Check for it:

```bash
sudo grep 'temporary password' /var/log/mysqld.log
```

If a temporary password exists, log in with it first, then change the password. If no temporary password was set (common on Ubuntu), connect directly:

```bash
sudo mysql -u root
```

Then set the password to match the harness defaults:

```sql
ALTER USER 'root'@'localhost' IDENTIFIED BY '1234567890';
FLUSH PRIVILEGES;
EXIT;
```

On Ubuntu, you may also need to switch the auth plugin:

```sql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '1234567890';
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

- If the password policy rejects `1234567890`, lower the validation policy temporarily: `SET GLOBAL validate_password.policy = LOW;`
- To stop the service: `sudo systemctl stop mysqld`
- Check logs: `sudo journalctl -u mysqld`
