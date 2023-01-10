import { AzureFunction, Context, HttpRequest } from '@azure/functions'
import { requestSynthesis, waitForSynthesisResult } from './util'

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  context.log('HTTP trigger function processed a request.')
  const text = req.body?.text?.trim() ?? ''
  const serviceRegion = req.body?.region ?? 'eastus'
  const config = req.body?.config ?? {}
  if (text === '') {
    context.res = {
      body: 'please input "text"'
    }
    return
  }

  // SECRETS
  const TEXT_TO_SPEECH_API_KEY = process.env.TEXT_TO_SPEECH_API_KEY ?? ''
  const AUDIO_BLOB_STORAGE_ENDPOINT = process.env.AUDIO_BLOB_STORAGE_ENDPOINT ?? ''
  const BLOB_STORAGE_SAS_URL = process.env.BLOB_STORAGE_SAS_URL ?? ''

  // text to speech init
  const speechSynthesisVoiceLang = config.speechSynthesisVoiceLang ?? 'en-CA'
  const speechSynthesisVoiceName = config.speechSynthesisVoiceName ?? 'en-CA-LiamNeural'
  const speechSynthesisVoiceGender = config.speechSynthesisVoiceGender ?? 'Male'
  const speechSynthesisOutputFormat = config.speechSynthesisOutputFormat ?? 'riff-24khz-16bit-mono-pcm'

  const startTime = new Date().getTime()
  try {
    const requestSynthesisResult = await requestSynthesis(serviceRegion, TEXT_TO_SPEECH_API_KEY, BLOB_STORAGE_SAS_URL, text, { speechSynthesisVoiceLang, speechSynthesisVoiceGender, speechSynthesisVoiceName, speechSynthesisOutputFormat })
    if (requestSynthesisResult.success) {
      const synthesisResult = await waitForSynthesisResult(requestSynthesisResult.data, serviceRegion, TEXT_TO_SPEECH_API_KEY)

      if (synthesisResult?.success) {
        console.log('synthesisResult', synthesisResult)
        const endTime = new Date().getTime() - startTime
        context.res = {
          body: {
            stats: {
              processTimeInSeconds: Math.ceil(endTime / 1000),
              numOfCharacters: text.length
            },
            audioFile: `${AUDIO_BLOB_STORAGE_ENDPOINT}/${synthesisResult.data}/0001.wav`
          }
        }
      } else {
        context.res = {
          status: 400,
          body: `error: waitForSynthesisResult ${synthesisResult.data?.toString()}`
        }
      }
    } else {
      context.res = {
        status: 400,
        body: `error: requestSynthesis ${requestSynthesisResult.data?.toString()}`
      }
    }
  } catch (error) {
    const err = error as Error
    console.error(`Unexpected error: ${err?.toString()}`)
    context.res = {
      status: 400,
      body: `error: ${err.toString()}`
    }
  }
}

export default httpTrigger
