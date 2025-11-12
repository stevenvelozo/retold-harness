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
%GUIDBook
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
%GUIDBookAuthorJoin
#IDBook -> IDBook
#IDAuthor -> IDAuthor

!Author
@IDAuthor
%GUIDAuthor
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
