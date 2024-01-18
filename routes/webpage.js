var express = require("express");
var router = express.Router();
var mongodb = require("mongodb");
const { MongoClient } = require("mongodb");
const { OpenEO, FileTypes, Capabilities } = require('@openeo/js-client'); 
const { format } = require("morgan");


const url = "mongodb://127.0.0.1:27017"; 
//const url = "mongodb://mongo:27017"; // connection URL

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
  let connection;
  try {
    console.log('Processing satellite image...'); // Indicate the code is running up to this point

    /*const dateArray = req.query.date.split(',');
    const south = req.query.south;
    const west = req.query.west;
    const north = req.query.north;
    const east = req.query.east;
    console.log(south,west,north,east)*/
    
    // Connect to the OpenEO server
    connection = await OpenEO.connect('http://34.209.215.214:8000');
    await connection.authenticateBasic('user', 'password');
    console.log(await connection.describeProcess('save_result'))
    var builder = await connection.buildProcess();

    var datacube = builder.load_collection(
      "sentinel-s2-l2a-cogs",
      {west:840180.2, south:6788889.4,
        east:852976.1,
        north:6799716.7},
      3857,
      ["2022-01-01", "2022-12-31"]
    );

      //["2021-06-01", "2021-06-30"]

    let datacube_filtered = builder.filter_bands(datacube, ["B02", "B03", "B04"]);
    var mean = function(data) {
      return this.mean(data);
    };
    
    let fileTypes = await connection.listFileTypes();
    let rds = fileTypes.data.output.RDS;
    console.log(rds);
    

    let datacube_filled = builder.fill_NAs_cube(datacube_filtered);
    let datacube_reduced = builder.reduce_dimension(datacube_filled, mean, dimension = "t");  
      
    let model = builder.train_model_ml(data = datacube_reduced, samples = null, nt = 100, mt = 3, name = "Test1", save = true);
    //console.log(model)
    let result = builder.save_result(model,'RDS'); 
    let response = await connection.computeResult(result);
    
    console.log()
    

    console.log("Done");
    
    // Sending the result data back to the frontend
    res.status(200).send(result); 
    //res.send(response)
    //response.data.pipe(res); // Send the Tiff as response
    console.log("Send Done");

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' }); // Send error response
  }
  
});
module.exports = router;

