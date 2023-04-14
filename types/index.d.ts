interface ITtsProcessReturn {
  status: number
  body: any
}

interface IArticleJson {
  storyuuid: string
  lastmodifiedepoch: number
}

interface ISynthesisConfig {
  speechSynthesisVoiceLang: string
  speechSynthesisVoiceName: string
  speechSynthesisVoiceGender: string
  speechSynthesisOutputFormat: string
}
