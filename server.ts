"use strict";

import http from "http";
import https from "https";
import url from "url";
import fs from "fs";
import express, { request } from "express"; // @types/express
import { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import { MongoClient, ObjectId } from "mongodb";
import fileUpload, { UploadedFile } from "express-fileupload";
import cloudinary, { UploadApiResponse } from "cloudinary";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { parseUrl } from "query-string";
import generatorePw from "generate-password";
import nodemailer from "nodemailer";

// config
const cors = require('cors')
const HTTP_PORT = 1337;
const HTTPS_PORT = 1338
dotenv.config({ path: ".env" });
cloudinary.v2.config(JSON.parse(process.env.cloudinary as string));
const app = express();
const CONNECTION_STRING: any = process.env.connectionString;
const auth = JSON.parse(process.env.gmail as string)
const DBNAME = "rilieviEPerizieDB";
const whitelist = ["http://localhost:1337", "https://localhost:1338", "https://fberguis-server.onrender.com",
  "https://cordovaapp"];
  
const message = fs.readFileSync("message.html", "utf8");
const privateKey = fs.readFileSync("keys/privateKey.pem", "utf8");
const certificate = fs.readFileSync("keys/certificate.crt", "utf8");
const credentials = { "key": privateKey, "cert": certificate };
const DURATA_TOKEN = 2000;

//CREAZIONE E AVVIO DEL SERVER HTTP

let httpServer = http.createServer(app);
httpServer.listen(HTTP_PORT, () => {
  init();
});

let httpsServer = https.createServer(credentials, app);
httpsServer.listen(HTTPS_PORT, function () {
  console.log("Server in ascolto sulle porte HTTP:" + HTTP_PORT + ", HTTPS:" + HTTPS_PORT);
});

let paginaErrore: string = "";
function init() {
  fs.readFile("./static/error.html", function (err: any, data: any) {
    if (!err)
      paginaErrore = data.toString();
    else
      paginaErrore = "<h1>Risorsa non trovata</h1>"
  });
}

const corsOptions = {
  origin: function (origin: any, callback: any) {
    return callback(null, true);
  },
  credentials: true
};

//#region MIDDLEWARE
/* *********************** (Sezione 2) Middleware ********************* */
// 1. Request log
app.use("/", function (req, res, next) {
  console.log("** " + req.method + " ** : " + req.originalUrl);
  next();
});

// 2 - risorse statiche
app.use("/", express.static("./static"));

// 3 - lettura dei parametri post
app.use("/", express.json({ limit: "20mb" }));
app.use("/", express.urlencoded({ extended: true, limit: "20mb" }));

// 4 - binary upload
app.use("/",fileUpload({limits: { fileSize: 20 * 1024 * 1024 },}) );   // 20*1024*1024 // 20 M

/*
// 5 - log dei parametri
app.use("/", function (req, res, next) {
  if (Object.keys(req.query).length > 0)
    console.log("        Parametri GET: ", req.query);
  if (Object.keys(req.body).length != 0)
    console.log("        Parametri BODY: ", req.body);
  next();
});*/
// 6 - CORS
app.use("/", cors(corsOptions));

//#endregion

//#region MIDDLEWARE LOGIN
// 7. gestione login
app.post("/api/login",function (req: Request, res: Response, next: NextFunction) {
let connection = new MongoClient(CONNECTION_STRING as string);
connection.connect().then((client: MongoClient) => {
    const collection = client.db(DBNAME).collection("users");
    let regex = new RegExp(`^${req.body.username}$`, "i");
    collection.findOne({ username: regex }).then((dbUser: any) => {
        if (!dbUser) {
          res.status(401); // user o password non validi
          res.send("User not found");
        } 
        else {
          //confronto la password
          bcrypt.hash(req.body.password, 10, function(err, hash) {})
          bcrypt.compare(req.body.password,dbUser.password,(err: Error, ris: Boolean) => {
              if (err) {
                res.status(500);
                res.send("Errore bcrypt " + err.message);
                console.log(err.stack);
              } 
              else {
                  if (!ris) {
                    // password errata
                    res.send({ris:"nok"});
                  } 
                  else {
                    let token = createToken(dbUser);
                    res.setHeader("authorization", token);
                    // Per permettere le richieste extra domain
                    res.setHeader("access-control-exspose-headers","authorization");
                    res.send({ ris: "ok" });
                  }
              }
            });
        }
      }).catch((err: Error) => {
        res.status(500);
        res.send("Query error " + err.message);
        console.log(err.stack);
      }).finally(() => {
        client.close();
      });
  }).catch((err: Error) => {
    res.status(503);
    res.send("Database service unavailable");
  });
});

function createToken(user: any) {
  let time: any = new Date().getTime()/1000;
  let now = parseInt(time); //Data attuale espressa in secondi
  let username=  user.username;
  let payload = {
    iat: user.iat || now,
    exp: now + DURATA_TOKEN,
    _id: user._id,
    username: user.username,
  };
  let token = jwt.sign(payload, privateKey,{algorithm: 'RS256'});//{algorithm: 'RS256'}
  //let token = bcrypt.hashSync(user.username+now,10);
  console.log("Creato nuovo token " + token);
  return token;
}

// 8. gestione Logout


// 9. Controllo del Token

app.get("/api", function (req: any, res, next) {
  if (!req.headers["authorization"]) {
    res.status(403);
    res.send("Token mancante");
  } else {
    let token: any = req.headers.authorization;
    jwt.verify(token, privateKey, (err: any, payload: any) => {
      if (err) {
        res.status(403);
        res.send("Token scaduto o corrotto");
      } else {
        let newToken = createToken(payload);
        res.setHeader("authorization", newToken);
        // Per permettere le richieste extra domain
        res.setHeader("access-control-exspose-headers", "authorization");
        req["payload"] = payload;
        next();
      }
    });
  }
});

// Apertura della connessione
app.use("/api/", function (req: any, res: any, next: NextFunction) {
  let connection = new MongoClient(CONNECTION_STRING as string);
  connection
    .connect()
    .then((client: any) => {
      req["connessione"] = client;
      next();
    })
    .catch((err: any) => {
      let msg = "Errore di connessione al db";
      res.status(503).send(msg);
    });
});

//#endregion
/***********USER LISTENER****************/
app.post("/api/utenti",function (req: any, res: any, next: NextFunction) {

  let params = req.body
  console.log(params);

  let connection = new MongoClient(CONNECTION_STRING as string);
  connection.connect().then((client: MongoClient) => {
  let collection = client.db(DBNAME).collection("users");
    let request = collection.find(params).toArray()
    request.then((data:any)=>{
      res.status(200);
      res.send(data);
    }).catch((err: Error) => {
      res.status(500);
      res.send("Query error " + err.message);
      console.log(err.stack);
    }).finally(() => {
      client.close();
    });

  }).catch((err: Error) => {
    res.status(503);
    res.send("Database service unavailable");
  })


});

app.post("/api/updatePerizie",function (req: any, res: any, next: NextFunction) {

  let _id = req.body._id
  let upd = req.body.upd

  let connection1 = new MongoClient(CONNECTION_STRING as string);
  connection1.connect().then((client: MongoClient) => {
  let collection1 = client.db(DBNAME).collection("users");
  let request1 = collection1.findOne({username:upd.username})
    request1.then((data:any)=>{
      res.status(200);
      let connection = new MongoClient(CONNECTION_STRING as string);
      connection.connect().then((client: MongoClient) => {
      let collection = client.db(DBNAME).collection("perizie");
      let request = collection.updateOne({_id:new ObjectId(_id)},
      {$set:{idOperatore:data._id,
             data:upd.data+"T00:00:00.000Z",
             "coords.lat": upd.coords.split(" ")[0],
             "coords.lng": upd.coords.split(" ")[1],
             description: upd.description,
             photos:upd.photos

            }})
      request.then((data:any)=>{
        res.status(200);
        res.send({ris:"ok"})
        
      }).catch((err: Error) => {
        res.status(500);
        res.send("Query error " + err.message);
        console.log(err.stack);
      }).finally(() => {
        client.close();
      });

      }).catch((err: Error) => {
        res.status(503);
        res.send("Database service unavailable");
      });


      
    }).catch((err: Error) => {
      res.status(500);
      res.send("Query error " + err.message);
      console.log(err.stack);
    }).finally(() => {
      client.close();
    });

    }).catch((err: Error) => {
      res.status(503);
      res.send("Database service unavailable");
    });


  
});

app.post("/api/ricercaPerizie",function (req: any, res: any, next: NextFunction) {

  let params = req.body
  console.log(params);
  
  
  let connection = new MongoClient(CONNECTION_STRING as string);
  connection.connect().then((client: MongoClient) => {
  let collection = client.db(DBNAME).collection("users");
    let request = collection.findOne(params)
    request.then((data:any)=>{
        if(data==null)
        res.send("Utente non trovato");
        else
        {
          let connection = new MongoClient(CONNECTION_STRING as string);
          connection.connect().then((client: MongoClient) => {
            let collection = client.db(DBNAME).collection("perizie");
            let request = collection.find({idOperatore: data._id.toString() }).toArray()
            request.then((perizie:any)=>{
              let newPerizie:any = [];
              res.status(200);
              for (let perizia of perizie) {
                perizia.idOperatore = data.username
                newPerizie.push(perizia)
              }
              res.send(newPerizie);
            }).catch((err: Error) => {
              res.status(500);
              res.send("Query error " + err.message);
              console.log(err.stack);
            }).finally(() => {
              client.close();
            });
  
          }).catch((err: Error) => {
            res.status(503);
            res.send("Database service unavailable");
          });
        }
      
    }).catch((err: Error) => {
      res.status(500);
      res.send("Query error " + err.message);
      console.log(err.stack);
    }).finally(() => {
      client.close();
    });

  }).catch((err: Error) => {
    res.status(503);
    res.send("Database service unavailable");
  });

});

app.post("/api/perizie",function (req: any, res: any, next: NextFunction) {

  let params = req.body
  console.log(params);
  
  
  let connection = new MongoClient(CONNECTION_STRING as string);
  connection.connect().then((client: MongoClient) => {
  let collection = client.db(DBNAME).collection("perizie");
    let request = collection.find(params).toArray()
    request.then((data:any)=>{
      let i:number=0;
      let perizie = data;
      for (let perizia of perizie) {
        let connection = new MongoClient(CONNECTION_STRING as string);
        connection.connect().then((client: MongoClient) => {
          let collection = client.db(DBNAME).collection("users");
          let request = collection.findOne({_id: new ObjectId(perizia.idOperatore) })
          request.then((utente:any)=>{
            res.status(200);
            perizia.idOperatore = utente.username;
            i++;
            if(i == perizie.length)
            res.send(perizie);
          }).catch((err: Error) => {
            res.status(500);
            res.send("Query error " + err.message);
            console.log(err.stack);
          }).finally(() => {
            client.close();
          });

        }).catch((err: Error) => {
          res.status(503);
          res.send("Database service unavailable");
        });
      }
        

    }).catch((err: Error) => {
      res.status(500);
      res.send("Query error " + err.message);
      console.log(err.stack);
    }).finally(() => {
      client.close();
    });

  }).catch((err: Error) => {
    res.status(503);
    res.send("Database service unavailable");
  });

});


app.post("/api/aggiungiUtente",function (req: any, res: any, next: NextFunction) {
  let user = req.body

  let password = generatorePw.generate({length:15,numbers:true})
  console.log(password);

  let transporter = nodemailer.createTransport({
    "service": "gmail",
    "auth": auth
  });

  let msg =  message.replace('__user', req.body.username).replace("__password", password)
	
	let mailOptions = {
		"from": auth.user,
		"to": req.body.email,
		"subject": "Password account rilievi e perizie",
		// "text": msg,
		"html": msg,
		"attachments": [{
			"filename": "qrcode.png",
			"path": "./qrcode.png"
		}]
	}
	transporter.sendMail(mailOptions, function (err, info) {
		if (err) {
			res.status(500).send("Errore invio mail\n" + err.message);
		}
		else {
			console.log("Email inviata correttamente");
			res.send({"ris": "ok mail"});
		}
	})
  
  password = bcrypt.hashSync(user.password, 10);
  user.password = password;
  
  let connection = new MongoClient(CONNECTION_STRING as string);
  connection.connect().then((client: MongoClient) => {
  let collection = client.db(DBNAME).collection("users");
    let request = collection.insertOne(user)
    request.then((data:any)=>{
      res.status(200);
      res.send({"ris": "ok insert"});
    }).catch((err: Error) => {
      res.status(500);
      res.send("Query error " + err.message);
      console.log(err.stack);
    }).finally(() => {
      client.close();
    });

  }).catch((err: Error) => {
    res.status(503);
    res.send("Database service unavailable");
  })

});


//#region DefaultRoute
/***********DEFAULT ROUTE****************/

// Default route
app.use("/", function (req: any, res: any, next: NextFunction) {
  res.status(404);
  if (req.originalUrl.startsWith("/api/")) {
    res.send("Risorsa non trovata");
    req["connessione"].close();
  } else res.send(paginaErrore);
});

// Gestione degli errori
app.use("/", (err: any, req: any, res: any, next: any) => {
  if (req["connessione"]) req["connessione"].close();
  res.status(500);
  res.send("ERRR: " + err.message);
  console.log("SERVER ERROR " + err.stack);
});

//#endregion