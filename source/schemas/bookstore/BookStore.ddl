!User
@IDUser
#GUIDUser
$LoginID 128
$Password 255
$NameFirst 128
$NameLast 128
$FullName 255
$Config

!Book
@IDBook
%GUIDBook 128
&CreateDate
#CreatingIDUser
&UpdateDate
#UpdatingIDUser
^Deleted
&DeleteDate
#DeletingIDUser
$Title 200
$Type 32
$Genre 128
$ISBN 64
$Language 12
$ImageURL 254
#PublicationYear

!BookAuthorJoin
@IDBookAuthorJoin
%GUIDBookAuthorJoin 255
#IDBook -> IDBook
#IDAuthor -> IDAuthor
#IDCustomer -> IDCustomer

!Author
@IDAuthor
%GUIDAuthor 128
&CreateDate
#CreatingIDUser
&UpdateDate
#UpdatingIDUser
^Deleted
&DeleteDate
#DeletingIDUser
$Name 200
#IDUser -> IDUser

!BookPrice
@IDBookPrice
%GUIDBookPrice
&CreateDate
#CreatingIDUser
&UpdateDate
#UpdatingIDUser
^Deleted
&DeleteDate
#DeletingIDUser
.Price 8,2
&StartDate
&EndDate
^Discountable
$CouponCode 16
#IDBook -> IDBook

!BookStore
@IDBookStore
%GUIDBookStore
&CreateDate
#CreatingIDUser
&UpdateDate
#UpdatingIDUser
^Deleted
&DeleteDate
#DeletingIDUser
$Name 200
$Address
$City 64
$State 24
$Postal 16
$Country 64

!BookStoreInventory
@IDBookStoreInventory
%GUIDBookStoreInventory
&CreateDate
#CreatingIDUser
&UpdateDate
#UpdatingIDUser
^Deleted
&DeleteDate
#DeletingIDUser
&StockDate
#BookCount
#AggregateBookCount
#IDBook -> IDBook
#IDBookStore -> IDBookStore
#IDBookPrice -> IDBookPrice
#StockingAssociate -> IDUser

!Review
@IDReview
%GUIDReview
&CreateDate
#CreatingIDUser
&UpdateDate
#UpdatingIDUser
^Deleted
&DeleteDate
#DeletingIDUser
*Text
#Rating
#IDBook -> IDBook
#IDUser -> IDUser

!Customer
@IDCustomer
%GUIDCustomer
&CreateDate
#CreatingIDUser
&UpdateDate
#UpdatingIDUser
^Deleted
&DeleteDate
#DeletingIDUser
$Name 200
$Description 1024
$ContactName 200
$ContactEmail 200
$ContactPhone 32
$Address
$City 64
$State 24
$Postal 16
$Country 64
^Active

!BookStoreEmployee
@IDBookStoreEmployee
%GUIDBookStoreEmployee
&CreateDate
#CreatingIDUser
&UpdateDate
#UpdatingIDUser
^Deleted
&DeleteDate
#DeletingIDUser
$Title 64
&HireDate
&TerminationDate
^IsActive
#IDUser -> IDUser
#IDBookStore -> IDBookStore
#IDCustomer -> IDCustomer

!BookStoreSale
@IDBookStoreSale
%GUIDBookStoreSale
&CreateDate
#CreatingIDUser
&UpdateDate
#UpdatingIDUser
^Deleted
&DeleteDate
#DeletingIDUser
&SaleDate
.TotalAmount 10,2
$PaymentMethod 32
$TransactionID 64
#IDBookStore -> IDBookStore
#IDUser -> IDUser
#IDCustomer -> IDCustomer

!BookStoreSaleItem
@IDBookStoreSaleItem
%GUIDBookStoreSaleItem
&CreateDate
#CreatingIDUser
&UpdateDate
#UpdatingIDUser
^Deleted
&DeleteDate
#DeletingIDUser
#Quantity
.UnitPrice 8,2
.LineTotal 10,2
#IDBookStoreSale -> IDBookStoreSale
#IDBook -> IDBook
#IDBookPrice -> IDBookPrice
#IDCustomer -> IDCustomer
