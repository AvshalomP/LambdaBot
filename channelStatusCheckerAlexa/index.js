"use strict";

let Alexa = require("alexa-sdk");
let request = require('request-promise'); //for HTTP request
let channelFromEvent = "";  //for extracting channel number out of event envoked this lamnda

const WELCOME_MESSAGE = process.env.WELCOME_PHRASE+"...Just let me know which channel number, do you want me to check. You can say, 'Help', OR.. 'Goodbye', at anytime.";
const START_MESSAGE   = "...To start, just say, for example...'check channel 15', or you can say, 'check channel one five.";
const HELP_MESSAGE    = "You can say...for example, 'check channel 2', or, you can just say...check 2... Now...What can I help you with?";
const HELP_REPROMPT   = 'What can I help you with?';
const DEFAULT_MESSAGE = "Sorry...I didn't quite understand you. Can you repeat it please?";
const STOP_MESSAGE    = 'Goodbye, and voice you later!';

/*================*/
/*= HELP METHODS =*/
/*================*/
//http request to get json string
function getJsonString(){
    return request(process.env.CHANNELS_JSON); //request returns a Promise 
}

//extracting the channel status out of json url
function getChannelStatus(reqChannel){
return new Promise(function (resolve, reject) { //returning a promise
    let channelStatus = "";
    
    //GET channels json
    const jsonString = getJsonString();

    //then find channel status in json
    jsonString.then(
        function(result) { 
            const json = JSON.parse(result);
            for(let channel in json) {
                if(channel === reqChannel){
                    channelStatus = json[channel];
                    resolve(channelStatus); //return success of promise
                }
            }
            resolve("");
        },
        function(error) { console.log("Fail")}
    ); 
    });
}

//Building response phrase to user
function getPhraseFromStatus(status){
    let channelStatus = "Channel ";

    switch(status){
      case "0":
          return (channelStatus += channelFromEvent+" is active");
      case "1":
          return (channelStatus += channelFromEvent+" have source problem");
      case "2":
          return (channelStatus += channelFromEvent+" is moved to channel 558");
      case "3":
          return (channelStatus += channelFromEvent+" is down");
      case "4":
          return (channelStatus += channelFromEvent+" is under maintenance");
      default:
          return "No such channel";
  }
}

/*===================*/
/*= LAMBDA HANDLERS =*/
/*===================*/
let handlers = {
  'LaunchRequest': function () { //native invoke - responses to 'open <skill name>'
        this.emit('HelloIntent');
  },
  "HelloIntent": function () {
    this.response.shouldEndSession(false); //for keeping the session open for this skill
    this.response.speak(WELCOME_MESSAGE+START_MESSAGE); 
    this.emit(':responseReady');
  },
  "channelStatus": function () { //invoked when asked a channel status
    let channelStatus = "";
    let self = this;
    
    //get channel status
   let getChPromise = getChannelStatus(channelFromEvent).then(
      function(result){
        //then assembel a phrase
        channelStatus = getPhraseFromStatus(result);
        self.response.shouldEndSession(false); //for keeping the session open for this skill
        self.response.speak(channelStatus); 
        self.emit(':responseReady');
      },
      function(error) { console.log("Fail")}
    );
  },    
  'AMAZON.HelpIntent': function () { //invoked when asking for help
        const speechOutput = HELP_MESSAGE;
        const reprompt = HELP_REPROMPT;

        this.response.shouldEndSession(false); //for keeping the session open for this skill
        this.response.speak(speechOutput);
        this.emit(':responseReady');
    },
    'AMAZON.FallbackIntent': function () { //default invokation when can't find the right intent
        const speechOutput = DEFAULT_MESSAGE;
        const reprompt = HELP_REPROMPT;

        this.response.shouldEndSession(false); //for keeping the session open for this skill
        this.response.speak(speechOutput);
        this.emit(':responseReady');
    },
    'AMAZON.StopIntent': function () { //invoked when saying 'bye'/'goodbye'/'exit'
        this.response.speak(STOP_MESSAGE);
        this.emit(':responseReady');
    },
};

/*===============*/
/*= LAMBDA MAIN =*/
/*===============*/
exports.handler = function(event, context, callback){
  if(event.request.intent && event.request.intent.slots){ //see if the user ask for channel - if so we extract the channel number from the request
    channelFromEvent = event.request.intent.slots.channelNumber.value;
  }
  let alexa = Alexa.handler(event, context);
  alexa.registerHandlers(handlers);
  alexa.execute();
};
