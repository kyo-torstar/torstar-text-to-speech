import { model, Schema, Model, Document } from 'mongoose'

export interface IArticle extends Document {
  uuid: string
  // plain text content (html tags stripped) from data.body
  content: string
  audio: {
    stats: {
      processTimeInSeconds: number
      numOfCharacters: number
    }
    audioFile: string
  }
  data: IArticleJson
  status: 'updating' | 'active'
  lastUpdateDate: Date
  createdEpoch: number
}

const ArticleSchema: Schema = new Schema({
  uuid: { type: String, index: true, required: true },
  content: String,
  audio: {
    stats: {
      processTimeInSeconds: Number,
      numOfCharacters: Number
    },
    audioFile: String
  },
  data: { type: Schema.Types.Mixed },
  status: { type: String, index: true },
  lastUpdateDate: { type: Date, default: Date.now, index: true },
  createdEpoch: { type: Number, default: Date.now }
})

export const ArticlesModel: Model<IArticle> = model<IArticle>('article', ArticleSchema)
