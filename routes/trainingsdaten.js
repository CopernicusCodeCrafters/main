var express = require("express");
var router = express.Router();
var mongodb = require("mongodb");
const { MongoClient } = require("mongodb");
const {
  setCanvasKitWasmLocateFile,
  GeoPackageManager,
  GeoPackageTileRetriever,
  FeatureTiles,
  Canvas,
  FeatureIndexManager,
  BoundingBox,
  TileUtils,
  GeoPackageAPI
} = require('@ngageoint/geopackage');
const { GeoJSONToGeoPackage } = require('@ngageoint/geopackage-geojson-js');

const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const url = "mongodb://127.0.0.1:27017"; // connection URL
const client = new MongoClient(url); // mongodb client
const dbName = "trainingsdaten"; // database name
const collectionName = "daten"; // collection name
console.log("test");

/* GET home page. */
router.get("/", async (req, res, next) => {
  const db = client.db(dbName);
  let collection = await db.collection(collectionName);
  let docs = await collection.find({}).limit(50).toArray();

  res.render("trainingsdaten", {
    data: docs,
  });
});


router.use(express.static('public')); // Serve static files from the 'public' directory


async geojson() {
  const geoPackage = await GeoPackageAPI.open(this.gpkgContent)
  const featureTables = geoPackage.getFeatureTables()
  let features = []
  featureTables.forEach(function (table) {
    try {
      const geoms = geoPackage.queryForGeoJSONFeaturesInTable(table)
      features = features.concat(geoms)
    } catch (err) {
      console.log('Error reading table ' + table, err)
    }
  })

  return {
    type: 'FeatureCollection',
    features: features,
  }
}
}

router.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send('No file uploaded.');
    }

    const fileData = req.file;
    console.log(req.file)
    // Read the file buffer using toString() for GeoPackage processing
    const fileContent = fileData.buffer.toString();

    let responseData = null;

    if (fileData.originalname.endsWith('.gpkg')) {
      const tableName = 'features';
      const converter = new GeoJSONToGeoPackage();
      /*converter.extract(fileData, tableName).then(geoJSON => {
        console.log('Extracted GeoJSON - %s features.', geoJSON.features.length);
      })*/
      GeoPackageAPI.open(new Uint8Array(fileContent))
      // Process the uploaded GeoPackage file
      /*GeoPackageAPI.openGeoPackageBuffer(fileContent, (err, result) => {
        if (err) {
          res.status(500).send('Error opening GeoPackage');
        } else {
          const features = result.getFeatureDao().queryForAll();
          responseData = features;
          res.json(responseData);
        }
      });*/
    } else if (fileData.originalname.endsWith('.geojson')) {
      // Parse the GeoJSON file content
      const parsedGeoJSON = JSON.parse(fileContent);
      responseData = parsedGeoJSON;
      res.json(responseData);
    } else {
      res.status(400).send('Unsupported file format');
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Server Error');
  }
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
async function addNewPOItoDB(client, dbName, collectionName, poi, res) {
  await client.connect();

  console.log("Connected successfully to server");

  const db = client.db(dbName);

  const collection = db.collection(collectionName);

  collection.insertOne(poi); // see https://www.mongodb.com/docs/drivers/node/current/usage-examples/insertOne/
  console.log("New poi inserted in the database");

  // pass the data added as input for the notification page
  res.render("add_notification", { title: "Addition Completed", newpoi: poi });
}
module.exports = router;



