import * as path from 'path'
import pg from 'pg'
import { promises as fs } from 'fs'
import {
  Migrator,
  FileMigrationProvider,
} from 'kysely'
import db from './db.js';

const __dirname = path.resolve()

const { Pool } = pg
async function migrateDown() {
  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      // This needs to be an absolute path.
      migrationFolder: path.join(__dirname, '/dist/db/migrations'),
    }),
  })

  const { error, results } = await migrator.migrateDown()

  results?.forEach((it) => {
    if (it.status === 'Success') {
      console.log(`migration down for "${it.migrationName}" was executed successfully`)
    } else if (it.status === 'Error') {
      console.error(`failed to execute migration down for "${it.migrationName}"`)
    }
  })

  if (error) {
    console.error('failed to migrate')
    console.error(error)
    process.exit(1)
  }

  await db.destroy()
}

migrateDown()