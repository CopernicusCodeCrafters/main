var express = require("express");
var router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("landingPage", { title: "Express" });
});


router.get("/landingPage", function (req, res, next) {
  res.render("landingPage", { title: "Express" });
});

module.exports = router;