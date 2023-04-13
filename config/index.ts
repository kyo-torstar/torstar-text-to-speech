const env = process.env
export default {
  env: env.APP_ENV ?? 'local',
  mongodb: {
    host: env.COSMOSDB_HOST ?? '',
    port: env.COSMOSDB_PORT ?? '',
    dbName: env.COSMOSDB_DBNAME ?? '',
    user: env.COSMOSDB_USER ?? '',
    password: env.COSMOSDB_PASSWORD ?? ''
  },
  articleJsonDomain: env.ARTICLE_DOMAIN ?? '',
  articleAudioUpdate: {
    interval: Number(env.ARTICLE_AUDIO_UPDATE_INTERVAL ?? 2 * 60 * 60 * 1000), // 2 hours
    upperBound: Number(env.ARTICLE_AUDIO_UPDATE_UPPER_BOUND ?? 14 * 24 * 60 * 60 * 1000) // stop update after 2 weeks
  },
  ttsAPIKey: env.TEXT_TO_SPEECH_API_KEY ?? '',
  ttsBlobStorageEndpoint: env.AUDIO_BLOB_STORAGE_ENDPOINT ?? '',
  ttsBlobStorageSASUrl: env.BLOB_STORAGE_SAS_URL ?? '',
  ttsRetryInterval: Number(env.TTS_RETRY_INTERVAL ?? 3000), // millisecond
  ttsMaxWaitRetryCount: Number(env.TTS_MAX_WAIT_RETRY_COUNT ?? 10),
  speechSynthesisVoiceRegion: env.TEXT_TO_SPEECH_REGION ?? 'eastus',
  speechSynthesisVoiceLang: env.TTS_VOICE_LANG ?? 'en-CA',
  speechSynthesisVoiceName: env.TTS_VOICE_NAME ?? 'en-CA-LiamNeural',
  speechSynthesisVoiceGender: env.TTS_VOICE_GENDER ?? 'Male',
  speechSynthesisOutputFormat: env.TTS_OUTPUT_FORMAT ?? 'riff-24khz-16bit-mono-pcm'
}
