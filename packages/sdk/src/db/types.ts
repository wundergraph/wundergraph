export type DatabaseSchema =
	| typeof postgresql
	| typeof mysql
	| typeof sqlite
	| typeof sqlserver
	| typeof planetscale
	| typeof mongodb
	| typeof prisma;

export const postgresql = 'postgresql';
export const mysql = 'mysql';
export const sqlite = 'sqlite';
export const sqlserver = 'sqlserver';
export const planetscale = 'planetscale';
export const mongodb = 'mongodb';
export const prisma = 'prisma';
