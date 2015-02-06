var INTRODIR = global.avalon.dir.intro,
    TOCFILE = global.avalon.files.toc;

var fs = require("fs");
var avalon = require("../avalon.js");
var marked = require("meta-marked");

var NodeCache = require( "node-cache" );
var libCache = new NodeCache( { stdTTL: 10, checkperiod: 10 } );

var toc = require(TOCFILE);
var legacy = require(INTRODIR + "/legacy.js");

function NoPageError(page, cat, result) {
  this.name = "NoPageError"
  this.message = "No Such Intro Page"
  this.page = page
  this.cat = cat
  this.result = result
}

function Controller() {
  this.index = function(req, res, next) {
    readLib(INTRODIR + "/index.md", function(err, meta, extra) {
      if (err) return next(err);
      res.render('intro/index', {
        meta: meta.meta,
        extra: extra,
        // toc: toc,
        legacy: legacy,
        avalon: avalon
      });
    });
  }

  this.legacy = function(req, res, next) {
    var url = req.params["page"] || req.query["page"];
    var result = legacy.filter(function(item) {
      return (item.url == "/" + url) && item.file;
    })
    if (result.length == 0) return next(new NoPageError(url, "legacy", result));
    
    readLib(result[0].file, function(err, meta, extra) {
      if (err) return next(err);
      res.render("intro/legacy", {
        meta: meta.meta,
        extra: extra,
        legacy: legacy,
        avalon: avalon,
        page: result[0],
      })
    })
  }

  this.page = function(req, res, next) {
    var category = req.params["category"] || req.query["category"];
    var page = req.params["page"] || req.query["page"];
    var url = "/" + category + "/" + page;

    var cat, result;

    toc.filter(function(top) {
      var items = top.items.filter(function(item) {
        return item.url == url;
      })
      if (items.length > 0) {
        cat = top;
        result = items[0];
      }
    })

    if (cat == null && result == null) return next(new NoPageError(url, cat, result));

    readLib(result.file, function(err, meta, extra) {
      if (err) return next(err);
      res.render("intro/page", {
        meta: meta.meta,
        extra: extra,
        toc: toc,
        avalon: avalon,
        cat: cat,
        page: result,
      })
    })
  }
}



var catchBlock = function(content) {
  var blockType = "normal";
  var lines = content.split("\n");
  var blocks = {}
  for (var i=0; i<lines.length; i++) {
    var line = lines[i];

    if (line.substr(0,1) == "@") {
      blockType = line.substr(1).trim();
      if (blockType === "end") blockType = "normal";
      continue;
    }
    if (blocks[blockType])
      blocks[blockType] += line + "\n"
    else
      blocks[blockType] = line + "\n";
  }
  return blocks;
}

function readLib(file, callback) {
  if (callback) {
    libCache.get( file, function( err, hit ){
      if( !err && hit[file] ){
        var blocks = hit[file];
        callback(null, blocks.normal, blocks);
      } else {
        fs.readFile(file, "utf8", function(libErr, librarycontent) {
          if (libErr) return callback(libErr);

          var blocks = catchBlock(librarycontent);
          for(var key in blocks) {
              if(blocks.hasOwnProperty(key)) {
                try {
                  blocks[key] = marked(blocks[key]);
                } catch(err) {
                  callback(err);
                }
              }
          }
          
          libCache.set( file, blocks, function( err, success ){
            if( !err && success ){
              console.log( success );
            }
          });
          callback(null, blocks.normal, blocks);
        });
      }
    });
  }
}

module.exports = new Controller();