var express = require("express");
var router = express.Router();
var mongodb = require("mongodb");
const { MongoClient } = require("mongodb");
const { OpenEO } = require('@openeo/js-client'); 


const url = "mongodb://127.0.0.1:27017"
//const url = "mongodb://mongo:27017";
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


router.get('/satelliteImage', async function (req, res, next) {
  try {
    console.log('Processing satellite image...'); // Indicate the code is running up to this point

    // Connect to the OpenEO server
    const connection = await OpenEO.connect('http://34.209.215.214:8000');
    //const connection = await OpenEO.connect('http://localhost:8000/');  
  
    await connection.authenticateBasic('user', 'password');

    var builder = await connection.buildProcess();

    var datacube = builder.load_collection(
      "sentinel-s2-l2a-cogs",
      {west: 563080.6, south: 4483092.4, east: 609472, north: 4530135},
      32618,
      ["2021-06-01", "2021-06-30"]
    );
    

    let datacube_filtered = builder.filter_bands(datacube, ["B02", "B03", "B04"]);
    var mean = function(data) {
      return this.mean(data);
    };
    
    //datacube = builder.reduce_dimension(datacube, mean, dimension = "t");  
    let result = builder.save_result(datacube_filtered, "GTiff");    
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
module.exports = router;

