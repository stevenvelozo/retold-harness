# Filtering & Pagination

Meadow Endpoints supports filtering and pagination through URL patterns.

## Filter Syntax

Filters are passed in the URL using the `FilteredTo` path segment.  Each filter is a tilde-separated stanza:

```
FBV~Column~Operator~Value
```

| Part | Description |
|------|-------------|
| `FBV` | Filter By Value marker |
| `Column` | Column name to filter on |
| `Operator` | Comparison operator |
| `Value` | Value to compare against |

## Operators

| Operator | Meaning | Example |
|----------|---------|---------|
| `EQ` | Equal | `FBV~Genre~EQ~Fantasy` |
| `NE` | Not equal | `FBV~Language~NE~English` |
| `GT` | Greater than | `FBV~PublicationYear~GT~2000` |
| `GE` | Greater than or equal | `FBV~Rating~GE~4` |
| `LT` | Less than | `FBV~PublicationYear~LT~1950` |
| `LE` | Less than or equal | `FBV~Price~LE~20` |
| `LK` | LIKE (pattern match) | `FBV~Name~LK~Susan%25` |
| `IN` | In a set of values | `FBV~IDBook~IN~1,2,3` |
| `NN` | Not null / not empty | `FBV~ImageURL~NN~` |

> **Note:** Use `%25` in URLs for the `%` wildcard character in LIKE patterns.

## Examples

### Exact match

```
GET /1.0/Books/FilteredTo/FBV~Genre~EQ~Science Fiction
```

### Pattern match (LIKE)

Find authors whose name starts with "Susan":

```
GET /1.0/Authors/FilteredTo/FBV~Name~LK~Susan%25/0/10
```

### Filter on a foreign key

Reviews for a specific book:

```
GET /1.0/Reviews/FilteredTo/FBV~IDBook~EQ~42
```

### Filter on a count

```
GET /1.0/Books/Count/FilteredTo/FBV~Language~EQ~English
```

## Pagination

Pagination uses the `/:Begin/:Cap` URL suffix:

| Parameter | Description |
|-----------|-------------|
| `:Begin` | Zero-based offset (skip this many records) |
| `:Cap` | Maximum records to return |

### Examples

First 25 books:

```
GET /1.0/Books/0/25
```

Next 25 books:

```
GET /1.0/Books/25/25
```

### Filtered + Paginated

```
GET /1.0/Books/FilteredTo/FBV~Genre~EQ~Fantasy/0/10
```

## Combining Filters

Multiple filters can be chained with `~` between stanzas:

```
FBV~Genre~EQ~Science Fiction~FBV~Language~EQ~English
```

This produces an AND between the two conditions.
