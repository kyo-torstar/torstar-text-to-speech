const azure = require("azure-storage");
const sdk = require("microsoft-cognitiveservices-speech-sdk");

module.exports = async function(context, req) {
  // <code>
  "use strict";
  const key = process.env.TEXT_TO_SPEECH_API_KEY;
  const blobEndpoint = process.env.AUDIO_BLOB_STORAGE_ENDPOINT;
  const text = (req.query.text || (req.body && req.body.text));
  // const file = (req.query.filename || (req.body && req.body.filename));
  const blobConnString = process.env.AUDIO_BLOB_STORAGE_CONNECTION_STRING;
  const audioFileName = `torstar_${new Date().getTime()}.wav`;

  if (typeof text === "undefined") {
    context.res = {
      body: "please input \"text\"",
    };
    return;
  }

  // pull in the required packages.

  const blobService = azure.createBlobService(blobConnString);
  const writableStream = blobService.createWriteStreamToBlockBlob(
    "audiofiles",
    audioFileName,
    {
      blockIdPrefix: "block",
      contentSettings: {
        contentType: "audio/wav",
      },
    },
  );
  context.log("JavaScript HTTP trigger function processed a request.");


  var subscriptionKey = key;
  var serviceRegion = "eastus"; // e.g., "westus"

  // we are done with the setup

  // now create the audio-config pointing to our stream and
  // the speech config specifying the language.
  var speechConfig = sdk.SpeechConfig.fromSubscription(subscriptionKey, serviceRegion);

  // create the speech synthesizer.
  var synthesizer = new sdk.SpeechSynthesizer(speechConfig);

  // start the synthesizer and wait for a result.
  var startTime = new Date().getTime();
  const translation = text;
  await new Promise((resolve) => {
    synthesizer.speakTextAsync(text,
      function(result) {
        if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
          console.log("synthesis finished.");
        } else {
          console.error("Speech synthesis canceled, " + result.errorDetails +
            "\nDid you update the subscription info?");
        }

        writableStream.end(Buffer.from(result.audioData), () => {
          synthesizer.close();

          synthesizer = undefined;

          context.res = {
            body: {
              stats: {
                processTimeInSeconds: Math.ceil((new Date().getTime() - startTime) / 1000),
                numOfCharacters: translation.length,
              },
              audioFile: `${blobEndpoint}/${audioFileName}`,
            },
          };
          resolve();
        });
      },
      function(err) {
        console.trace("err - " + err);
        synthesizer.close();
        synthesizer = undefined;
        context.res = {
          status: 400,
          body: "error: " + err.toString(),
        };
        resolve();
      });
  });
};
