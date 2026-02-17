-- BookStore Seed Data -- SQLite
-- Mirrors the test seed data from RetoldHarness_tests.js

-- Users
INSERT INTO User (IDUser, GUIDUser, LoginID, Password, NameFirst, NameLast, FullName, Config)
	VALUES (1, 1001, 'admin', 'hash123', 'Admin', 'User', 'Admin User', '{}');
INSERT INTO User (IDUser, GUIDUser, LoginID, Password, NameFirst, NameLast, FullName, Config)
	VALUES (2, 1002, 'jdoe', 'hash456', 'Jane', 'Doe', 'Jane Doe', '{}');
INSERT INTO User (IDUser, GUIDUser, LoginID, Password, NameFirst, NameLast, FullName, Config)
	VALUES (3, 1003, 'bsmith', 'hash789', 'Bob', 'Smith', 'Bob Smith', '{}');

-- Books
INSERT INTO Book (IDBook, GUIDBook, CreateDate, CreatingIDUser, UpdateDate, UpdatingIDUser, Title, Type, Genre, ISBN, Language, ImageURL, PublicationYear, Deleted)
	VALUES (1, 'guid-book-001', datetime('now'), 1, datetime('now'), 1, 'Dune', 'Fiction', 'Science Fiction', '978-0441172719', 'English', 'https://example.com/dune.jpg', 1965, 0);
INSERT INTO Book (IDBook, GUIDBook, CreateDate, CreatingIDUser, UpdateDate, UpdatingIDUser, Title, Type, Genre, ISBN, Language, ImageURL, PublicationYear, Deleted)
	VALUES (2, 'guid-book-002', datetime('now'), 1, datetime('now'), 1, 'Neuromancer', 'Fiction', 'Science Fiction', '978-0441569595', 'English', 'https://example.com/neuromancer.jpg', 1984, 0);
INSERT INTO Book (IDBook, GUIDBook, CreateDate, CreatingIDUser, UpdateDate, UpdatingIDUser, Title, Type, Genre, ISBN, Language, ImageURL, PublicationYear, Deleted)
	VALUES (3, 'guid-book-003', datetime('now'), 1, datetime('now'), 1, 'Foundation', 'Fiction', 'Science Fiction', '978-0553293357', 'English', 'https://example.com/foundation.jpg', 1951, 0);
INSERT INTO Book (IDBook, GUIDBook, CreateDate, CreatingIDUser, UpdateDate, UpdatingIDUser, Title, Type, Genre, ISBN, Language, ImageURL, PublicationYear, Deleted)
	VALUES (4, 'guid-book-004', datetime('now'), 1, datetime('now'), 1, 'Snow Crash', 'Fiction', 'Cyberpunk', '978-0553380958', 'English', 'https://example.com/snowcrash.jpg', 1992, 0);
INSERT INTO Book (IDBook, GUIDBook, CreateDate, CreatingIDUser, UpdateDate, UpdatingIDUser, Title, Type, Genre, ISBN, Language, ImageURL, PublicationYear, Deleted)
	VALUES (5, 'guid-book-005', datetime('now'), 1, datetime('now'), 1, 'The Hobbit', 'Fiction', 'Fantasy', '978-0547928227', 'English', 'https://example.com/hobbit.jpg', 1937, 0);
INSERT INTO Book (IDBook, GUIDBook, CreateDate, CreatingIDUser, UpdateDate, UpdatingIDUser, Title, Type, Genre, ISBN, Language, ImageURL, PublicationYear, Deleted)
	VALUES (6, 'guid-book-006', datetime('now'), 1, datetime('now'), 1, 'Le Petit Prince', 'Fiction', 'Fantasy', '978-2070612758', 'French', 'https://example.com/petit.jpg', 1943, 0);

-- Authors
INSERT INTO Author (IDAuthor, GUIDAuthor, CreateDate, CreatingIDUser, UpdateDate, UpdatingIDUser, Name, IDUser, Deleted)
	VALUES (1, 'guid-author-001', datetime('now'), 1, datetime('now'), 1, 'Frank Herbert', 0, 0);
INSERT INTO Author (IDAuthor, GUIDAuthor, CreateDate, CreatingIDUser, UpdateDate, UpdatingIDUser, Name, IDUser, Deleted)
	VALUES (2, 'guid-author-002', datetime('now'), 1, datetime('now'), 1, 'William Gibson', 0, 0);
INSERT INTO Author (IDAuthor, GUIDAuthor, CreateDate, CreatingIDUser, UpdateDate, UpdatingIDUser, Name, IDUser, Deleted)
	VALUES (3, 'guid-author-003', datetime('now'), 1, datetime('now'), 1, 'Isaac Asimov', 0, 0);
INSERT INTO Author (IDAuthor, GUIDAuthor, CreateDate, CreatingIDUser, UpdateDate, UpdatingIDUser, Name, IDUser, Deleted)
	VALUES (4, 'guid-author-004', datetime('now'), 1, datetime('now'), 1, 'Neal Stephenson', 0, 0);
INSERT INTO Author (IDAuthor, GUIDAuthor, CreateDate, CreatingIDUser, UpdateDate, UpdatingIDUser, Name, IDUser, Deleted)
	VALUES (5, 'guid-author-005', datetime('now'), 1, datetime('now'), 1, 'J.R.R. Tolkien', 0, 0);

-- BookAuthorJoins
INSERT INTO BookAuthorJoin (IDBookAuthorJoin, GUIDBookAuthorJoin, IDBook, IDAuthor)
	VALUES (1, 'guid-join-001', 1, 1);
INSERT INTO BookAuthorJoin (IDBookAuthorJoin, GUIDBookAuthorJoin, IDBook, IDAuthor)
	VALUES (2, 'guid-join-002', 2, 2);
INSERT INTO BookAuthorJoin (IDBookAuthorJoin, GUIDBookAuthorJoin, IDBook, IDAuthor)
	VALUES (3, 'guid-join-003', 3, 3);
INSERT INTO BookAuthorJoin (IDBookAuthorJoin, GUIDBookAuthorJoin, IDBook, IDAuthor)
	VALUES (4, 'guid-join-004', 4, 4);
INSERT INTO BookAuthorJoin (IDBookAuthorJoin, GUIDBookAuthorJoin, IDBook, IDAuthor)
	VALUES (5, 'guid-join-005', 5, 5);

-- BookPrices
INSERT INTO BookPrice (IDBookPrice, GUIDBookPrice, CreateDate, CreatingIDUser, UpdateDate, UpdatingIDUser, Price, Discountable, CouponCode, IDBook, Deleted)
	VALUES (1, 'guid-price-001', datetime('now'), 1, datetime('now'), 1, 14.99, 1, 'SAVE10', 1, 0);
INSERT INTO BookPrice (IDBookPrice, GUIDBookPrice, CreateDate, CreatingIDUser, UpdateDate, UpdatingIDUser, Price, Discountable, CouponCode, IDBook, Deleted)
	VALUES (2, 'guid-price-002', datetime('now'), 1, datetime('now'), 1, 12.99, 0, '', 2, 0);
INSERT INTO BookPrice (IDBookPrice, GUIDBookPrice, CreateDate, CreatingIDUser, UpdateDate, UpdatingIDUser, Price, Discountable, CouponCode, IDBook, Deleted)
	VALUES (3, 'guid-price-003', datetime('now'), 1, datetime('now'), 1, 9.99, 1, 'CLASSIC', 3, 0);

-- BookStores
INSERT INTO BookStore (IDBookStore, GUIDBookStore, CreateDate, CreatingIDUser, UpdateDate, UpdatingIDUser, Name, Address, City, State, Postal, Country, Deleted)
	VALUES (1, 'guid-store-001', datetime('now'), 1, datetime('now'), 1, 'Downtown Books', '123 Main St', 'Portland', 'OR', '97201', 'US', 0);
INSERT INTO BookStore (IDBookStore, GUIDBookStore, CreateDate, CreatingIDUser, UpdateDate, UpdatingIDUser, Name, Address, City, State, Postal, Country, Deleted)
	VALUES (2, 'guid-store-002', datetime('now'), 1, datetime('now'), 1, 'Campus Reads', '456 University Ave', 'Seattle', 'WA', '98105', 'US', 0);

-- BookStoreInventory
INSERT INTO BookStoreInventory (IDBookStoreInventory, GUIDBookStoreInventory, CreateDate, CreatingIDUser, UpdateDate, UpdatingIDUser, BookCount, AggregateBookCount, IDBook, IDBookStore, IDBookPrice, StockingAssociate, Deleted)
	VALUES (1, 'guid-inv-001', datetime('now'), 1, datetime('now'), 1, 15, 15, 1, 1, 1, 1, 0);
INSERT INTO BookStoreInventory (IDBookStoreInventory, GUIDBookStoreInventory, CreateDate, CreatingIDUser, UpdateDate, UpdatingIDUser, BookCount, AggregateBookCount, IDBook, IDBookStore, IDBookPrice, StockingAssociate, Deleted)
	VALUES (2, 'guid-inv-002', datetime('now'), 1, datetime('now'), 1, 8, 8, 2, 1, 2, 1, 0);
INSERT INTO BookStoreInventory (IDBookStoreInventory, GUIDBookStoreInventory, CreateDate, CreatingIDUser, UpdateDate, UpdatingIDUser, BookCount, AggregateBookCount, IDBook, IDBookStore, IDBookPrice, StockingAssociate, Deleted)
	VALUES (3, 'guid-inv-003', datetime('now'), 1, datetime('now'), 1, 20, 20, 1, 2, 1, 2, 0);

-- Reviews
INSERT INTO Review (IDReview, GUIDReview, CreateDate, CreatingIDUser, UpdateDate, UpdatingIDUser, Text, Rating, IDBook, IDUser, Deleted)
	VALUES (1, 'guid-review-001', datetime('now'), 2, datetime('now'), 2, 'A masterpiece of science fiction', 5, 1, 2, 0);
INSERT INTO Review (IDReview, GUIDReview, CreateDate, CreatingIDUser, UpdateDate, UpdatingIDUser, Text, Rating, IDBook, IDUser, Deleted)
	VALUES (2, 'guid-review-002', datetime('now'), 2, datetime('now'), 2, 'Visionary cyberpunk', 4, 2, 2, 0);
INSERT INTO Review (IDReview, GUIDReview, CreateDate, CreatingIDUser, UpdateDate, UpdatingIDUser, Text, Rating, IDBook, IDUser, Deleted)
	VALUES (3, 'guid-review-003', datetime('now'), 3, datetime('now'), 3, 'The original sci-fi epic', 5, 3, 3, 0);
INSERT INTO Review (IDReview, GUIDReview, CreateDate, CreatingIDUser, UpdateDate, UpdatingIDUser, Text, Rating, IDBook, IDUser, Deleted)
	VALUES (4, 'guid-review-004', datetime('now'), 3, datetime('now'), 3, 'Fun and inventive', 4, 4, 3, 0);
