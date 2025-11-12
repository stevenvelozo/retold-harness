##### {DocumentationIndex|Home} > {Model/DataModel|Data Model} > {Model/Dictionary/ModelChangeTracking|Table Change Tracking}

Table Change Tracking
=====================

The following table describes which tables have implicit create, update and delete change tracking (provided by the meadow endpoints API architecture).  This does not include any kind of media archival or record longitudinal backups; just timestamps and user stamps for the last action of each type.

Table | Create | Update | Delete 
----- | :----: | :----: | :----: 
User |  |  |  
Book | X | X | X 
BookAuthorJoin |  |  |  
Author | X | X | X 
BookPrice | X | X | X 
BookStore | X | X | X 
BookStoreInventory | X | X | X 
Review | X | X | X 
- - -

Generated on 2025-11-12 at 06:48
