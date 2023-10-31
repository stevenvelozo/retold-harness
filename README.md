# Retold Harness

A basic set of API endpoints that contains Books, Authors, Joins and links to 
images for the cover of each book.  Useful for more complex harnesses.  

Entirely self-contained.

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

### 3) Initialize and run the docker image:

_This can also take a bit of time....._

```
npm run docker-dev-run
```

## After the docker container is running there is quite a bit available:

* a REST web API serving JSON on port 8086
* a browser-based visual studio code environment ready to run node applications
* a mariadb instance, preloaded with 10,000 Book records joined to their Author records
* a partridge
* a pear tree

