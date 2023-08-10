import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE EXTENSION earthdistance CASCADE;`.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP EXTENSION earthdistance CASCADE;`.execute(db)
}