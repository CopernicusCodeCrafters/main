var express = require("express");
var router = express.Router();
var mongodb = require("mongodb");
const { MongoClient } = require("mongodb");

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
module.exports = router;

