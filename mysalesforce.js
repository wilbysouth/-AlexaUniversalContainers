const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const USERNAME = process.env.USERNAME;
const PASSWORD = process.env.PASSWORD;
const CALLBACK_URL = process.env.CALLBACK_URL;

/**
 * Load nforce-related libraries and support functions
 */

var nforce = require('nforce');
var moment = require('moment');
var pluralize = require('pluralize');

var org = nforce.createConnection({
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    redirectUri: CALLBACK_URL,
    mode: 'single'
});

function pad(n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

function simplifyDataStructure(result) {

    let a = [];
    result = result.records;
    for (let i = 0; i < result.length; i++) {
        a.push({
            productName: result[i].get('orderproduct__r').PricebookEntry.Product2.Name,
            qtyOrdered: result[i].get('orderproduct__r').Quantity,
            qtyShipped: result[i].get('quantity__c'),
            truckName: result[i].get('truck__r').Name,
            truckLat: result[i].get('truck__r').latitude__c,
            truckLng: result[i].get('truck__r').Longitude__c
        });
    }

    return a;
}

function getOrderStatus(orderId) {

    var query1 = ''.concat(

        'select ',
        'OrderProduct__r.id, ',
        'quantity__c, ',
        'OrderProduct__r.Quantity, ',
        'truck__r.name, ',
        'truck__r.latitude__c, ',
        'truck__r.longitude__c, ',
        'OrderProduct__r.PricebookEntry.Product2.Name ',

        'from TruckOrderProduct__c ',

        'where OrderProduct__r.Order.OrderNumber = \'' + pad(orderId, 8) + '\''
    );

    return new Promise(function(resolve, reject) {

        org.authenticate({ // authenticate the user

            username: USERNAME,
            password: PASSWORD

        }).then(function() { // run the soql query


            return org.query({
                query: query1
            })

        }).then(function(results) { // parse the results and generate a response

            let result = simplifyDataStructure(results);
            let speechOutput = '';

            if (result.length == 0) {
                speechOutput = 'Sorry, but order number ' + orderId + ' does not have items in transit.'
            } else {
                speechOutput = `Order number ${orderId} currently has ${result.length} ${pluralize("box",result.length)} in transit `;
                speechOutput += '<break strength="x-strong"/>These include '
                for (let i = 0; i < result.length; i++) {
                    speechOutput += `<p> ${result[i].qtyShipped} ${pluralize(result[i].productName,result[i].qtyShipped)} on ${result[i].truckName}. </p>`;
                    if (i === result.length - 2) speechOutput += ' and ';
                }
            }

            let output = {
                say: speechOutput,
                card: {
                    type: "Simple",
                    title: "Universal Containers",
                    content: speechOutput.replace(/<(?:.|\n)*?>/gm, '')
                }
            };
            console.log(output);
            resolve(output);

        }).error(function(err) {
            console.log('ERROR!!!!!', err);
            reject(null);
        });
    });
}

exports.getOrderStatus = getOrderStatus;
