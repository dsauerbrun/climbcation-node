import Express from 'express'
import BodyParser from 'body-parser'
import session from 'express-session';
import PgSimpleStore from 'connect-pg-simple'
import pg from 'pg'
import https from 'https'
import fs from 'fs';
import passport from 'passport'
// import cors from 'cors'

import { unhandledExceptionHandler } from './lib/unhandled-exception-handler.js'

import routes from './routes/index.js'

const pgPool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
})

const express = Express()
export default class App {
  constructor() {
    // api
    //express.use(cors())
    express.use(BodyParser.json({
      limit: '5mb'
    }))
    express.use(BodyParser.urlencoded({
      extended: true
    }))

    express.use(unhandledExceptionHandler)

    express.use(
      session({
        store: new (PgSimpleStore(session))({
          pool: pgPool,
        }),
        secret: process.env.COOKIE_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 }, // 30 days
      })
    );

    express.use(passport.authenticate('session'))

    routes(express)
  }

  server() {
    return express
  }
}


const port = process.env.CLIMBCATION_PORT || 8080
console.log('info', `starting app on port ${port}`)

const app = new App()

process.on('unhandledRejection', (error:any, promise:any) => {
  console.error('An unhandled error occured in the Api', error)
})

const key = fs.readFileSync('./key.pem')
const cert = fs.readFileSync('./cert.pem')
const httpsOptions = {
  key,
  cert
}

https.createServer(httpsOptions, app.server()).listen(port, () =>
  console.log('info', `app listening on port ${port}`))
/*app.server().listen(port, () =>
  console.log('info', `app listening on port ${port}`))*/
