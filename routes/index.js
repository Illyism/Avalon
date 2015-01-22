var express = require('express');
var router = express.Router();
var avalon = require("../controller/avalon");
var recent = require("../controller/news/recent.js");

// Routes
  router.get(['/', "/index.html"], getIndex);

// Methods
  function getIndex(req, res) {
    recent(function(data) {
      avalon.info("front.md", function(err, meta, extra) {
        if (err) return console.error(err);
        res.render('index', { avalon: avalon, meta: meta.meta, extra:extra, recent: data });
      });
    })
  }


module.exports = router;