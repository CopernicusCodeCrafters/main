var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var mongodb = require("mongodb");
var engines = require('consolidate')



//let url = "mongodb://127.0.0.1:27017"
//let url = "mongodb://mongo:27017";
let url = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017"

let dbName = "geosoft2";

let client = new mongodb.MongoClient(url);
async function connectToMongo() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
}

connectToMongo();


//Routes
var indexRouter = require("./routes/webpage");
var impressumRouter = require("./routes/impressum")
var trainingsdatenRouter  =require("./routes/trainingsdaten")

var app = express();
app.use(express.json())

app.use(express.static(path.join(__dirname, 'public')));

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

//Fügt eine geotiff zu der Datenbank hinzu
app.post('/insert-satelliteimage', async (req, res) => {
  let { geotiff } = req.body;
  try {
    let db = client.db(dbName);
    let collection = db.collection('satellite image');
    let result = await collection.insertOne(geotiff);
    console.log('Satellite image inserted successfully:', result.insertedId);
    res.send('Satellite image inserted successfully');
  } catch (error) {
    console.error('An error occurred:', error);
    res.status(500).send('An error occurred');
  }
});

//Fügt eine GeoJSON zu der Datenbank hinzu
app.post('/insert-geojson', async (req, res) => {
  let { geojson } = req.body; //hier
  try {
    let db = client.db(dbName);
    let collection = db.collection('Trainingspolygone');
    let result = await collection.insertOne(geojson);
    console.log('GeoJSON data inserted successfully:', result.insertedId);
    res.send('GeoJSON data inserted successfully');
  } catch (error) {
    console.error('An error occurred:', error);
    res.status(500).send('An error occurred');
  }
});

app.get('/delete-feature', async (req, res) => {
  let objectId = req.query._id; 
  console.log(objectId);
  try {
    let db = client.db(dbName);
    let collection = db.collection('Trainingspolygone');
    let result = await collection.deleteOne({ _id: new mongodb.ObjectId(objectId) });
    if (result.deletedCount === 1) {
      res.status(200).send('Polygon deleted successfully.');
    } else {
      res.status(404).send('Polygon not found.');
    }
  } catch (error) {
    console.error("An error occurred deleting object: ", error);
    res.status(500).send('An error occurred');
  }
});


//get-Befehl(Stationen),der alle Datenbank-Objekte als Array zurückgibt
app.get('/getAllPolygons', async (req, res) => {
  try {
    await client.connect();
    let db = client.db(dbName);
    let collection = db.collection('Trainingspolygone');

    let geojsonArray = await collection.find().toArray();
    res.json(geojsonArray);
  } catch (error) {
    console.error(error);
    res.status(500).send('Fehler beim Abrufen der Daten');
  }
});

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


async function clearCollectionOnStart() {
  try {
    let dbName1 = 'geosoft2';
    let collectionName1 = 'class';
    await client.connect();
    let db = client.db(dbName1);
    let collection = db.collection(collectionName1);

    // Lösche alle Dokumente aus der Sammlung
    await collection.deleteMany({});

    console.log('MongoDB collection cleared on server start.');
    let demo = {
      "name": "CCC_DemoModell",
      "class": {
        "Wasser": 1,
        "Wald": 2,
        "Wiese": 3,
        "Urban": 4
      }
    }
    await collection.insertOne(demo);

    await client.close();
  } catch (error) {
    console.error('Error clearing MongoDB collection on server start:', error);
  }
}


clearCollectionOnStart();
module.exports = app;