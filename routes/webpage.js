var express = require("express");
var router = express.Router();
var mongodb = require("mongodb");
let { MongoClient } = require("mongodb");
let { OpenEO, FileTypes, Capabilities } = require('@openeo/js-client'); 
let { format } = require("morgan");
const bodyParser = require('body-parser');




//let url = "mongodb://127.0.0.1:27017";
//let url = "mongodb://mongo:27017"; // connection URL
const url = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017"
let openeo_url = process.env.OPENEO_URI ?? "http://localhost:8000"
//let openeo_url = "http://34.209.215.214:8000/"
console.log("OPENEO URL : ",openeo_url)

/* GET home page. */
router.use(bodyParser.json());

router.get("/", async (req, res, next) => {
  res.render("webpage");
});

router.post("/newstation", function (req, res, next) {
  console.log("A new poi has been added through the user interface");

  console.log(req.body); // show the data that has been passed through the post query

  let poi = {};
  poi.poiname = req.body.pname;
  poi.cityname = req.body.cname;
  poi.coordinates = req.body.longlat;
  poi.link = req.body.picurl;

  addNewPOItoDB(client, dbName, collectionName, poi, res);
});

// retrieve all elements from the database, and pass the results as input data for the search page
// async function addNewPOItoDB(client, dbName, collectionName, poi, res) {
//   await client.connect();

//   console.log("Connected successfully to server");

//   let db = client.db(dbName);

//   let collection = db.collection(collectionName);

//   collection.insertOne(poi); // see https://www.mongodb.com/docs/drivers/node/current/usage-examples/insertOne/
//   console.log("New poi inserted in the database");

//   // pass the data added as input for the notification page
//   res.render("add_notification", { title: "Addition Completed", newpoi: poi });
// }

// Function to retrieve a RGB Tiff image from OpenEo
router.get('/satelliteImage', async function (req, res, next) {
  try {
    console.log('Processing satellite image...'); // Indicate the code is running up to this point

    // Passed variables
    let dateArray = req.query.date.split(',');
    let bandsArray = req.query.bands.split(',');
    let south = req.query.south;
    let west = req.query.west;
    let north = req.query.north;
    let east = req.query.east;
    
    console.log(south,west,north,east)
    console.log("Bands:",bandsArray)
    console.log("Date:",dateArray)
    
    // Connect to the OpenEO server and authenticate
    let connection = await OpenEO.connect(openeo_url);
    await connection.authenticateBasic('user', 'password');

    // build processes
    var builder = await connection.buildProcess();


  //build datacube
    var datacube = builder.load_collection(
      "sentinel-s2-l2a-cogs",
      {west: west, south: south, east: east, north: north},
      3857,
      dateArray, 
      bandsArray
      
 
    );

    //Reduce Dimension of Datacube
    var mean = function(data) {
      return this.mean(data);
    };
    let datacube_reduced = builder.reduce_dimension(datacube, mean, dimension = "t");

    //Compute result 
    let result = builder.save_result(datacube_reduced, "GTiff");    
    let response = await connection.computeResult(result);


    console.log("Done");

    // Sending the result data back to the frontend
    res.status(200).set('Content-Type', response.type); 
    response.data.pipe(res); // Send the Tiff as response
    console.log("Send Done");

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' }); // Send error response
  }
});




router.get('/getClassification', async function (req, res, next) {
  try {
    console.log('Processing satellite image...'); // Indicate the code is running up to this point

    // Passed variables
    let dateArray = req.query.date.split(',');
    let south = req.query.south;
    let west = req.query.west;
    let north = req.query.north;
    let east = req.query.east;
    let model = req.query.model;
    
    console.log(south,west,north,east)
    
    console.log("Date:",dateArray)
    console.log("Model:",model)
    
    // Connect to the OpenEO server and authenticate
    let connection = await OpenEO.connect(openeo_url);
    await connection.authenticateBasic('user', 'password');

    // build processes
    var builder = await connection.buildProcess();


  //build datacube
    var datacube = builder.load_collection(
      "sentinel-s2-l2a-cogs",
      {west: west, south: south, east: east, north: north},
      3857,
      dateArray
    );
      // filter bands to bands with 10 or 20 resolution
    let datacube_filtered = builder.filter_bands(datacube,["B02","B03","B04","B05","B06","B07","B08","B11","B12"])
    // NDVI and fill NAs
    //let datacube_ndvi = builder.ndvi(datacube,nir ="B08",red="B04",keepBands=true)
    let datacube_filled = builder.fill_NAs_cube(datacube_filtered);
    //Reduce Dimension of Datacube
    var mean = function(data) {
      return this.mean(data);
    };
    // reduce time dimension
    let datacube_reduced = builder.reduce_dimension(datacube_filled, mean, dimension = "t");  

    // classify cube  with given model
    let datacube_classified = builder.cube_classify(data = datacube_reduced, model = String(model))
    //Compute result 
    let result = builder.save_result(datacube_classified, "GTiff");    
    let response = await connection.computeResult(result);


    console.log("Done");

    // Sending the result data back to the frontend
    res.status(200).set('Content-Type', response.type); 
    response.data.pipe(res); // Send the Tiff as response
    console.log("Send Done");

  } catch (error) {
    console.error('Error:', error);
    alert("")
    res.status(500).json({ error: 'Internal Server Error' }); // Send error response
  }
});

let rdsModels = [];
// Method to build a Model 
router.get('/buildModel', async function (req, res, next) {
  try {
    let { nt, mt, name, geoJSONData, convertedSouth, convertedWest, convertedNorth, convertedEast} = req.query;
    console.log(geoJSONData)
    let TDDates = req.query.trainingDates.split(',');

    console.log('Processing model...'); // Indicate the code is running up to this point
    // Connect to the OpenEO server
    let connection = await OpenEO.connect(openeo_url);
    await connection.authenticateBasic('user', 'password');
    var builder = await connection.buildProcess();
    console.log(convertedWest)

    // datacube init
    var datacube = builder.load_collection(
      "sentinel-s2-l2a-cogs",
      {west: convertedWest, south: convertedSouth,
        east: convertedEast,
        north: convertedNorth},
      3857,
      TDDates
    );

    // filter bands to bands with 10 or 20 resolution
    let datacube_filtered = builder.filter_bands(datacube,["B02","B03","B04","B05","B06","B07","B08","B11","B12"])
    
    // NDVI and Fill NAs
    // let datacube_ndvi = builder.ndvi(datacube,nir ="B08",red="B04",keepBands=true)
    let datacube_filled = builder.fill_NAs_cube(datacube_filtered);

    var mean = function(data) {
      return this.mean(data);
    };

    // reduce data cube - time dimension
    let datacube_reduced = builder.reduce_dimension(datacube_filled, mean, dimension = "t");  
    
    // data, nt, mt und name müssen übergeben werden
    let model = builder.train_model_ml(data = datacube_reduced, samples = geoJSONData, parseInt(nt), parseInt(mt), String(name), save = true);

    let result = builder.save_result(model,'RDS'); 
    let response = await connection.computeResult(result);

    // Set headers for response
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', 'attachment; filename=model.rds');

    // Send the RDS as response
    response.data.pipe(res);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error in model building process' }); // Send error response
  }
});

classNames = [];
// POST endpoint saveModel
router.post('/saveModel', async (req, res) => {
  try{
    let receivedData = req.body.classIDs;
    console.log(receivedData)
    let client = new MongoClient(url); // mongodb client
    let dbName = "geosoft2"; // database name
    let collectionName = "class"; // collection name
    let db = client.db(dbName);
    let collection = db.collection(collectionName);

    // Replace existing entries with the new data
    await collection.insertOne(receivedData);
    
    await client.close();
  //classNames.push(receivedData);
  res.json({ message: 'Data saved successfully on the server.' });
} catch (error) {
  console.error('Error:', error);
  res.status(500).json({ error: 'Internal Server Error' });
}
});

// GET endpoint to retrieve data
router.get('/getModel', async (req, res) => {
  try {
    let client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true }); // mongodb client
    let dbName = "geosoft2"; // database name
    let collectionName = "class"; // collection name
    let db = client.db(dbName);
    let collection = db.collection(collectionName);

    // Fetch all documents from the collection
    const cursor = collection.find({});
    
    // Convert the cursor to an array
    const documentsArray = await cursor.toArray();

    await client.close();

    res.json(documentsArray);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET endpoint to retrieve data for a specific model by name
router.get('/getSpecificModel/:modelName', async (req, res) => {
  try {
    let client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true }); // mongodb client
    let dbName = "geosoft2";
    let collection = client.db(dbName).collection('class');

    // Extract the model name from the request parameters
    const modelName = req.params.modelName;

    // Find the GeoJSON model by name
    let geojson = await collection.findOne({ name: modelName });

    await client.close();

    if (geojson) {
      res.json(geojson);
    } else {
      res.status(404).send('Model not found');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Fehler beim Abrufen der Daten');
  }
});

module.exports = router;