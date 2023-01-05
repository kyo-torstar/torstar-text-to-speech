module.exports = async function(context, req) {
  // <code>
  "use strict";

  // pull in the required packages.
  var sdk = require("microsoft-cognitiveservices-speech-sdk");
  context.log("JavaScript HTTP trigger function processed a request.");

  const key = (req.query.key || (req.body && req.body.key));
  const file = (req.query.file || (req.body && req.body.file));
  var subscriptionKey = key;
  var serviceRegion = "eastus"; // e.g., "westus"
  var filename = "torstar-news";

  // we are done with the setup

  // now create the audio-config pointing to our stream and
  // the speech config specifying the language.
  var audioConfig = sdk.AudioConfig.fromAudioFileOutput(`${filename}_${new Date().getTime()}.wav`);
  var speechConfig = sdk.SpeechConfig.fromSubscription(subscriptionKey, serviceRegion);

  // create the speech synthesizer.
  var synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

  // start the synthesizer and wait for a result.
  var startTime = new Date().getTime()
  const text = require(`./${file}.js`);
  synthesizer.speakTextAsync(text,
    function(result) {
      if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
        console.log("synthesis finished.");
      } else {
        console.error("Speech synthesis canceled, " + result.errorDetails +
          "\nDid you update the subscription info?");
      }
      synthesizer.close();
      synthesizer = undefined;
      console.log(`>> file: ${file}, character length: ${text.length}`);
      console.log(`>> file: ${file}, time to process: ${Math.ceil((new Date().getTime() - startTime) / 1000)}`);
      console.log("Now synthesizing to: " + filename);

      context.res = {
        // status: 200, /* Defaults to 200 */
        body: `>> file: ${file}, character length: ${text.length}\n
        >> file: ${file}, time to process: ${Math.ceil((new Date().getTime() - startTime) / 1000)}`,
      };
    },
    function(err) {
      console.trace("err - " + err);
      synthesizer.close();
      synthesizer = undefined;
      context.res = {
        status: 400,
        body: "error: " + e.toString(),
      };
    });
};
