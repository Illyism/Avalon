var express = require('express');
var router = express.Router();
var avalon = require("../controller/avalon");
var recent = require("../controller/news/recent.js");
var schedule = require("../controller/news/schedule.js");
var affairs = require("../controller/news/affairs.js");

// Methods
  function getIndex(req, res, next) {
    schedule(function(err, scheduleData, scheduleHelp) {
      if (err) return next(err);
      recent(function(err, recents) {
        if (err) return next(err);
        avalon.info("news.md", function(err, meta) {
          if (err) return next(err);
          affairs(function(err, affairsData) {
            if (err) return next(err);
            res.render('news/index', {
              meta: meta.meta,
              affairs: affairsData,
              recent: recents,
              events: scheduleData,
              scheduleHelp: scheduleHelp
            });
          });
        });
      });
    });
  }

// Routes
  router.get(['/', "/index.html"], getIndex);


module.exports = router;