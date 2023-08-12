import { Kysely, PostgresDialect, CamelCasePlugin, DeduplicateJoinsPlugin } from 'kysely';
import { DB } from 'kysely-codegen';
import pg from 'pg';

const { Pool } = pg;

const db = new Kysely<DB>({
  dialect: new PostgresDialect({
    pool: new Pool({
      connectionString: process.env.DATABASE_URL,
    }),
  }),
  plugins: [
    new CamelCasePlugin(),
    new DeduplicateJoinsPlugin(),
  ],
});

export default db