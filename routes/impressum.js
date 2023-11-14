var express = require("express");
var router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("impressum", { title: "Express" });
});


router.get("/trainingsdaten", function (req, res, next) {
  res.render("impressum", { title: "Express" });
});

module.exports = router;