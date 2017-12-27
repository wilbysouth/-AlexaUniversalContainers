const SKILL_ID = 'amzn1.ask.skill.273cad88-4b1c-4539-9395-ce4814bcea1f';

const WELCOME_MSG = ''.concat(
    'Welcome to Universal Containers. ',
    'Please ask me about the status of your package and include your order id. ',
    'For example, Ask Universal Containers about order 12345?'
);
const REPROMPT_TEXT = 'Ask me where your package is by saying Where is order 12345?';

var mysalesforce = require('./mysalesforce');

/**
 * Load express/alexa framework
 */
var express = require('express');
var alexa = require('alexa-app');
var PORT = process.env.PORT || 3000;

var app = express();
var alexaApp = new alexa.app("universalcontainers");

alexaApp.express({
    expressApp: app,
    checkCert: false,
    debug: true
})

app.set("view engine", "jade");


/**
 * pre Handler
 * Executed before any event handlers. This is useful to setup new sessions, validate the applicationId, or do any other kind of validations.
 */

alexaApp.pre = function(request, response, type) {
  if (request.applicationId != SKILL_ID) {
    console.log('request.applicationId is: ' + request.applicationId);
    console.log('SKILL_ID is: ' + SKILL_ID);
    // fail ungracefully
    response.fail("Invalid applicationId");
  }
};


/**
 * Launch Handler
 */

alexaApp.launch(function(request, response) {
    response.say(WELCOME_MSG);
    response.card("Universal Containers", WELCOME_MSG);
});

/**
 * Order Tracking Intent
 */

alexaApp.intent("OrderTrackingIntent", {
        "slots": {
            "OrderId": "AMAZON.NUMBER"
        },
        "utterances": [
            "for status on order number {OrderId}",
            "about {OrderId}"
        ]
    },
    function(request, response) {

        response.reprompt("I didn't hear a valid order number. Please ask something like 'What is the status of order number 100?'");

        return mysalesforce.getOrderStatus(request.slot('OrderId')).then(function(output) {
              response.say(output.say);
              response.card(output.card);
        });

});

alexaApp.intent("AMAZON.HelpIntent", {}, function(request, response) {
    response.say("Here's some help. Try saying 'Ask Universal Containers for status on order 100'");
    response.card({
        type: "Simple",
        title: "Universal Containers",
        content: "Valid syntax:\nAsk Universal Containers about 100\nAsk Universal Containers for status on order 100"
    });
});

app.listen(PORT);
console.log("Listening on port " + PORT + ", try http://localhost:" + PORT + "/universalcontainers");
