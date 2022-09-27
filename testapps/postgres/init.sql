create table if not exists Users (
    id serial primary key not null,
    email text not null,
    name text not null,
    unique (email)
);

create table if not exists Messages (
  id serial primary key not null,
  user_id int not null references Users(id),
  message text not null
);

insert into Users (email, name) VALUES ('jens@wundergraph.com','Jens@WunderGraph');
insert into Messages (user_id, message) VALUES ((select id from Users where email = 'jens@wundergraph.com'),'Hey, welcome to the WunderGraph!');
insert into Messages (user_id, message) VALUES ((select id from Users where email = 'jens@wundergraph.com'),'This is WunderGraph!');
insert into Messages (user_id, message) VALUES ((select id from Users where email = 'jens@wundergraph.com'),'WunderGraph!');

alter table Users add column updatedAt timestamptz not null default now();

alter table Users add column lastLogin timestamptz not null default now();
