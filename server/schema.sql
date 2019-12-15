drop database if exists foodFinder;
create database foodFinder;
use foodFinder;
create table user (
    userid int AUTO_INCREMENT not null,
    username varchar(256) not null unique,
    password varchar(256) not null,
    primary key(userid)
);

insert into user (username, password) values ('alice',sha1( 'alicealice'));
insert into user (username, password) values ('Lexie Lindenberg',sha1( 'oZ5XhMD6YTd'));
insert into user (username, password) values ('Lynnelle Titmus',sha1( 'uztIOwYZvz'));
insert into user (username, password) values ('Flossi Playle',sha1( 'J5Jgu4NboPWX'));
insert into user (username, password) values ('Nial Niland',sha1( 'Pmz7F5R'));
insert into user (username, password) values ('Franklyn Skillern',sha1( '7jWfF3IGS'));
insert into user (username, password) values ('Bancroft Doret',sha1( 'BNOnmIDB'));
insert into user (username, password) values ('Culver Innott',sha1( 'nBnrMWGA3'));
insert into user (username, password) values ('Jessalyn Wandrey',sha1( 'fXxLTc'));
insert into user (username, password) values ('Chandler O''Cosgra',sha1( 'HNO3ZD'));
insert into user (username, password) values ('Zack Ferandez',sha1( 'nsRF7bQnVcxf'));
insert into user (username, password) values ('Parrnell Tutchener',sha1( '6hq3nNR'));
insert into user (username, password) values ('Cleavland Lindenbaum',sha1( 'N7g3kRV'));
insert into user (username, password) values ('Darsey Veltmann',sha1( 'OLeX7rr5mxtK'));
insert into user (username, password) values ('Sheppard Banger',sha1( 'vurq1H1OM'));
insert into user (username, password) values ('Sib Waleworke',sha1( 'pzIm99o'));
insert into user (username, password) values ('Susann Atkyns',sha1( 'm2WA6E9ED'));
insert into user (username, password) values ('Gerrie Franchi',sha1( 'wTXcFctoLp'));
insert into user (username, password) values ('Beckie Klass',sha1( '8LdKb7vYS'));
insert into user (username, password) values ('Esta Meys',sha1( '8LsLRi'));
insert into user (username, password) values ('Ruperto Grigorey',sha1( 'NxGjFoa4P2p'));
insert into user (username, password) values ('Pammie McCrorie',sha1( 'x7IvMCL55RI'));
insert into user (username, password) values ('Park McShea',sha1( 'LWhGBP'));
insert into user (username, password) values ('Zahara Arminger',sha1( 'hgMrL3BN3'));
insert into user (username, password) values ('Ulla Edinborough',sha1( '6WPSl8'));
insert into user (username, password) values ('Stacee Crosson',sha1( 'FxlgsQOuoh'));
insert into user (username, password) values ('Tedi Jeanenet',sha1( '3eWZdYeNc'));
insert into user (username, password) values ('Krystalle Issard',sha1( 'EJKYUyujbofb'));
insert into user (username, password) values ('Debbi Dwine',sha1( 'yZD7DakV0Af'));
insert into user (username, password) values ('Lesly Plunket',sha1( 'WbJiGv'));
insert into user (username, password) values ('Stern Durbann',sha1( 'KMo4NaZ3Bk'));

-- select * from user where username = 'Lexie Lindenberg' and password = sha1('oZ5XhMD6YTd');

create table recipe (
    recipeid int AUTO_INCREMENT not null,
    userid int not null,
    recipename varchar(256) not null,
    preptime int,
    cooktime int,
    recipedescription varchar(2000),
    serving int not null,
    submitted date,
    image_url varchar(256) not null,
    primary key(recipeid),
    constraint fk_userid_recipe
    foreign key(userid)
    references user(userid)
);

create table category (
    categoryid int AUTO_INCREMENT not null, 
    recipeid int not null,
    category varchar(256) not null,
    primary key(categoryid),
    constraint fk_recipeid_cat
    foreign key(recipeid)
    references recipe(recipeid)
);

create table ingredient (
    ingredientid int AUTO_INCREMENT not null, 
    recipeid int not null,
    amount varchar(256) not null,
    unit varchar(256) not null,
    ingredientname varchar(256) not null,
    primary key(ingredientid),
    constraint fk_recipeid_ing
    foreign key(recipeid)
    references recipe(recipeid)
);

create table instruction (
    intructionid int AUTO_INCREMENT not null, 
    recipeid int not null,
    step int not null,
    instruction varchar(2000) not null,
    primary key(intructionid),
    constraint fk_recipeid_ins
    foreign key(recipeid)
    references recipe(recipeid)
);

create table review (
    reviewid int AUTO_INCREMENT not null, 
    recipeid int not null,
    userid int not null,
    rating DECIMAL(3,1),
    comments varchar(2000) not null,
    primary key(reviewid),
    constraint fk_recipeid_rev
    foreign key(recipeid)
    references recipe(recipeid)
);
 
-- INDEXING TO SPPED UP QUERIES:
create index idx_recipename on recipe(recipename);
create index idx_ingredientname on ingredient(ingredientname);
create index idx_category on category(category);

-- AGGREGATION: AVERAGE RATING FOR RECIPE AND TOTAL TIME NEEDED (preptime + cooktime) FOR RECIPE
-- also see server/data.sql for database inserts 

-- MONGODB used to insert tokens
-- INDEXING & EXPIRY IN MONGO:
-- db.jwt_tokens.createIndex( { "createdAt": 1 }, { expireAfterSeconds: 3600 } )


