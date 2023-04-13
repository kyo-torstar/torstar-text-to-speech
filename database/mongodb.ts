import * as Mongoose from 'mongoose'
import { Connection } from 'mongoose'
import { Context } from '@azure/functions'
import config from '../config'

let database: Mongoose.Connection
const connectionUrl = `mongodb://${config.mongodb.user}:${config.mongodb.password}@${config.mongodb.host}:${config.mongodb.port}/${config.mongodb.dbName}`
const connectionStr = `${connectionUrl}?${config.env === 'local' ? 'authSource=admin' : 'ssl=true&retrywrites=false&maxIdleTimeMS=120000&appName=@libsynmongodb@'}`

// @ts-expect-error
export const connect = async (context: Context): Promise<Connection> | Promise<void> => {
  if (typeof database !== 'undefined' && [Mongoose.STATES.connected].includes(database.readyState)) {
    return
  }

  const promise = Mongoose.connect(connectionStr)

  database = Mongoose.connection

  database.once('open', () => {
    context.log('Connected to database')
  })

  database.on('error', () => {
    context.log('Error connecting to database')
  })

  // @ts-expect-error
  return await promise
}

export const disconnect = async (context: Context): Promise<void> => {
  if (typeof database === 'undefined') {
    return
  }
  database.once('close', () => {
    context.log('Disconnected to database')
  })

  return await Mongoose.disconnect()
}
