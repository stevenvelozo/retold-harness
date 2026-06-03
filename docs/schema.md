# Schema Overview

The bookstore data model is defined using Stricture DDL and compiled into a JSON model that drives endpoint generation.

## Schema Source

The DDL source is at `source/model/ddl/BookStore.ddl`.  To recompile after changes:

```bash
npm run build-model
```

This produces `source/model/MeadowModel-Extended.json`, the compiled schema that Retold Data Service loads at startup.

## Entity Relationships

<!-- bespoke diagram: edit diagrams/entity-relationships.mmd or .hints.json, then: npx pict-renderer-graph build modules/meadow/retold-harness/docs -->
![Entity Relationships](diagrams/entity-relationships.svg)

## Stricture DDL Symbols

| Symbol | Meaning | Example |
|--------|---------|---------|
| `!` | Table name | `!Book` |
| `@` | Auto-increment ID | `@IDBook` |
| `%` | Auto GUID | `%GUIDBook 128` |
| `&` | DateTime | `&CreateDate` |
| `#` | Integer | `#PublicationYear` |
| `$` | String (with size) | `$Title 200` |
| `^` | Boolean | `^Deleted` |
| `.` | Decimal (with precision) | `.Price 8,2` |
| `*` | Text (large string) | `*Text` |
| `->` | Foreign key reference | `#IDBook -> IDBook` |

## Auto-Managed Columns

Most entities include standard change-tracking columns that are automatically managed:

| Column | Managed When |
|--------|-------------|
| `CreateDate` | On create |
| `CreatingIDUser` | On create |
| `UpdateDate` | On create and update |
| `UpdatingIDUser` | On create and update |
| `Deleted` | On delete (set to 1) |
| `DeleteDate` | On delete |
| `DeletingIDUser` | On delete |
