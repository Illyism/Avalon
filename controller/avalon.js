var who = require("./api/who.js");
var path = require("path");
var util = require("../helper/util");

var _website = util.renderYAMLSync(global.avalon.files.website);
var _menu = util.renderYAMLSync(global.avalon.files.menu);
var _footer = util.renderYAMLSync(global.avalon.files.footer);

module.exports = {
  get footer() {
    return _footer;
  },
  get menu () {
    return _menu;
  },
  users: function() { return who.users;},
  info: function(file, callback) {
    if (callback) {
      var fileLocation = path.resolve(global.avalon.dir.library_pages, file);
      util.renderFile(fileLocation, function(err, blocks) {
        if (err) return callback(err);
        callback(null, blocks.normal, blocks);
      });
    }
  },
  get website () {
    return _website;
  }
};

var syncTime = 10000;
if (process.env.NODE_ENV === "production")
  syncTime = 180000;

setInterval(function() {
  util.renderYAML(global.avalon.files.website, function(err, content) {
    if (err) return;
    _website = content;
  });
  util.renderYAML(global.avalon.files.menu, function(err, content) {
    if (err) return;
    _menu = content;
  });
  util.renderYAML(global.avalon.files.footer, function(err, content) {
    if (err) return;
    _footer = content;
  });
}, syncTime);