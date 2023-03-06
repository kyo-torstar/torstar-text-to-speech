# Text to Speech

## Init
1. yarn global add azure-functions-core-tools@4 --unsafe-perm true
2. yarn

## Bootstrap
1. create a file in root directory “local.settings.json” with following content
```json
{
  "IsEncrypted": false,
  "Values": {
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "AzureWebJobsStorage": "",
    "BLOB_STORAGE_SAS_URL": "<get this from azure blob storage>",
    "AUDIO_BLOB_STORAGE_ENDPOINT": "<get this from azure blob storage>",
    "TEXT_TO_SPEECH_API_KEY": "<get this from azure speech to text resource>"
  }
}
```
2. yarn start
