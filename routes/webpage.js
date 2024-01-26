var express = require("express");
var router = express.Router();
var mongodb = require("mongodb");
const { MongoClient } = require("mongodb");
const { OpenEO, FileTypes, Capabilities } = require('@openeo/js-client'); 
const { format } = require("morgan");


//const url = "mongodb://127.0.0.1:27017"; 
const url = "mongodb://mongo:27017"; // connection URL

const client = new MongoClient(url); // mongodb client
const dbName = "mydatabase"; // database name
const collectionName = "newpois"; // collection name
console.log("test");


/* GET home page. */
router.get("/", async (req, res, next) => {
  const db = client.db(dbName);
  let collection = await db.collection(collectionName);
  let docs = await collection.find({}).limit(50).toArray();

  res.render("webpage", {
    data: docs,
  });
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

//   const db = client.db(dbName);

//   const collection = db.collection(collectionName);

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
    const dateArray = req.query.date.split(',');
    const bandsArray = req.query.bands.split(',');
    const south = req.query.south;
    const west = req.query.west;
    const north = req.query.north;
    const east = req.query.east;
    console.log(south,west,north,east)
    console.log("Bands:",bandsArray)
    console.log("Date:",dateArray)
    
    // Connect to the OpenEO server and authenticate
    const connection = await OpenEO.connect('http://34.209.215.214:8000');
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


    //filter bands
    let datacube_filtered = builder.filter_bands(datacube,bandsArray);

    //Reduce Dimension of Datacube
    var mean = function(data) {
      return this.mean(data);
    };
    let datacube_reduced = builder.reduce_dimension(datacube_filtered, mean, dimension = "t");  

    let datacube_classified = builder.cube_classify(data = datacube_reduced, model = "TestKlass")
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
    res.status(500).json({ error: 'Internal Server Error' }); // Send error response
  }
});

router.get('/getClassification', async function (req, res, next) {
  try {
    console.log('Processing satellite image...'); // Indicate the code is running up to this point

    // Passed variables
    const dateArray = req.query.date.split(',');
    const bandsArray = req.query.bands.split(',');
    const south = req.query.south;
    const west = req.query.west;
    const north = req.query.north;
    const east = req.query.east;
    console.log(south,west,north,east)
    console.log("Bands:",bandsArray)
    console.log("Date:",dateArray)
    
    // Connect to the OpenEO server and authenticate
    const connection = await OpenEO.connect('http://34.209.215.214:8000');
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


    //filter bands
    let datacube_filtered = builder.filter_bands(datacube,bandsArray);
    let datacube_filled = builder.fill_NAs_cube(datacube_filtered);
    //let datacube_agg = builder.aggregate_temporal_period(data = datacube_filled, period = "month");

    //Reduce Dimension of Datacube
    var mean = function(data) {
      return this.mean(data);
    };
    let datacube_reduced = builder.reduce_dimension(datacube_filled, mean, dimension = "t");  

    let datacube_classified = builder.cube_classify(data = datacube_reduced, model = "testneu")
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
    res.status(500).json({ error: 'Internal Server Error' }); // Send error response
  }
});

let rdsModels = [];
// Method to build a Model 
router.get('/buildModel', async function (req, res, next) {
  try {
    let { nt, mt, name, geoJSONData, convertedSouth, convertedWest, convertedNorth, convertedEast} = req.query;
    console.log(geoJSONData)

    console.log('Processing model...'); // Indicate the code is running up to this point
    // Connect to the OpenEO server
    let connection = await OpenEO.connect('http://34.209.215.214:8000');
    await connection.authenticateBasic('user', 'password');
    var builder = await connection.buildProcess();
    console.log(convertedWest)
    var datacube = builder.load_collection(
      "sentinel-s2-l2a-cogs",
      {west: convertedWest, south: convertedSouth,
        east: convertedEast,
        north: convertedNorth},
      3857,
      ["2021-06-01", "2021-06-30"]
    );

    let datacube_filtered = builder.filter_bands(datacube, ["B02", "B03", "B04"]);
    
    let datacube_filled = builder.fill_NAs_cube(datacube_filtered);

    var mean = function(data) {
      return this.mean(data);
    };

    let datacube_reduced = builder.reduce_dimension(datacube_filled, mean, dimension = "t");  
    
    // data, nt, mt und name müssen übergeben werden
    let model = builder.train_model_ml(data = datacube_reduced, samples = geoJSONData, parseInt(nt), parseInt(mt), String(name), save = true);

    let result = builder.save_result(model,'RDS'); 
    let response = await connection.computeResult(result);
    
    

    console.log("Done");
    
    // Sending the result data back to the frontend
    //res.status(200).send(result); 
    //res.send(response)
    //response.data.pipe(res); // Send the Tiff as response
    console.log("Send Done");
    rdsModels.push(String(name))
    console.log(rdsModels)
  } catch (error) {
    //console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' }); // Send error response
  }
  
});
module.exports = router;

