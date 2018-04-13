var app = require('express')(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    ent = require('ent'), // Permet de bloquer les caractères HTML (sécurité équivalente à htmlentities en PHP)
    fs = require('fs');
    mongo = require('mongodb');
    MongoClient = require('mongodb').MongoClient;
    url = "mongodb://localhost:27017/";

    MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db("mongochat");
    dbo.createCollection("messages", function(err, res) {
    if (err) throw err;
    console.log("Collection created!");
    db.close();
    });
    });

// Chargement de la page index.html
app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});



io.sockets.on('connection', function (socket, pseudo) {
    // Dès qu'on nous donne un pseudo, on le stocke en variable de session et on informe les autres personnes

    socket.on('delete', function(data) {
        MongoClient.connect(url, function(err, db) {
        var dbo = db.db("mongochat");
        dbo.dropDatabase();
        });
    });

    MongoClient.connect(url, function(err, db) {
        var dbo = db.db("mongochat");
        dbo.collection("messages").find({}).toArray(function(err, result) {
            if (err) throw err;  
            console.log('test');
            for (var i = 0; i < result.length; i++) {
                socket.emit('lastmessages',{pseudo: result[i].pseudo, message: result[i].message});
            }
    });
    });
    socket.on('nouveau_client', function(pseudo) {
        pseudo = ent.encode(pseudo);
        socket.pseudo = pseudo;
        socket.broadcast.emit('nouveau_client', pseudo);
    });

    // Dès qu'on reçoit un message, on récupère le pseudo de son auteur et on le transmet aux autres personnes

    socket.on('message', function (message) {
        message = ent.encode(message);
        socket.broadcast.emit('message', {pseudo: socket.pseudo, message: message});
          MongoClient.connect(url, function(err, db) {
          if (err) throw err;
            var dbo = db.db("mongochat");
            dbo.collection("messages").insertOne({pseudo: socket.pseudo, message: message}, function(err, res) {
                if (err) throw err;
            console.log("1 document inserted");
            db.close();
            });
        });
    }); 
});

server.listen(8083);
