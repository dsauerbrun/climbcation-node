import { Kysely, PostgresDialect, CamelCasePlugin } from 'kysely';
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
    new CamelCasePlugin()
  ],
});

export default db