# Behavior Injection

The harness demonstrates behavior injection by enriching single Book reads with Author data.  This is the core customization pattern for Meadow Endpoints.

## How It Works

In `source/Retold-Harness.js`, a `Read-PostOperation` hook is installed on the Book endpoint after initialization:

```javascript
_Fable.MeadowEndpoints.Book.controller.BehaviorInjection.setBehavior('Read-PostOperation',
    (pRequest, pRequestState, fRequestComplete) =>
    {
        // 1. Find join records for this book
        _Fable.DAL.BookAuthorJoin.doReads(
            _Fable.DAL.BookAuthorJoin.query.addFilter('IDBook', pRequestState.Record.IDBook),
            (pJoinError, pJoinQuery, pJoinRecords) =>
            {
                // 2. Collect author IDs from the join records
                let tmpAuthorList = pJoinRecords.map(j => j.IDAuthor);

                if (tmpAuthorList.length < 1)
                {
                    pRequestState.Record.Authors = [];
                    return fRequestComplete();
                }

                // 3. Load the actual Author records
                _Fable.DAL.Author.doReads(
                    _Fable.DAL.Author.query.addFilter('IDAuthor', tmpAuthorList, 'IN'),
                    (pError, pQuery, pAuthors) =>
                    {
                        // 4. Attach to the response record
                        pRequestState.Record.Authors = pAuthors;
                        return fRequestComplete();
                    });
            });
    });
```

## Result

When you fetch a single book:

```
GET /1.0/Book/1
```

The response includes an `Authors` array:

```json
{
    "IDBook": 1,
    "Title": "Dune",
    "Genre": "Science Fiction",
    "Authors": [
        {
            "IDAuthor": 42,
            "Name": "Frank Herbert"
        }
    ]
}
```

When you fetch multiple books (`/1.0/Books/0/10`), the Authors array is **not** included because the hook is only on the singular Read, not the plural Reads.

## Available Hook Points

Each entity supports pre- and post-operation hooks:

| Hook | When |
|------|------|
| `Create-PreOperation` | Before a record is created |
| `Create-PostOperation` | After a record is created |
| `Read-PreOperation` | Before a single record read |
| `Read-PostOperation` | After a single record read |
| `Reads-PreOperation` | Before a multi-record read |
| `Reads-PostOperation` | After a multi-record read |
| `Update-PreOperation` | Before a record is updated |
| `Update-PostOperation` | After a record is updated |
| `Delete-PreOperation` | Before a record is deleted |
| `Delete-PostOperation` | After a record is deleted |
| `Count-PreOperation` | Before a count query |
| `Count-PostOperation` | After a count query |

## Accessing Request State

The callback receives three arguments:

| Argument | Description |
|----------|-------------|
| `pRequest` | The HTTP request object |
| `pRequestState` | Contains `Record`, `RecordToCreate`, `Query`, `SessionData` |
| `fRequestComplete` | Callback: pass `false` to continue, `true` to signal an error |

## Removing a Behavior

```javascript
delete _Fable.MeadowEndpoints.Book.controller
    .BehaviorInjection._BehaviorFunctions['Read-PostOperation'];
```
