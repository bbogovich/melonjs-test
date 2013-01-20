var System = require("util");
var fs = require('fs');
var HTTP = require("http");

var WebSocketServer = require("websocket").server;
var index = fs.readFileSync('index.html');
//var gameEngine = require("./GameEngine");

var MaxConnections = 10;
var Connections = {};

function ObjectSize(Obj)
{
    var Size = 0;
	for (var Key in Obj)
		if (Obj.hasOwnProperty(Key))
			Size++;
	return Size;
}

function SendGameState()
{
    /*
	var messagePlayers = [];
	var messageMissiles = [];
	var players = gameEngine.gameState.players;
	var missiles = gameEngine.gameState.missiles;
	for (var i in players){
		messagePlayers.push(players[i]);
	}
	for (i in missiles){
		messageMissiles.push(missiles[i]);
	}
	for (var ID in Connections){
		Connections[ID].sendUTF(JSON.stringify({
				transactionId:new Date().getTime(),
				messageType:"game.defaultgame.outbound.GameStateMessage",
				players:messagePlayers,
				missiles:messageMissiles,
				paused:gameEngine.gameState.paused,
				started:gameEngine.gameState.started
			}));
	}
    */
}

/*
 * When a websocket disconnects
 * */
function HandleClientClosure(ID)
{
	if (ID in Connections)
	{
		System.log("Disconnect from " + Connections[ID].IP);
		delete Connections[ID];
		gameEngine.removePlayer(ID);
	}
}

function HandleClientMessage(ID, Message)
{
	// Check that we know this client ID and that the message is in a format we expect.
	if (!(ID in Connections)) return;
	System.log("HandleClientMessage("+ID+","+Message+") ");
	if(Connections[ID]){
		var connection = Connections[ID];
		connection.sendUTF(JSON.stringify({
				transactionId:new Date().getTime(),
				messageType:"ACK",
				rxId:Message.transactionId
		}));
		if(Message.messageType){
			switch(Message.messageType){
				case "game.inbound.GameRegistrationMessage":
					//gameEngine.initPlayer(ID);
					connection.sendUTF(JSON.stringify({
							transactionId:new Date().getTime(),
							messageType:"game.outbound.RegistrationSuccessMessage",
							sessionId:connection.ID
						}));
					break;
				default:
					//gameEngine.addPlayerMessage(ID,Message);
					break;
			}
		}
	}
	System.log("HandleClientMessage: Exiting");
}

//Creates an HTTP server that will respond with a simple blank page when accessed.
var HTTPServer = HTTP.createServer(
		function(Request, Response) {
			System.log(Request);
			for (var i in Request){
				if(typeof(Request[i])!="function"){
					System.log(i+": "+(typeof(i)!="function"?Request[i]:"[function Function]"));
				}
			}
			var content;
			try{
				var url=Request.url;
				if(url=="/"){
					url="/index.html";
				}
				content = fs.readFileSync(url.replace(/^\//,""));
				var urlMatch = url.match(/\.([^$]+)$/);
				var contentType="text/plain";
				if(urlMatch!==null){
					switch(urlMatch[1].toLowerCase()){
						case "html":
							contentType="text/html";
							break;
						case "js":
							contentType="application/javascript";
							break;
					}
				}
				Response.writeHead(200, { "Content-Type": contentType });
			}catch(e){
				content="404!!!";
				Response.writeHead(404, { "Content-Type": "text/plain" });
			}
			Response.end(content);
		}
	);

// Starts the HTTP server on port 5000.
HTTPServer.listen(5000, function() {
		System.log("Listening for connections on port 5000"); 
	}
);

// Creates a WebSocketServer using the HTTP server just created.
var Server = new WebSocketServer(
	{
		httpServer: HTTPServer,
		closeTimeout: 2000
	}
);

function handleWebSocketRequest(Request){
	if (ObjectSize(Connections) >= MaxConnections) {
		Request.reject();
		return;
	}

	var Connection = Request.accept(null, Request.origin);
	Connection.IP = Request.remoteAddress;

	// Assign a random ID that hasn't already been taken.
	do {
		Connection.ID = Math.floor(Math.random() * 100000);
	} while (Connection.ID in Connections);

	Connections[Connection.ID] = Connection;
	Connection.sendUTF(JSON.stringify({
				transactionId:new Date().getTime(),
				messageType:"game.outbound.SessionCreatedMessage",
				sessionId:Connection.ID
			}));
	Connection.on("message",
			function(Message){
				System.log("onMessage:"+Message);
				for (var i in Message){
					System.log(i+": "+Message[i]);
				}
				// All of our messages will be transmitted as unicode text.
				if (Message.type == "utf8")
					HandleClientMessage(Connection.ID, JSON.parse(Message.utf8Data));
			}
	);
	Connection.on("close",function(){
			HandleClientClosure(Connection.ID);
		}
	);
	System.log("Logged in " + Connection.IP + "; currently " + ObjectSize(Connections) + " users.");
};
//When a client connects...
Server.on("request",handleWebSocketRequest);

function gameRunner(){
	//if(gameEngine.runGameFrame()){
	//	SendGameState();
	//}
	setTimeout(gameRunner,10/*gameEngine.FRAME_INTERVAL*/);
}
gameRunner();