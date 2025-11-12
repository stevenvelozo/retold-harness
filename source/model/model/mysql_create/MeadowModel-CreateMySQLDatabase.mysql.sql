-- Data Model -- Generated 2025-11-12T14:48:19.030Z

-- This script creates the following tables:
-- Table ----------------------------------------- Column Count ----------------
--   User                                                    8
--   Book                                                   16
--   BookAuthorJoin                                          4
--   Author                                                 11
--   BookPrice                                              15
--   BookStore                                              15
--   BookStoreInventory                                     16
--   Review                                                 13



--   [ User ]
CREATE TABLE IF NOT EXISTS
    User
    (
        IDUser INT UNSIGNED NOT NULL AUTO_INCREMENT,
        GUIDUser INT NOT NULL DEFAULT '0',
        LoginID CHAR(128) NOT NULL DEFAULT '',
        Password CHAR(255) NOT NULL DEFAULT '',
        NameFirst CHAR(128) NOT NULL DEFAULT '',
        NameLast CHAR(128) NOT NULL DEFAULT '',
        FullName CHAR(255) NOT NULL DEFAULT '',
        Config CHAR(64) NOT NULL DEFAULT '',

        PRIMARY KEY (IDUser)
    ) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



--   [ Book ]
CREATE TABLE IF NOT EXISTS
    Book
    (
        IDBook INT UNSIGNED NOT NULL AUTO_INCREMENT,
        GUIDBook CHAR(36) NOT NULL DEFAULT '0xDe',
        CreateDate DATETIME,
        CreatingIDUser INT NOT NULL DEFAULT '0',
        UpdateDate DATETIME,
        UpdatingIDUser INT NOT NULL DEFAULT '0',
        Deleted TINYINT NOT NULL DEFAULT '0',
        DeleteDate DATETIME,
        DeletingIDUser INT NOT NULL DEFAULT '0',
        Title CHAR(200) NOT NULL DEFAULT '',
        Type CHAR(32) NOT NULL DEFAULT '',
        Genre CHAR(128) NOT NULL DEFAULT '',
        ISBN CHAR(64) NOT NULL DEFAULT '',
        Language CHAR(12) NOT NULL DEFAULT '',
        ImageURL CHAR(254) NOT NULL DEFAULT '',
        PublicationYear INT NOT NULL DEFAULT '0',

        PRIMARY KEY (IDBook)
    ) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



--   [ BookAuthorJoin ]
CREATE TABLE IF NOT EXISTS
    BookAuthorJoin
    (
        IDBookAuthorJoin INT UNSIGNED NOT NULL AUTO_INCREMENT,
        GUIDBookAuthorJoin CHAR(36) NOT NULL DEFAULT '0xDe',
        IDBook INT NOT NULL DEFAULT '0',
        IDAuthor INT NOT NULL DEFAULT '0',

        PRIMARY KEY (IDBookAuthorJoin)
    ) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



--   [ Author ]
CREATE TABLE IF NOT EXISTS
    Author
    (
        IDAuthor INT UNSIGNED NOT NULL AUTO_INCREMENT,
        GUIDAuthor CHAR(36) NOT NULL DEFAULT '0xDe',
        CreateDate DATETIME,
        CreatingIDUser INT NOT NULL DEFAULT '0',
        UpdateDate DATETIME,
        UpdatingIDUser INT NOT NULL DEFAULT '0',
        Deleted TINYINT NOT NULL DEFAULT '0',
        DeleteDate DATETIME,
        DeletingIDUser INT NOT NULL DEFAULT '0',
        Name CHAR(200) NOT NULL DEFAULT '',
        IDUser INT NOT NULL DEFAULT '0',

        PRIMARY KEY (IDAuthor)
    ) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



--   [ BookPrice ]
CREATE TABLE IF NOT EXISTS
    BookPrice
    (
        IDBookPrice INT UNSIGNED NOT NULL AUTO_INCREMENT,
        GUIDBookPrice CHAR(36) NOT NULL DEFAULT '0xDe',
        CreateDate DATETIME,
        CreatingIDUser INT NOT NULL DEFAULT '0',
        UpdateDate DATETIME,
        UpdatingIDUser INT NOT NULL DEFAULT '0',
        Deleted TINYINT NOT NULL DEFAULT '0',
        DeleteDate DATETIME,
        DeletingIDUser INT NOT NULL DEFAULT '0',
        Price DECIMAL(8,2),
        StartDate DATETIME,
        EndDate DATETIME,
        Discountable TINYINT NOT NULL DEFAULT '0',
        CouponCode CHAR(16) NOT NULL DEFAULT '',
        IDBook INT NOT NULL DEFAULT '0',

        PRIMARY KEY (IDBookPrice)
    ) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



--   [ BookStore ]
CREATE TABLE IF NOT EXISTS
    BookStore
    (
        IDBookStore INT UNSIGNED NOT NULL AUTO_INCREMENT,
        GUIDBookStore CHAR(36) NOT NULL DEFAULT '0xDe',
        CreateDate DATETIME,
        CreatingIDUser INT NOT NULL DEFAULT '0',
        UpdateDate DATETIME,
        UpdatingIDUser INT NOT NULL DEFAULT '0',
        Deleted TINYINT NOT NULL DEFAULT '0',
        DeleteDate DATETIME,
        DeletingIDUser INT NOT NULL DEFAULT '0',
        Name CHAR(200) NOT NULL DEFAULT '',
        Address CHAR(64) NOT NULL DEFAULT '',
        City CHAR(64) NOT NULL DEFAULT '',
        State CHAR(24) NOT NULL DEFAULT '',
        Postal CHAR(16) NOT NULL DEFAULT '',
        Country CHAR(64) NOT NULL DEFAULT '',

        PRIMARY KEY (IDBookStore)
    ) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



--   [ BookStoreInventory ]
CREATE TABLE IF NOT EXISTS
    BookStoreInventory
    (
        IDBookStoreInventory INT UNSIGNED NOT NULL AUTO_INCREMENT,
        GUIDBookStoreInventory CHAR(36) NOT NULL DEFAULT '0xDe',
        CreateDate DATETIME,
        CreatingIDUser INT NOT NULL DEFAULT '0',
        UpdateDate DATETIME,
        UpdatingIDUser INT NOT NULL DEFAULT '0',
        Deleted TINYINT NOT NULL DEFAULT '0',
        DeleteDate DATETIME,
        DeletingIDUser INT NOT NULL DEFAULT '0',
        StockDate DATETIME,
        BookCount INT NOT NULL DEFAULT '0',
        AggregateBookCount INT NOT NULL DEFAULT '0',
        IDBook INT NOT NULL DEFAULT '0',
        IDBookStore INT NOT NULL DEFAULT '0',
        IDBookPrice INT NOT NULL DEFAULT '0',
        StockingAssociate INT NOT NULL DEFAULT '0',

        PRIMARY KEY (IDBookStoreInventory)
    ) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



--   [ Review ]
CREATE TABLE IF NOT EXISTS
    Review
    (
        IDReview INT UNSIGNED NOT NULL AUTO_INCREMENT,
        GUIDReview CHAR(36) NOT NULL DEFAULT '0xDe',
        CreateDate DATETIME,
        CreatingIDUser INT NOT NULL DEFAULT '0',
        UpdateDate DATETIME,
        UpdatingIDUser INT NOT NULL DEFAULT '0',
        Deleted TINYINT NOT NULL DEFAULT '0',
        DeleteDate DATETIME,
        DeletingIDUser INT NOT NULL DEFAULT '0',
        Text TEXT,
        Rating INT NOT NULL DEFAULT '0',
        IDBook INT NOT NULL DEFAULT '0',
        IDUser INT NOT NULL DEFAULT '0',

        PRIMARY KEY (IDReview)
    ) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
