import config from '../config'
import { IArticle } from '../database/ArticleSchema'

export enum STATUS {
  UPDATING = 'updating',
  ACTIVE = 'active'
}

export const isSameModifiedDate = (articleJson: IArticleJson, article: IArticle): boolean => {
  return articleJson.lastmodifiedepoch === article.data?.lastmodifiedepoch
}

export const isSameContent = (liveContent: string, dbContent: string): boolean => {
  return liveContent?.trim()?.toLowerCase() === dbContent?.trim()?.toLowerCase()
}

export const isWithinUpdateTimeFrame = (articleJson: IArticleJson, article: IArticle): boolean => {
  // live modified time should be later than db article modified time + offset (buffer time to update)
  return article.createdEpoch + config.articleAudioUpdate.upperBound > articleJson.lastmodifiedepoch * 1000 &&
    articleJson.lastmodifiedepoch * 1000 > article.data.lastmodifiedepoch * 1000 + config.articleAudioUpdate.interval
}

export const parseArticleContent = (headline: string, body: [{ type: string, text: string }]): string => {
  if (headline.trim() === '' && typeof body === 'undefined') {
    return ''
  }

  const parsedContent = body?.filter(item => item?.type === 'text')
    ?.map(item => item?.text?.replace(/(<([^>]+)>)/gi, '')).join(' ')

  return `${headline}. ${parsedContent}`
}
