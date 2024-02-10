var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var mongodb = require("mongodb");
var engines = require('consolidate')


const url = "mongodb://127.0.0.1:27017"
//const url = "mongodb://mongo:27017";
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
var landingPageRouter = require("./routes/landingPage")

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

app.use("/", landingPageRouter);
app.use("/webpage", indexRouter);
app.use("/impressum", impressumRouter)
app.use("/trainingsdaten",trainingsdatenRouter)

let openEoUrl = '';

// Save OpenEo Url
app.post('/save-url', (req, res) => {
  openEoUrl = req.body.url; // Assuming the URL is sent in the request body

  // Log the received data
  console.log(typeof(openEoUrl), openEoUrl);

  // Send a response to the client
  res.json({ status: 'success', message: 'URL saved successfully' });
});

// Retrieve the current OpenEo URL
app.get('/get-url', (req, res) => {
  res.json({url: openEoUrl});
});

//Fügt eine GeoJSON zu der Datenbank hinzu
app.post('/insert-geojson', async (req, res) => {
  const { geojson } = req.body; //hier
  try {
    const db = client.db(dbName);
    const collection = db.collection('Trainingspolygone');
    const result = await collection.insertOne(geojson);
    console.log('GeoJSON data inserted successfully:', result.insertedId);
    res.send('GeoJSON data inserted successfully');
  } catch (error) {
    console.error('An error occurred:', error);
    res.status(500).send('An error occurred');
  }
});

app.get('/delete-feature', async (req, res) => {
  const objectId = req.query._id; 
  console.log(objectId);
  try {
    const db = client.db(dbName);
    const collection = db.collection('Trainingspolygone');
    const result = await collection.deleteOne({ _id: new mongodb.ObjectId(objectId) });
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
    const db = client.db(dbName);
    const collection = db.collection('Trainingspolygone');

    const geojsonArray = await collection.find().toArray();
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
module.exports = app;