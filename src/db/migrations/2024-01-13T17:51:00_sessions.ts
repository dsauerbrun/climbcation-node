import { Kysely, sql } from 'kysely'
import { DB } from 'kysely-codegen';

export async function up(db: Kysely<DB>): Promise<void> {
  await sql`CREATE TABLE "session" ("sid" varchar NOT NULL COLLATE "default","sess" json NOT NULL,"expire" timestamp(6) NOT NULL) WITH (OIDS=FALSE);`.execute(db)

  await sql`ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;`.execute(db)

  await sql`CREATE INDEX "IDX_session_expire" ON "session" ("expire");`.execute(db)

}

export async function down(db: Kysely<DB>): Promise<void> {
  await sql`DROP TABLE session;`.execute(db)
}
