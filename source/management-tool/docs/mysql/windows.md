# Installing MySQL 8 on Windows

## Download the Installer

1. Go to https://dev.mysql.com/downloads/installer/
2. Download the **MySQL Installer for Windows** (mysql-installer-community MSI)
3. Run the downloaded `.msi` file

## Install MySQL via the MSI Installer

1. Choose **Custom** installation type
2. Select **MySQL Server 8.0** from the available products and add it
3. Click **Execute** to download and install
4. On the configuration screen:
   - Config Type: **Development Computer**
   - Port: **3306**
   - Authentication: **Use Legacy Authentication Method** (recommended for broader compatibility)
5. Set the root password to: `1234567890`
6. Optionally configure MySQL as a Windows Service (recommended, leave defaults)
7. Click **Execute** to apply the configuration

## Start the MySQL Service

MySQL should start automatically as a Windows Service after installation. To manage it manually:

```powershell
# Start the service
net start MySQL80

# Stop the service
net stop MySQL80
```

You can also manage it through the Services app (`services.msc`).

## Add MySQL to PATH

If `mysql` is not recognized in your terminal, add the bin directory to your PATH:

1. Open **System Properties** > **Environment Variables**
2. Edit the **Path** variable under System variables
3. Add: `C:\Program Files\MySQL\MySQL Server 8.0\bin`
4. Open a new terminal for changes to take effect

## Create the Bookstore Database

Open a terminal (Command Prompt or PowerShell):

```powershell
mysql -u root -p1234567890 -e "CREATE DATABASE IF NOT EXISTS bookstore;"
```

## Verify the Connection

```powershell
mysql -u root -p1234567890 -e "SHOW DATABASES;"
```

You should see `bookstore` in the output.

## Run the Harness with MySQL

From the retold-harness-management-tool directory:

**PowerShell:**

```powershell
$env:HARNESS_PROVIDER="mysql"; npm start
```

**Command Prompt:**

```cmd
set HARNESS_PROVIDER=mysql && npm start
```

### Docker Alternative

If you prefer not to install MySQL locally (requires Docker Desktop):

```powershell
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

**PowerShell** example with custom settings:

```powershell
$env:HARNESS_PROVIDER="mysql"; $env:MYSQL_PORT="3307"; $env:MYSQL_DATABASE="mydb"; npm start
```

**Command Prompt** example:

```cmd
set HARNESS_PROVIDER=mysql && set MYSQL_PORT=3307 && set MYSQL_DATABASE=mydb && npm start
```

## Troubleshooting

- If the installer fails, try running it as Administrator
- Check the service status in `services.msc` and look for **MySQL80**
- Logs are located at: `C:\ProgramData\MySQL\MySQL Server 8.0\Data\*.err`
- To reset the root password, stop the service and start mysqld with `--skip-grant-tables`
