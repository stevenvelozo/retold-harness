# Configuration

The harness configuration lives in `source/configuration-bookstore-serve-api.js`.

## Default Settings

```javascript
module.exports = {
    "Product": "MeadowEndpointsTestBookStore",
    "ProductVersion": "1.0.0",

    "UUID": {
        "DataCenter": 0,
        "Worker": 0
    },

    "LogStreams": [
        {
            "streamtype": "simpleflatfile",
            "level": "info",
            "path": "./Retold-Harness-Requests.log"
        }
    ],

    "APIServerPort": 8086,

    "RetoldDataServiceOptions": {
        "StorageProvider": "MySQL",
        "StorageProviderModule": "meadow-connection-mysql",
        "FullMeadowSchemaPath": `${__dirname}/model/`,
        "FullMeadowSchemaFilename": "MeadowModel-Extended.json"
    },

    "MySQL": {
        "Server": "127.0.0.1",
        "Port": 3306,
        "User": "root",
        "Password": "123456789",
        "Database": "bookstore",
        "ConnectionPoolLimit": 20
    },

    "MeadowConnectionMySQLAutoConnect": true
};
```

## Configuration Options

### Fable Settings

| Option | Default | Description |
|--------|---------|-------------|
| `Product` | `"MeadowEndpointsTestBookStore"` | Product name for logging |
| `ProductVersion` | `"1.0.0"` | Product version |
| `APIServerPort` | `8086` | HTTP server port |
| `LogStreams` | File logger | Bunyan-compatible log streams |

### Retold Data Service Options

| Option | Default | Description |
|--------|---------|-------------|
| `StorageProvider` | `"MySQL"` | Database provider |
| `StorageProviderModule` | `"meadow-connection-mysql"` | Provider npm module |
| `FullMeadowSchemaPath` | `source/model/` | Path to compiled model |
| `FullMeadowSchemaFilename` | `"MeadowModel-Extended.json"` | Model filename |

### MySQL Connection

| Option | Default | Description |
|--------|---------|-------------|
| `Server` | `"127.0.0.1"` | Database host |
| `Port` | `3306` | Database port |
| `User` | `"root"` | Database user |
| `Password` | `"123456789"` | Database password |
| `Database` | `"bookstore"` | Database name |
| `ConnectionPoolLimit` | `20` | Max pool connections |

## Changing the Port

Edit `APIServerPort` in the configuration file:

```javascript
"APIServerPort": 9000,
```

If using Docker, also update the port mapping in `package.json`:

```json
"docker-dev-run": "docker run ... -p 9000:9000 ..."
```

## Switching to SQLite

For embedded or testing scenarios:

```javascript
module.exports = {
    "APIServerPort": 8086,
    "SQLite": { "SQLiteFilePath": ":memory:" },
    "RetoldDataServiceOptions": {
        "StorageProvider": "SQLite",
        "StorageProviderModule": "meadow-connection-sqlite",
        "FullMeadowSchemaPath": `${__dirname}/model/`,
        "FullMeadowSchemaFilename": "MeadowModel-Extended.json"
    }
};
```
