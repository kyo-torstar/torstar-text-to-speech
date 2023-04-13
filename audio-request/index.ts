import { AzureFunction, Context, HttpRequest } from '@azure/functions'
import { processTtsRequest } from '../utils/ttsUtil'
import axios from 'axios'
import { ArticlesModel, IArticle } from '../database/ArticleSchema'
import { connect } from '../database/mongodb'
import {
  isSameContent,
  isSameModifiedDate,
  isWithinUpdateTimeFrame,
  parseArticleContent,
  STATUS
} from '../utils/articleUtils'
import { response } from '../utils/apiUtils'
import config from '../config'

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  const timeStamp = new Date().toISOString()
  context.log(timeStamp, 'HTTP trigger function processed a request.', req.params.articleId)

  try {
    await connect(context)
    const { data: articleJson } = await axios.get(`${config.articleJsonDomain}/${req.params.articleId}.json`)
    const article = await ArticlesModel.findOne({ uuid: articleJson.storyuuid })
    const articleContent = parseArticleContent(articleJson.headline, articleJson.body)
    if (articleContent === '') {
      return response(context, { message: 'No article content' }, 400)
    }

    if (article == null) {
      const ttsResult = await processAndCreate(articleJson, articleContent)
      response(context, ttsResult.body, ttsResult.status)
    } else {
      // check if it is in update time frame and no same content
      if (!isSameModifiedDate(articleJson, article) && !isSameContent(articleContent, article.content) && isWithinUpdateTimeFrame(articleJson, article)) {
        // within time frame and not same content
        const ttsResult = await processAndUpdate(article, articleJson, articleContent)
        response(context, ttsResult.body, ttsResult.status)
      } else if (typeof article.audio?.audioFile !== 'undefined') {
        // response directly if file exists
        response(context, article.audio)
      } else if (article.status === STATUS.UPDATING) {
        // no source and it is being processed => wait => response
        const ttsResult = await waitForTtsProcess(0, articleJson)
        // todo: there is a fat chance of being dangled if status is not updated
        response(context, ttsResult.body, ttsResult.status)
      } else {
        // no source and status is active (unexpected error) => trigger an update => response
        const ttsResult = await processAndUpdate(article, articleJson, articleContent)
        response(context, ttsResult.body, ttsResult.status)
      }
    }

    // await disconnect(context)
  } catch (e) {
    // @ts-expect-error
    context.log('TTS HTTP trigger Unexpected error:', e.toString())
    response(context, { message: 'Unexpected error' }, 400)
  }
}

const processAndUpdate = async (article: IArticle, articleJson: IArticleJson, articleContent: string): Promise<ITtsProcessReturn> => {
  // update to pending
  article.content = articleContent
  article.data = articleJson
  article.status = STATUS.UPDATING
  // @ts-expect-error
  article.lastUpdateDate = Date()
  await article.save()
  // process tts
  let ttsResult
  try {
    ttsResult = await processTtsRequest(articleContent)
  } catch (e) {
    article.status = STATUS.ACTIVE
    // @ts-expect-error
    article.lastUpdateDate = Date()
    await article.save()
    return {
      status: 400,
      // @ts-expect-error
      body: e.message ?? e
    }
  }
  // update record
  article.audio = ttsResult
  article.status = STATUS.ACTIVE
  // @ts-expect-error
  article.lastUpdateDate = Date()
  await article.save()
  return {
    status: 200,
    body: ttsResult
  }
}

const processAndCreate = async (articleJson: IArticleJson, articleContent: string): Promise<ITtsProcessReturn> => {
  // create a record in db
  const article = new ArticlesModel({
    uuid: articleJson.storyuuid,
    content: articleContent,
    data: articleJson,
    status: STATUS.UPDATING,
    lastUpdateDate: Date()
  })
  await article.save()
  // process tts
  let ttsResult
  try {
    ttsResult = await processTtsRequest(articleContent)
  } catch (e) {
    article.status = STATUS.ACTIVE
    // @ts-expect-error
    article.lastUpdateDate = Date()
    await article.save()
    return {
      status: 400,
      // @ts-expect-error
      body: e.message ?? e
    }
  }
  // update record
  article.audio = ttsResult
  article.status = STATUS.ACTIVE
  // @ts-expect-error
  article.lastUpdateDate = Date()
  await article.save()
  return {
    status: 200,
    body: ttsResult
  }
}

const waitForTtsProcess = async (retryCount: number, articleJson: IArticleJson): Promise<ITtsProcessReturn> => {
  if (retryCount > config.ttsMaxWaitRetryCount) {
    return {
      status: 400,
      body: { message: 'resource unavailable, try again later' }
    }
  }
  await new Promise(resolve => setTimeout(resolve, config.ttsRetryInterval))
  const article = await ArticlesModel.findOne({ uuid: articleJson.storyuuid })
  if (article?.status === STATUS.ACTIVE && typeof article?.audio?.audioFile !== 'undefined') {
    return {
      status: 200,
      body: article.audio
    }
  }
  return await waitForTtsProcess(retryCount + 1, articleJson)
}

export default httpTrigger
