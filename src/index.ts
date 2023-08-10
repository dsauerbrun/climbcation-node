import Express from 'express'
import BodyParser from 'body-parser'
// import cors from 'cors'

import { unhandledExceptionHandler } from './lib/unhandled-exception-handler.js'

import routes from './routes/index.js'

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

app.server().listen(port, () =>
  console.log('info', `app listening on port ${port}`))
