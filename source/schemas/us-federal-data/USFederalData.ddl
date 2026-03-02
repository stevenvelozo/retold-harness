!User
@IDUser
#GUIDUser
$LoginID 128
$Password 255
$NameFirst 128
$NameLast 128
$FullName 255
$Config

!DataSource
@IDDataSource
%GUIDDataSource 128
&CreateDate
#CreatingIDUser
&UpdateDate
#UpdatingIDUser
^Deleted
&DeleteDate
#DeletingIDUser
$Name 200
$URL 512
*Description
$FileFormat 64
$Vintage 32
&LastRetrieved

!CensusRegion
@IDCensusRegion
%GUIDCensusRegion 128
&CreateDate
#CreatingIDUser
&UpdateDate
#UpdatingIDUser
^Deleted
&DeleteDate
#DeletingIDUser
$Name 128
#RegionCode

!CensusDivision
@IDCensusDivision
%GUIDCensusDivision 128
&CreateDate
#CreatingIDUser
&UpdateDate
#UpdatingIDUser
^Deleted
&DeleteDate
#DeletingIDUser
$Name 128
#DivisionCode
#IDCensusRegion -> IDCensusRegion

!State
@IDState
%GUIDState 128
&CreateDate
#CreatingIDUser
&UpdateDate
#UpdatingIDUser
^Deleted
&DeleteDate
#DeletingIDUser
$Name 128
$Abbreviation 2
#StateFIPS
#ANSI
#IDCensusRegion -> IDCensusRegion
#IDCensusDivision -> IDCensusDivision

!County
@IDCounty
%GUIDCounty 128
&CreateDate
#CreatingIDUser
&UpdateDate
#UpdatingIDUser
^Deleted
&DeleteDate
#DeletingIDUser
$Name 200
#StateFIPS
#CountyFIPS
$ClassFP 4
#IDState -> IDState

!City
@IDCity
%GUIDCity 128
&CreateDate
#CreatingIDUser
&UpdateDate
#UpdatingIDUser
^Deleted
&DeleteDate
#DeletingIDUser
$Name 200
$USPS 2
#GEOID
#ANSICODE
$LSAD 4
$FunctionalStatus 2
#LandArea
#WaterArea
.LandAreaSqMi 12,4
.WaterAreaSqMi 12,4
.Latitude 12,7
.Longitude 13,7
#IDState -> IDState

!ZIPCode
@IDZIPCode
%GUIDZIPCode 128
&CreateDate
#CreatingIDUser
&UpdateDate
#UpdatingIDUser
^Deleted
&DeleteDate
#DeletingIDUser
$ZIPCode 10
#GEOID
#LandArea
#WaterArea
.LandAreaSqMi 12,4
.WaterAreaSqMi 12,4
.Latitude 12,7
.Longitude 13,7
#IDState -> IDState

!CongressionalDistrict
@IDCongressionalDistrict
%GUIDCongressionalDistrict 128
&CreateDate
#CreatingIDUser
&UpdateDate
#UpdatingIDUser
^Deleted
&DeleteDate
#DeletingIDUser
$Name 200
$USPS 2
#GEOID
$LSAD 4
$Congress 8
$FunctionalStatus 2
#LandArea
#WaterArea
.LandAreaSqMi 12,4
.WaterAreaSqMi 12,4
.Latitude 12,7
.Longitude 13,7
#IDState -> IDState

!CountySubdivision
@IDCountySubdivision
%GUIDCountySubdivision 128
&CreateDate
#CreatingIDUser
&UpdateDate
#UpdatingIDUser
^Deleted
&DeleteDate
#DeletingIDUser
$Name 200
$USPS 2
#GEOID
#ANSICODE
$LSAD 4
$FunctionalStatus 2
#LandArea
#WaterArea
.LandAreaSqMi 12,4
.WaterAreaSqMi 12,4
.Latitude 12,7
.Longitude 13,7
#IDState -> IDState
#IDCounty -> IDCounty
