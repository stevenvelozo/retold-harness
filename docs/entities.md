# Entity Reference

The bookstore model contains 8 entities.

## User

Basic user accounts for the system.

| Column | Type | Size | Notes |
|--------|------|------|-------|
| `IDUser` | AutoIdentity | — | Primary key |
| `GUIDUser` | Integer | — | Numeric GUID |
| `LoginID` | String | 128 | Login username |
| `Password` | String | 255 | Password hash |
| `NameFirst` | String | 128 | First name |
| `NameLast` | String | 128 | Last name |
| `FullName` | String | 255 | Display name |
| `Config` | String | 64 | User configuration |

> **Note:** The User entity does not include standard change-tracking columns.

## Book

The primary entity representing books in the store.

| Column | Type | Size | Notes |
|--------|------|------|-------|
| `IDBook` | AutoIdentity | — | Primary key |
| `GUIDBook` | AutoGUID | 128 | Unique identifier |
| `Title` | String | 200 | Book title |
| `Type` | String | 32 | Book type (e.g. Fiction) |
| `Genre` | String | 128 | Genre classification |
| `ISBN` | String | 64 | ISBN number |
| `Language` | String | 12 | Language code |
| `ImageURL` | String | 254 | Cover image URL |
| `PublicationYear` | Integer | — | Year published |
| + change tracking | | | Create, Update, Delete |

## Author

Authors who write books.

| Column | Type | Size | Notes |
|--------|------|------|-------|
| `IDAuthor` | AutoIdentity | — | Primary key |
| `GUIDAuthor` | AutoGUID | 128 | Unique identifier |
| `Name` | String | 200 | Author name |
| `IDUser` | Integer | — | FK to User (optional) |
| + change tracking | | | Create, Update, Delete |

## BookAuthorJoin

Many-to-many join table connecting Books to Authors.

| Column | Type | Size | Notes |
|--------|------|------|-------|
| `IDBookAuthorJoin` | AutoIdentity | — | Primary key |
| `GUIDBookAuthorJoin` | AutoGUID | 255 | Unique identifier |
| `IDBook` | Integer | — | FK to Book |
| `IDAuthor` | Integer | — | FK to Author |

> **Note:** No change tracking columns.  A book can have multiple authors, and an author can write multiple books.

## BookPrice

Pricing information for books, supporting multiple price periods.

| Column | Type | Size | Notes |
|--------|------|------|-------|
| `IDBookPrice` | AutoIdentity | — | Primary key |
| `GUIDBookPrice` | AutoGUID | 36 | Unique identifier |
| `Price` | Decimal | 8,2 | Price value |
| `StartDate` | DateTime | — | Price effective start |
| `EndDate` | DateTime | — | Price effective end |
| `Discountable` | Boolean | — | Can be discounted |
| `CouponCode` | String | 16 | Associated coupon |
| `IDBook` | Integer | — | FK to Book |
| + change tracking | | | Create, Update, Delete |

## BookStore

Physical bookstore locations.

| Column | Type | Size | Notes |
|--------|------|------|-------|
| `IDBookStore` | AutoIdentity | — | Primary key |
| `GUIDBookStore` | AutoGUID | 36 | Unique identifier |
| `Name` | String | 200 | Store name |
| `Address` | String | 64 | Street address |
| `City` | String | 64 | City |
| `State` | String | 24 | State/province |
| `Postal` | String | 16 | Postal code |
| `Country` | String | 64 | Country |
| + change tracking | | | Create, Update, Delete |

## BookStoreInventory

Tracks book inventory levels at each store.

| Column | Type | Size | Notes |
|--------|------|------|-------|
| `IDBookStoreInventory` | AutoIdentity | — | Primary key |
| `GUIDBookStoreInventory` | AutoGUID | 36 | Unique identifier |
| `StockDate` | DateTime | — | When stock was recorded |
| `BookCount` | Integer | — | Current count |
| `AggregateBookCount` | Integer | — | Running total |
| `IDBook` | Integer | — | FK to Book |
| `IDBookStore` | Integer | — | FK to BookStore |
| `IDBookPrice` | Integer | — | FK to BookPrice |
| `StockingAssociate` | Integer | — | FK to User |
| + change tracking | | | Create, Update, Delete |

## Review

User reviews for books.

| Column | Type | Size | Notes |
|--------|------|------|-------|
| `IDReview` | AutoIdentity | — | Primary key |
| `GUIDReview` | AutoGUID | 36 | Unique identifier |
| `Text` | Text | — | Review content |
| `Rating` | Integer | — | Numeric rating |
| `IDBook` | Integer | — | FK to Book |
| `IDUser` | Integer | — | FK to User (reviewer) |
| + change tracking | | | Create, Update, Delete |
