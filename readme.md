# Text to Speech



## Init
1. yarn global add azure-functions-core-tools@4 --unsafe-perm true
2. yarn
3. install docker and docker-compose to your system

## Bootstrap
1. create a file in root directory “local.settings.json” with following content
```json
{
  "IsEncrypted": false,
  "Values": {
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "AzureWebJobsStorage": "",
    "ARTICLE_DOMAIN": "<the star domain>",
    "BLOB_STORAGE_SAS_URL": "<get this from azure blob storage>",
    "AUDIO_BLOB_STORAGE_ENDPOINT": "<get this from azure blob storage>",
    "TEXT_TO_SPEECH_API_KEY": "<get this from azure speech to text resource>"
  },
  "Host": {
    "LocalHttpPort": 7071,
    "CORS": "*",
    "CORSCredentials": false
  }
}
```
2. docker-compose up
3. yarn watch
3. yarn dev

## API Documentation
Swagger: todo

## Todo
- fix types // @ts-expect-error AND any type
- alert and monitor for the endpoint health
- Unit tests
- Delete old sound file regular (clear audio field of a record and delete blob storage file)
