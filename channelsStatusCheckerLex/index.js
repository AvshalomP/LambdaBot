//getting request object
let request = require('request-promise');

let channelNumberFromEvent = "";
let response = {
                    "dialogAction": {
                        "type": "Close",
                        "fulfillmentState": "Fulfilled",
                        "message": {
                            "contentType": "PlainText",
                            "content": ""
                        }}
                    };

/*================*/
/*= HELP METHODS =*/
/*================*/
//http request to get json string
function getJsonString(){
    return request(process.env.APOLLO_CH_JSON);
}

//extracting the channel status out of json url
function getChannelStatus(reqChannel){
return new Promise(function (resolve, reject) {
    let channelStatus   = "";
    //GET channels json
    let jsonString      = getJsonString();

    //then find channel status
    jsonString.then(
        function(result) { 
            let json = JSON.parse(result);
            for(var channel in json) {
                if(channel === reqChannel){
                    channelStatus = json[channel];
                    resolve(channelStatus);
                }
            }
            resolve("");
        },
        function(error) { console.log("Fail")}
    ); 
    });
}

//Building response phrase to user
function getChannelPhrase(channelStatus){
    let channelPhrase = "Channel "+channelNumberFromEvent;
    switch(channelStatus){
        case "0":
            return (channelPhrase += " is active");
        case "1":
            return (channelPhrase += " have source problem");
        case "2":
            return (channelPhrase += " was removed");
        case "3":
            return (channelPhrase += " is down");
        case "4":
            return (channelPhrase += " is under maintenance");
        default:
            return "No such channel";
    }
}

/*===============*/
/*= LAMBDA MAIN =*/
/*===============*/
exports.handler = (event, context, callback) => {
    let channelPhrase = "";
    
    if(event.currentIntent.slots || event.currentIntent.slots.channelNumber){
        channelNumberFromEvent = event.currentIntent.slots.channelNumber;
    }

    const res = getChannelStatus(channelNumberFromEvent).then(
            function(result){
                channelPhrase = getChannelPhrase(result);
                response.dialogAction.message.content = channelPhrase;
                callback(null, response); 
            }, 
            function(error){ console.log("Fail"); }
        );
};
