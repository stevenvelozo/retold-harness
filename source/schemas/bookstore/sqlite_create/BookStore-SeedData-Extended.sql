-- Extended seed data for the bookstore schema.
-- This file is loaded separately when the Customer table is empty,
-- allowing databases seeded before the schema extension to pick up
-- the new tenant, employee, sale, and review data.

-- Customer (Tenant)
INSERT OR IGNORE INTO Customer
	(IDCustomer, GUIDCustomer, CreateDate, CreatingIDUser, UpdateDate, UpdatingIDUser,
	 Deleted, DeleteDate, DeletingIDUser,
	 Name, Description, ContactName, ContactEmail, ContactPhone,
	 Address, City, State, Postal, Country, Active)
VALUES (1,'a1b2c3d4-e5f6-7890-abcd-ef1234567890','2023-05-24 17:54:47',99999,'2023-05-24 17:54:47',99999,
	0,'',0,
	'Retold Books Inc.','A fictitious chain of bookstores for testing','Alice Johnson','alice@retoldbooks.com','555-0100',
	'100 Main Street','Portland','OR','97201','US',1);

-- Set IDCustomer=1 for all existing records
UPDATE User SET IDCustomer = 1 WHERE IDCustomer = 0;
UPDATE Book SET IDCustomer = 1 WHERE IDCustomer = 0;
UPDATE Author SET IDCustomer = 1 WHERE IDCustomer = 0;
UPDATE BookAuthorJoin SET IDCustomer = 1 WHERE IDCustomer = 0;
UPDATE BookPrice SET IDCustomer = 1 WHERE IDCustomer = 0;
UPDATE BookStore SET IDCustomer = 1 WHERE IDCustomer = 0;
UPDATE BookStoreInventory SET IDCustomer = 1 WHERE IDCustomer = 0;
UPDATE Review SET IDCustomer = 1 WHERE IDCustomer = 0;

-- BookStore additions: set StoreType for existing stores and add an online store
UPDATE BookStore SET StoreType = 'Physical' WHERE StoreType = '' AND IDBookStore > 0;

INSERT OR IGNORE INTO BookStore
	(IDBookStore, GUIDBookStore, CreateDate, CreatingIDUser, UpdateDate, UpdatingIDUser,
	 Deleted, DeleteDate, DeletingIDUser,
	 Name, Address, City, State, Postal, Country, IDCustomer, StoreType, Phone, Email)
VALUES (100,'b2c3d4e5-f6a7-8901-bcde-f12345678901','2023-05-24 17:54:47',99999,'2023-05-24 17:54:47',99999,
	0,'',0,
	'Retold Books Online','','','','','US',1,'Online','','orders@retoldbooks.com');

-- BookStoreEmployee: assign existing users as employees
INSERT OR IGNORE INTO BookStoreEmployee
	(IDBookStoreEmployee, GUIDBookStoreEmployee, CreateDate, CreatingIDUser, UpdateDate, UpdatingIDUser,
	 Deleted, DeleteDate, DeletingIDUser,
	 Title, HireDate, TerminationDate, IsActive, IDUser, IDBookStore, IDCustomer)
VALUES (1,'c3d4e5f6-a7b8-9012-cdef-123456789012','2023-05-24 17:54:47',99999,'2023-05-24 17:54:47',99999,
	0,'',0,
	'Store Manager','2022-01-15','',1,1,1,1),
(2,'d4e5f6a7-b8c9-0123-defa-234567890123','2023-05-24 17:54:47',99999,'2023-05-24 17:54:47',99999,
	0,'',0,
	'Sales Associate','2022-03-01','',1,2,1,1),
(3,'e5f6a7b8-c9d0-1234-efab-345678901234','2023-05-24 17:54:47',99999,'2023-05-24 17:54:47',99999,
	0,'',0,
	'Inventory Clerk','2022-06-15','',1,3,1,1);

-- Additional Users: online customers (non-employees)
INSERT OR IGNORE INTO User (IDUser, GUIDUser, LoginID, Password, NameFirst, NameLast, FullName, Config, IDCustomer, Email, Phone, Address, City, State, Postal, Country)
	VALUES (4, 1004, 'mwilson', 'hash101', 'Mary', 'Wilson', 'Mary Wilson', '{}', 1, 'mary.wilson@email.com', '555-0201', '42 Oak Lane', 'Seattle', 'WA', '98101', 'US');
INSERT OR IGNORE INTO User (IDUser, GUIDUser, LoginID, Password, NameFirst, NameLast, FullName, Config, IDCustomer, Email, Phone, Address, City, State, Postal, Country)
	VALUES (5, 1005, 'tgarcia', 'hash102', 'Tom', 'Garcia', 'Tom Garcia', '{}', 1, 'tom.garcia@email.com', '555-0202', '88 Pine Road', 'Denver', 'CO', '80201', 'US');
INSERT OR IGNORE INTO User (IDUser, GUIDUser, LoginID, Password, NameFirst, NameLast, FullName, Config, IDCustomer, Email, Phone, Address, City, State, Postal, Country)
	VALUES (6, 1006, 'ljohnson', 'hash103', 'Lisa', 'Johnson', 'Lisa Johnson', '{}', 1, 'lisa.johnson@email.com', '555-0203', '15 Elm Street', 'Austin', 'TX', '73301', 'US');
INSERT OR IGNORE INTO User (IDUser, GUIDUser, LoginID, Password, NameFirst, NameLast, FullName, Config, IDCustomer, Email, Phone, Address, City, State, Postal, Country)
	VALUES (7, 1007, 'dpatel', 'hash104', 'Dev', 'Patel', 'Dev Patel', '{}', 1, 'dev.patel@email.com', '555-0204', '200 Birch Ave', 'Chicago', 'IL', '60601', 'US');
INSERT OR IGNORE INTO User (IDUser, GUIDUser, LoginID, Password, NameFirst, NameLast, FullName, Config, IDCustomer, Email, Phone, Address, City, State, Postal, Country)
	VALUES (8, 1008, 'slee', 'hash105', 'Sarah', 'Lee', 'Sarah Lee', '{}', 1, 'sarah.lee@email.com', '555-0205', '77 Maple Drive', 'San Francisco', 'CA', '94101', 'US');

-- Sample BookStoreSale records (mix of in-store and online sales)
INSERT OR IGNORE INTO BookStoreSale
	(IDBookStoreSale, GUIDBookStoreSale, CreateDate, CreatingIDUser, UpdateDate, UpdatingIDUser,
	 Deleted, DeleteDate, DeletingIDUser,
	 SaleDate, TotalAmount, PaymentMethod, TransactionID, IDBookStore, IDUser, IDCustomer)
VALUES (1,'f6a7b8c9-d0e1-2345-fabc-456789012345','2024-01-15 10:30:00',99999,'2024-01-15 10:30:00',99999,
	0,'',0,
	'2024-01-15 10:30:00',29.98,'Credit','TXN-20240115-001',1,2,1),
(2,'a7b8c9d0-e1f2-3456-abcd-567890123456','2024-01-16 14:15:00',99999,'2024-01-16 14:15:00',99999,
	0,'',0,
	'2024-01-16 14:15:00',45.97,'Debit','TXN-20240116-001',1,2,1),
(3,'b8c9d0e1-f2a3-4567-bcde-678901234567','2024-01-17 09:00:00',99999,'2024-01-17 09:00:00',99999,
	0,'',0,
	'2024-01-17 09:00:00',14.99,'Credit','TXN-20240117-001',100,4,1),
(4,'c9d0e1f2-a3b4-5678-cdef-789012345678','2024-01-18 16:45:00',99999,'2024-01-18 16:45:00',99999,
	0,'',0,
	'2024-01-18 16:45:00',52.96,'Credit','TXN-20240118-001',100,5,1),
(5,'d0e1f2a3-b4c5-6789-defa-890123456789','2024-02-01 11:20:00',99999,'2024-02-01 11:20:00',99999,
	0,'',0,
	'2024-02-01 11:20:00',24.98,'Cash','TXN-20240201-001',1,3,1);

-- Sample BookStoreSaleItem records
INSERT OR IGNORE INTO BookStoreSaleItem
	(IDBookStoreSaleItem, GUIDBookStoreSaleItem, CreateDate, CreatingIDUser, UpdateDate, UpdatingIDUser,
	 Deleted, DeleteDate, DeletingIDUser,
	 Quantity, UnitPrice, LineTotal, IDBookStoreSale, IDBook, IDBookPrice, IDCustomer)
VALUES (1,'e1f2a3b4-c5d6-7890-efab-901234567890','2024-01-15 10:30:00',99999,'2024-01-15 10:30:00',99999,
	0,'',0,
	1,14.99,14.99,1,1,0,1),
(2,'f2a3b4c5-d6e7-8901-fabc-012345678901','2024-01-15 10:30:00',99999,'2024-01-15 10:30:00',99999,
	0,'',0,
	1,14.99,14.99,1,2,0,1),
(3,'a3b4c5d6-e7f8-9012-abcd-123456789012','2024-01-16 14:15:00',99999,'2024-01-16 14:15:00',99999,
	0,'',0,
	2,12.99,25.98,2,3,0,1),
(4,'b4c5d6e7-f8a9-0123-bcde-234567890123','2024-01-16 14:15:00',99999,'2024-01-16 14:15:00',99999,
	0,'',0,
	1,19.99,19.99,2,4,0,1),
(5,'c5d6e7f8-a9b0-1234-cdef-345678901234','2024-01-17 09:00:00',99999,'2024-01-17 09:00:00',99999,
	0,'',0,
	1,14.99,14.99,3,5,0,1),
(6,'d6e7f8a9-b0c1-2345-defa-456789012345','2024-01-18 16:45:00',99999,'2024-01-18 16:45:00',99999,
	0,'',0,
	4,13.24,52.96,4,6,0,1),
(7,'e7f8a9b0-c1d2-3456-efab-567890123456','2024-02-01 11:20:00',99999,'2024-02-01 11:20:00',99999,
	0,'',0,
	1,12.99,12.99,5,7,0,1),
(8,'f8a9b0c1-d2e3-4567-fabc-678901234567','2024-02-01 11:20:00',99999,'2024-02-01 11:20:00',99999,
	0,'',0,
	1,11.99,11.99,5,8,0,1);

-- Sample Review records (from online customers and employees)
INSERT OR IGNORE INTO Review
	(IDReview, GUIDReview, CreateDate, CreatingIDUser, UpdateDate, UpdatingIDUser,
	 Deleted, DeleteDate, DeletingIDUser,
	 Text, Rating, IDBook, IDUser, IDCustomer)
VALUES (1,'01a2b3c4-d5e6-f7a8-b9c0-d1e2f3a4b5c6','2024-01-20 08:00:00',4,'2024-01-20 08:00:00',4,
	0,'',0,
	'A wonderful read! Highly recommended for anyone who loves a good story.',5,1,4,1),
(2,'02b3c4d5-e6f7-a8b9-c0d1-e2f3a4b5c6d7','2024-01-21 12:30:00',5,'2024-01-21 12:30:00',5,
	0,'',0,
	'Decent book but the pacing was a bit slow in the middle chapters.',3,2,5,1),
(3,'03c4d5e6-f7a8-b9c0-d1e2-f3a4b5c6d7e8','2024-01-22 15:45:00',6,'2024-01-22 15:45:00',6,
	0,'',0,
	'Could not put it down! Finished it in one sitting.',5,3,6,1),
(4,'04d5e6f7-a8b9-c0d1-e2f3-a4b5c6d7e8f9','2024-01-23 09:15:00',7,'2024-01-23 09:15:00',7,
	0,'',0,
	'Not really my genre but I can see why others enjoy it.',2,4,7,1),
(5,'05e6f7a8-b9c0-d1e2-f3a4-b5c6d7e8f9a0','2024-01-24 18:00:00',8,'2024-01-24 18:00:00',8,
	0,'',0,
	'Beautifully written. The author has a gift for prose.',4,5,8,1);
