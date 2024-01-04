var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var mongodb = require("mongodb");
const bodyParser = require('body-parser');
var engines = require('consolidate')
var cors = require('cors')

const url = "mongodb://127.0.0.1:27017"
//const url = "mongodb://mongo:27017";
//const url = "mongodb://mongo:27017";
let dbName = "mydatabase";
let client = new mongodb.MongoClient(url);
async function connectToMongo() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
}

//connectToMongo();

//Routes
var indexRouter = require("./routes/webpage");
var impressumRouter = require("./routes/impressum")
var trainingsdatenRouter  =require("./routes/trainingsdaten")


var app = express();
app.use(express.json())
app.post('/uploadRoute', async (req, res) => {
  try {

    // Verbindung zur MongoDB herstellen
    await client.connect();
    console.log('Mit MongoDB verbunden');
    let { geojson } = req.body;
    const db = client.db(dbName);
    const collection = db.collection('routen');
    let geojsonParsed = JSON.parse(geojson);
    // GeoJSON-Daten aus dem Request-Body extrahieren und in die Sammlung einfügen
    const result = await collection.insertOne(geojsonParsed);

    console.log('GeoJSON-Daten erfolgreich hochgeladen:', result.insertedId);
    res.status(201).json({ message: 'GeoJSON-Daten erfolgreich hochgeladen', insertedId: result.insertedId });
  } catch (error) {
    console.error('Fehler beim Hochladen der GeoJSON-Daten in MongoDB:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  } finally {
    // Verbindung schließen, wenn Sie fertig sind
    client.close();
  }
});

app.get('/getStation', async (req, res) => {
  try {
    await client.connect();
    let db = client.db(dbName);
    let collection = db.collection('newpois');
    let geojsonArray = await collection.find().toArray(); // Find all documents and convert to an array
    client.close();

    res.json(geojsonArray); // Send the array of GeoJSON documents as a JSON response
  } catch (error) {
    console.error(error);
    res.status(500).send('Fehler beim Abrufen der Daten');
  }
});




// view engine setup
app.engine('html', engines.swig)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/webpage", indexRouter);
app.use("/impressum", impressumRouter)
app.use("/trainingsdaten",trainingsdatenRouter)




// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});


app.get('/getGeoJSON', async (req, res) => {
  try {
      await client.connect();
      let db = client.db(dbName);
      let collection = db.collection('Stationen');

      let geojson = await collection.findOne(); 
      
      client.close();

      res.json(geojson); 
  } catch (error) {
      console.error(error);
      res.status(500).send('Fehler beim Abrufen der Daten');
  }
});

//Setup to fix Cors Issue
app.use(cors())

var corsOptions = {
  origin: 'http://34.209.215.214:8000/',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

app.get('/products/:id', cors(corsOptions), function (req, res, next) {
  res.json({msg: 'This is CORS-enabled for only example.com.'})
})

app.listen(3001, function () {
  console.log('CORS-enabled web server listening on port 80')
})
module.exports = app;