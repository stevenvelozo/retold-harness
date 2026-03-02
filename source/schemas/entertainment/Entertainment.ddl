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

!Genre
@IDGenre
%GUIDGenre 128
&CreateDate
#CreatingIDUser
&UpdateDate
#UpdatingIDUser
^Deleted
&DeleteDate
#DeletingIDUser
$Name 128
$Category 32
#IDDataSource -> IDDataSource

!Person
@IDPerson
%GUIDPerson 128
&CreateDate
#CreatingIDUser
&UpdateDate
#UpdatingIDUser
^Deleted
&DeleteDate
#DeletingIDUser
$Name 255
$ExternalID 32
#BirthYear
#DeathYear
$PrimaryProfessions 512
$KnownForTitles 512
#IDDataSource -> IDDataSource

!Movie
@IDMovie
%GUIDMovie 128
&CreateDate
#CreatingIDUser
&UpdateDate
#UpdatingIDUser
^Deleted
&DeleteDate
#DeletingIDUser
$Title 512
$OriginalTitle 512
$ExternalID 32
^IsAdult
#StartYear
#EndYear
#RuntimeMinutes
$GenreList 256
#IDDataSource -> IDDataSource

!MovieGenre
@IDMovieGenre
%GUIDMovieGenre 128
&CreateDate
#CreatingIDUser
&UpdateDate
#UpdatingIDUser
^Deleted
&DeleteDate
#DeletingIDUser
#IDMovie -> IDMovie
#IDGenre -> IDGenre

!MovieCredit
@IDMovieCredit
%GUIDMovieCredit 128
&CreateDate
#CreatingIDUser
&UpdateDate
#UpdatingIDUser
^Deleted
&DeleteDate
#DeletingIDUser
#Ordering
$Category 64
$Job 512
$Characters 1024
#IDMovie -> IDMovie
#IDPerson -> IDPerson
#IDDataSource -> IDDataSource

!MovieRating
@IDMovieRating
%GUIDMovieRating 128
&CreateDate
#CreatingIDUser
&UpdateDate
#UpdatingIDUser
^Deleted
&DeleteDate
#DeletingIDUser
.AverageRating 4,1
#NumVotes
#IDMovie -> IDMovie
#IDDataSource -> IDDataSource

!Artist
@IDArtist
%GUIDArtist 128
&CreateDate
#CreatingIDUser
&UpdateDate
#UpdatingIDUser
^Deleted
&DeleteDate
#DeletingIDUser
$Name 255
$SortName 255
$ExternalID 64
$ArtistType 32
#BeginYear
#EndYear
$Country 128
$Disambiguation 512
#IDPerson -> IDPerson
#IDDataSource -> IDDataSource

!Album
@IDAlbum
%GUIDAlbum 128
&CreateDate
#CreatingIDUser
&UpdateDate
#UpdatingIDUser
^Deleted
&DeleteDate
#DeletingIDUser
$Title 512
$ExternalID 64
$AlbumType 32
#ReleaseYear
$Country 128
#TrackCount
#IDArtist -> IDArtist
#IDDataSource -> IDDataSource

!Song
@IDSong
%GUIDSong 128
&CreateDate
#CreatingIDUser
&UpdateDate
#UpdatingIDUser
^Deleted
&DeleteDate
#DeletingIDUser
$Title 512
$ExternalID 64
#DurationSeconds
#ReleaseYear
#IDArtist -> IDArtist
#IDDataSource -> IDDataSource

!AlbumTrack
@IDAlbumTrack
%GUIDAlbumTrack 128
&CreateDate
#CreatingIDUser
&UpdateDate
#UpdatingIDUser
^Deleted
&DeleteDate
#DeletingIDUser
#TrackNumber
$DiscNumber 8
#IDAlbum -> IDAlbum
#IDSong -> IDSong

!Soundtrack
@IDSoundtrack
%GUIDSoundtrack 128
&CreateDate
#CreatingIDUser
&UpdateDate
#UpdatingIDUser
^Deleted
&DeleteDate
#DeletingIDUser
$Role 128
$Composer 255
#IDMovie -> IDMovie
#IDSong -> IDSong
#IDDataSource -> IDDataSource

!Venue
@IDVenue
%GUIDVenue 128
&CreateDate
#CreatingIDUser
&UpdateDate
#UpdatingIDUser
^Deleted
&DeleteDate
#DeletingIDUser
$Name 255
$City 128
$State 128
$Country 128
.Latitude 12,7
.Longitude 13,7
#Capacity
$ExternalID 64
#IDDataSource -> IDDataSource

!Concert
@IDConcert
%GUIDConcert 128
&CreateDate
#CreatingIDUser
&UpdateDate
#UpdatingIDUser
^Deleted
&DeleteDate
#DeletingIDUser
$Name 512
&EventDate
$TourName 255
#IDArtist -> IDArtist
#IDVenue -> IDVenue
#IDDataSource -> IDDataSource

!SetlistEntry
@IDSetlistEntry
%GUIDSetlistEntry 128
&CreateDate
#CreatingIDUser
&UpdateDate
#UpdatingIDUser
^Deleted
&DeleteDate
#DeletingIDUser
#Position
^IsEncore
$Info 512
#IDConcert -> IDConcert
#IDSong -> IDSong
#IDDataSource -> IDDataSource
