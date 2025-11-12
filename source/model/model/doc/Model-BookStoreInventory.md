##### {DocumentationIndex|Home} > {Model/DataModel|Data Model} > {Model/Dictionary/Dictionary|Data Dictionary} > {Model/Dictionary/Model-BookStoreInventory|BookStoreInventory Table}

BookStoreInventory
===

Column Name | Size | Data Type | Join 
----------- | ---: | --------- | ---- 
IDBookStoreInventory |  | ID |  
GUIDBookStoreInventory | 36 | GUID |  
CreateDate |  | DateTime |  
CreatingIDUser | int | Numeric |  
UpdateDate |  | DateTime |  
UpdatingIDUser | int | Numeric |  
Deleted |  | Boolean |  
DeleteDate |  | DateTime |  
DeletingIDUser | int | Numeric |  
StockDate |  | DateTime |  
BookCount | int | Numeric |  
AggregateBookCount | int | Numeric |  
IDBook | int | Numeric | Book.IDBook 
IDBookStore | int | Numeric | BookStore.IDBookStore 
IDBookPrice | int | Numeric | BookPrice.IDBookPrice 
StockingAssociate | int | Numeric | User.IDUser 
- - -

Generated on 2025-11-12 at 06:48
