import axios, { AxiosResponse } from 'axios'
import config from '../config'

interface ApiResponse {
  success: boolean
  data: string
}

const delay = async (ms: number): Promise<void> => await new Promise(resolve => setTimeout(resolve, ms))

export const waitForSynthesisResult = async (id: string, serviceRegion: string, apiKey: string): Promise<ApiResponse> => {
  const result: AxiosResponse = await axios.get(
    `https://${serviceRegion}.customvoice.api.speech.microsoft.com/api/texttospeech/3.1-preview1/batchsynthesis/${id}`,
    {
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey
      }
    }
  )

  if (result.data?.status === 'Succeeded') {
    return {
      success: true,
      data: result.data.outputs?.result
    }
  } else if (result.data?.status === 'Failed') {
    return {
      success: false,
      data: result.data?.status
    }
  } else {
    // sleep 1 second
    console.log(`waiting for result, id: ${id}`)
    await delay(1000)
    return await waitForSynthesisResult(id, serviceRegion, apiKey)
  }
}

export const requestSynthesis = async (serviceRegion: string, apiKey: string, blobStorageSASUrl: string, text: string, synthesisConfig: ISynthesisConfig): Promise<ApiResponse> => {
  const data = {
    displayName: 'torstar',
    description: 'torstar batch synthesis',
    textType: 'SSML',
    inputs: [
      {
        text: `
          <speak version="1.0" xml:lang="${synthesisConfig.speechSynthesisVoiceLang}">
            <voice xml:lang="${synthesisConfig.speechSynthesisVoiceLang}" xml:gender="${synthesisConfig.speechSynthesisVoiceGender}" name="${synthesisConfig.speechSynthesisVoiceName}">
              ${text}
            </voice>
          </speak>
        `
      }
    ],
    properties: {
      outputFormat: synthesisConfig.speechSynthesisOutputFormat,
      wordBoundaryEnabled: false,
      sentenceBoundaryEnabled: false,
      concatenateResult: false,
      decompressOutputFiles: true,
      destinationContainerUrl: blobStorageSASUrl
    }
  }

  const result = await axios.post(
    `https://${serviceRegion}.customvoice.api.speech.microsoft.com/api/texttospeech/3.1-preview1/batchsynthesis`,
    data,
    {
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey
      }
    }
  )

  if (typeof result.data.id !== 'undefined') {
    return {
      success: true,
      data: result.data.id
    }
  } else {
    return {
      success: false,
      data: 'missing id'
    }
  }
}

export const processTtsRequest = async (text = ''): Promise<any> => {
  const serviceRegion = config.speechSynthesisVoiceRegion

  if (text === '') {
    throw Error('no content')
  }

  // test only start
  // if (config.env === 'local') {
  //   return {
  //     stats: {
  //       processTimeInSeconds: 5,
  //       numOfCharacters: text.length
  //     },
  //     audioFile: `0001.wav`
  //   }
  //
  //   throw Error('no content')
  // }
  // test only ends

  const startTime = new Date().getTime()
  const requestSynthesisResult = await requestSynthesis(serviceRegion, config.ttsAPIKey, config.ttsBlobStorageSASUrl, text, config)
  if (requestSynthesisResult.success) {
    const synthesisResult = await waitForSynthesisResult(requestSynthesisResult.data, serviceRegion, config.ttsAPIKey)

    if (synthesisResult?.success) {
      console.log('synthesisResult', synthesisResult)
      const endTime = new Date().getTime() - startTime
      return {
        stats: {
          processTimeInSeconds: Math.ceil(endTime / 1000),
          numOfCharacters: text.length
        },
        audioFile: `${config.ttsBlobStorageEndpoint}/${synthesisResult.data}/0001.wav`
      }
    } else {
      throw Error(`error: waitForSynthesisResult ${synthesisResult.data?.toString()}`)
    }
  } else {
    throw Error(`error: requestSynthesis ${requestSynthesisResult.data?.toString()}`)
  }
}
