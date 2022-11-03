create table if not exists Users (
    id serial primary key not null,
    email text not null,
    name text not null,
    contact JSONB not null,
    unique (email)
);

insert into Users (email, name, contact) VALUES ('jens@wundergraph.com','Jens@WunderGraph', '{"type": "mobile", "phone": "001001"}');

alter table Users add column updatedAt timestamptz not null default now();
alter table Users add column lastLogin timestamptz not null default now();
