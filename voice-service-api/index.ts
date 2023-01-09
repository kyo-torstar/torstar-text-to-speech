import { AzureFunction, Context, HttpRequest } from '@azure/functions'
import { createBlobService } from 'azure-storage'
import { SpeechConfig, SpeechSynthesizer, ResultReason } from 'microsoft-cognitiveservices-speech-sdk'

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  context.log('HTTP trigger function processed a request.')
  const text = `${req.query?.text ?? req.body?.text ?? ''}`.trim()
  if (text === '') {
    context.res = {
      body: 'please input "text"'
    }
    return
  }

  // SECRETS
  const TEXT_TO_SPEECH_API_KEY = process.env.TEXT_TO_SPEECH_API_KEY ?? ''
  const AUDIO_BLOB_STORAGE_ENDPOINT = process.env.AUDIO_BLOB_STORAGE_ENDPOINT ?? ''
  const AUDIO_BLOB_STORAGE_CONNECTION_STRING = process.env.AUDIO_BLOB_STORAGE_CONNECTION_STRING ?? ''
  // blob storage init
  const audioFileName = `torstar_${new Date().getTime()}.wav`
  const audioFileContainer = 'audiofiles'
  const blobService = createBlobService(AUDIO_BLOB_STORAGE_CONNECTION_STRING)

  const writableStream = blobService.createWriteStreamToBlockBlob(
    audioFileContainer,
    audioFileName,
    {
      blockIdPrefix: 'block',
      contentSettings: {
        contentType: 'audio/wav'
      }
    }
  )
  // text to speech init
  const serviceRegion = 'eastus'
  const speechConfig = SpeechConfig.fromSubscription(TEXT_TO_SPEECH_API_KEY, serviceRegion)
  // list of voices https://learn.microsoft.com/en-us/azure/cognitive-services/speech-service/language-support?tabs=stt-tts
  speechConfig.speechSynthesisVoiceName = 'en-CA-LiamNeural'
  const synthesizer = new SpeechSynthesizer(speechConfig)

  // process
  const startTime = new Date().getTime()
  await new Promise((resolve) => {
    synthesizer.speakTextAsync(text,
      function (result) {
        if (result.reason === ResultReason.SynthesizingAudioCompleted) {
          console.log('synthesis finished.')
        } else {
          console.error(`Speech synthesis canceled, ${result.errorDetails}\nDid you update the subscription info?`)
        }

        writableStream.end(Buffer.from(result.audioData), () => {
          synthesizer?.close()
          // synthesizer = undefined
          const endTime = new Date().getTime() - startTime
          context.res = {
            body: {
              stats: {
                processTimeInSeconds: Math.ceil(endTime / 1000),
                numOfCharacters: text.length
              },
              audioFile: `${AUDIO_BLOB_STORAGE_ENDPOINT}/${audioFileName}`
            }
          }
          resolve('done')
        })
      },
      function (err) {
        console.trace(`err - ${err.toString()}`)
        synthesizer.close()
        // synthesizer = undefined
        context.res = {
          status: 400,
          body: `error: ${err.toString()}`
        }
        resolve('error')
      })
  })
}

export default httpTrigger
