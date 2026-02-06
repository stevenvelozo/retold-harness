# Testing

Retold Harness includes a comprehensive test suite that validates all 8 entities, behavior injection, DAL access, and the full REST API.

## Running Tests

```bash
npm test
```

Tests use an in-memory SQLite database and require no external server.

## Test Suite Overview

The test suite contains **90 tests** organized into 14 suites:

| Suite | Tests | Description |
|-------|-------|-------------|
| Object Sanity | 9 | Service initialization, model loading, provider config |
| Service Lifecycle | 3 | Double-init protection, lifecycle hooks |
| User CRUD Endpoints | 6 | Read, Reads, Create, Update, Count, Schema |
| Book CRUD Endpoints | 18 | Full CRUD with filtering, pagination, soft delete |
| Author CRUD Endpoints | 8 | CRUD with LIKE filtering, soft delete |
| Book-Author Enrichment | 4 | Behavior injection, Authors array on reads |
| BookAuthorJoin Endpoints | 5 | Join table CRUD and FK filtering |
| BookPrice Endpoints | 7 | Decimal fields, CRUD, soft delete |
| BookStore Endpoints | 8 | Address fields, state filtering, schema |
| BookStoreInventory Endpoints | 6 | Inventory CRUD and FK filtering |
| Review Endpoints | 9 | Text fields, rating filtering, soft delete |
| DAL Direct Access | 4 | doRead, doReads, doCount, doCreate |
| Cross-Entity Operations | 1 | Concurrent multi-entity requests |
| Additional Behavior Injection | 2 | Pre/post-operation hooks on other entities |
| Error Handling | 1 | Stop-before-init guard |

## Test Architecture

The tests:

1. Create an in-memory SQLite database with all 8 tables
2. Seed realistic test data (Users, Books, Authors, Joins, Prices, Stores, Inventory, Reviews)
3. Initialize Retold Data Service with the SQLite provider
4. Install the Author enrichment behavior hook (mirroring production)
5. Exercise all REST endpoints via SuperTest
6. Test DAL direct access alongside HTTP endpoints
7. Verify behavior injection on multiple entities
8. Clean up the database and HTTP server on teardown

## Code Coverage

```bash
npm run coverage
```

## Filtering in the Test

Test filters follow the same patterns as production:

```javascript
// Exact match
_SuperTest.get('1.0/Books/FilteredTo/FBV~Genre~EQ~Fantasy')

// LIKE pattern
_SuperTest.get('1.0/Authors/FilteredTo/FBV~Name~LK~%25Gibson%25')

// Foreign key
_SuperTest.get('1.0/Reviews/FilteredTo/FBV~IDBook~EQ~1')

// Pagination
_SuperTest.get('1.0/Books/0/3')
```
