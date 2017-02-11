var http = require("http");
var https = require("https");
var fs = require("fs");
var formidable = require("formidable");
var util = require("util");

http.createServer(function(req, res) {
    if (req.method === "GET") {
        res.writeHead(200, {"Content-Type": "text/html"});
        fs.createReadStream("./public/form.html", "UTF-8").pipe(res);
    }
    else if (req.method === "POST") {
         var body = "";
        req.on("data", function(chunk) {
            body += chunk;
        });

        req.on("end", function() {
            console.log("body: " + body);
            processAllFieldsOfTheForm(body, res);
       });
    }
}).listen(3000);

console.log("Form server listening on port 3000");

function processAllFieldsOfTheForm(input, response) {
    var jsonInput = queryStringToJSON(input);
    console.log("JSON string input: " + jsonInput);

    response.writeHead(200, {"Content-Type": "text/html"}); 

    var options = {
             hostname: "[Your endpoint URL]",
             port: 443,
             path: "[Your endpoint path]",
             method: "POST",
             headers: {
                'Content-Type': 'application/json'
             }
    };

    console.log("Now triggering the logic app");
    var responseBody = "";
    var reqLogicApp = https.request(options, function(incomingLogicAppMsg) {
            
        console.log("Response from server started");
        console.log(`Server status: ${incomingLogicAppMsg.statusCode}`);
        console.log("Response Headers: %j", incomingLogicAppMsg.headers);

        incomingLogicAppMsg.setEncoding("UTF-8");
        incomingLogicAppMsg.on("data", function(chunk) {
            console.log(`-- chunk -- ${chunk.length}`);
            responseBody += chunk;
        });

        
        incomingLogicAppMsg.on("error", function(e) {
            console.log("Problem with Logic App request: " + e.message);
        });

        incomingLogicAppMsg.on("end", function() {
            console.log("Returning the string %j", responseBody);
            incomingLogicAppMsg.body = JSON.stringify(responseBody);
            var score = responseBody;
            response.end(`
                <!DOCTYPE html>
                <html>
                    <head>
                        <title>Check the mood of your message!</title>
                        
                    </head>
                    <body>
                        <h1>Your mood result</h1>
                        <p id="score">${score}</p>
                    </body>
                </html>
                `);
        });
    });

    // request to Logic App
    reqLogicApp.write(jsonInput);
    reqLogicApp.end();    
}

function queryStringToJSON(qs) {
    qs = qs || location.search.slice(1);

    var pairs = qs.split('&');
    var result = {};
    pairs.forEach(function(pair) {
        var pair = pair.split('=');
        var key = pair[0];
        var value = decodeURIComponent(pair[1] || '');

        if( result[key] ) {
            if( Object.prototype.toString.call( result[key] ) === '[object Array]' ) {
                result[key].push( value );
            } else {
                result[key] = [ result[key], value ];
            }
        } else {
            result[key] = value;
        }
    });

    return JSON.stringify(result);
};
