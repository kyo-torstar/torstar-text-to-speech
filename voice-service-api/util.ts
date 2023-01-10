import axios, { AxiosResponse } from 'axios'
import { ISynthesisConfig } from './types'

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

export const requestSynthesis = async (serviceRegion: string, apiKey: string, blobStorageSASToken: string, text: string, synthesisConfig: ISynthesisConfig): Promise<ApiResponse> => {
  const data = {
    displayName: 'torstar',
    description: 'torstar batch synthesis',
    textType: 'SSML',
    inputs: [
      {
        text: `
          <speak version="1.0" xml:lang="en-CA">
            <voice xml:lang="en-CA" xml:gender="${synthesisConfig.speechSynthesisVoiceGender}" name="${synthesisConfig.speechSynthesisVoiceName}">
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
      destinationContainerUrl: blobStorageSASToken
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

  if (result.data.id?.trim() !== '') {
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
