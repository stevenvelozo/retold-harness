# Retold Harness

A basic set of API endpoints that contains Books, Authors, Joins and links to 
images for the cover of each book.  Useful for more complex harnesses.  

Entirely self-contained.

## Manual MariaDB in Docker

```shell
docker run -d \
  --name mariadb \
  -p 3306:3306 \
  -e MARIADB_ROOT_PASSWORD=123456789 \
  -e MARIADB_DATABASE=bookstore \
  mariadb:latest
```

## Getting up and Running

This package requires Docker to be installed on your workstation.  You can get 
things running by typing the following commands:

### 1) Clone the code from github:

```
git clone https://github.com/stevenvelozo/retold-harness
```


### 2) Build the docker image:

_This can take a bit of time, depending on your connection speed and resources._

```
npm run docker-dev-build
```

![Building the docker image](./images/Docker-Build-Image.png)

### 3) Create and launch the docker container:

_This can also take a bit of time....._

```
npm run docker-dev-run
```

![Launching the docker container](./images/Docker-Run-Container.png)

![The launched container in the Docker UI](./images/Docker-Container-Launched.png)


## After the docker container is running there is quite a bit available:

* a REST web API serving JSON on port 8086
* a browser-based visual studio code environment ready to run node applications
* a mariadb instance, preloaded with 10,000 Book records joined to their Author records
* a partridge
* a pear tree

### This all fits in less than 500 meg of RAM, and uses virtually no processor power

![Docker statistics after a few minutes of running](./images/Docker-Container-Resources.png)

## Some REST API Examples

The REST endpoints are provided by the [meadow-endpoints](https://www.npmjs.com/package/meadow-endpoints) library on NPM.  Some examples of queries you can make:

### List the first 100 Books in the database: (http://localhost:8086/1.0/Books/0/100)

![The first 100 Books](./images/API-Book-List.png)
### Get the book with `IDBook` 1: (http://localhost:8086/1.0/Book/1)

You will notice that when requesting a single book, there is an `Authors` array populated with the connected authors for the particular book.  But in the list, the array was not filled out.  This is because in meadow-endpoints there is a post-operation behavior hook only attached to the read single record endpoint.  This is reflected in the `/source/Retold-Harness.js` code file in lines 14-41.

![Book 1](./images/API-Book-First.png)

### List the first 10 Authors in the database whose name begins with `Susan`:  (http://localhost:8086/1.0/Authors/FilteredTo/FBV~Name~LK~Susan%25/0/10)

![The first 10 Susans](./images/API-Author-Susans.png)

## Luxury Code

Luxury code is a set of tools to provide easy debugging and test running regardless of environment.  These tools leverage the code-server browser implementation of the Visual Studio Code editor.  The first time you launch the browser editor, you will be asked for a password.  The password is: `luxury`

![Launching Luxury Code requires a Password: luxury](./images/vscode-Login.png)

![Visual Studio Code Editor with Config and Source](./images/vscode-Editor.png)

## MySQL

The docker image also exposes a MySQL server (it's actually MariaDB but nobody is the wiser).  You can connect to and query this database directly from your tool of choice or other applications.  The user is: `root`, the port is `3306` and the password is: `123456789`

![MySQL Connection Info](./images/SQL-Connection.png)

![MySQL Query](./images/SQL-Query.png)

## Customizing your Environment

If you dislike the ports, passwords or anything else about this configuration all the code is readily available.  In the `package.json` file, the two convenience docker spin-up commands are there.  This is where you would change the port mapping for the API server, SQL server and other services.  Remember.... you broke it, you bought it.