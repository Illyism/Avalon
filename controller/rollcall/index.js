var ROLLCALLDIR = global.avalon.dir.rollcall;
var HELPDIR = global.avalon.dir.help;

var util = require("../../helper/util");
var avalon = require("../avalon");
var _ = require("lodash");

var parser = require("../help/parser");


function RollCallController() {
  var self = this;

  this.get = function(filter, callback) {
    util.readFile(ROLLCALLDIR+"/index", function(err, content) {
      if (err) return console.error(err);

      var lines = content.split("!");
      lines.pop();
      lines = lines.map(function(line) {
        line = line.trim();
        line = line.split("\n");
        var obj = {
          name: line[0],
          title: line[1],
          city: line[2],
          guild: line[3],
          order: line[4],
          orderlevel: line[5],
          offices: line[6],
          tags: line[7]
        };
        return obj;
      });

      if (filter) lines = lines.filter(filter);
      callback(err, lines);
    });
  };

  //function filterEqual(paramName) {
  //  return function(paramVal, callback) {
  //    var seek = paramVal.toLowerCase();
  //    self.get(function(person) {
  //      if (!person.hasOwnProperty(paramName))
  //        return false;
  //      else
  //        return person[paramName].toLowerCase() === seek;
  //    }, callback);
  //  };
  //}
  //
  //function filterContains(paramName) {
  //  return function(paramVal, callback) {
  //    var seek = paramVal.toLowerCase();
  //    self.get(function(person) {
  //      if (!person.hasOwnProperty(paramName))
  //        return false;
  //      else
  //        return person[paramName].toLowerCase().indexOf(seek) >= 0;
  //    }, callback);
  //  };
  //}


  this.getName = function(name, callback) {
    self.get(function(person) {
      if (!person.name) return false;
      return person.name.toLowerCase() === name.toLowerCase();
    }, callback);
  };
  this.getCity = function(city, callback) {
    self.get(function(person) {
      if (!person.city) return false;
      return person.city.toLowerCase() === city.toLowerCase();
    }, callback);
  };
  this.getGuild = function(guild, callback) {
    self.get(function(person) {
      if (!person.guild) return false;
      return person.guild.toLowerCase() === guild.toLowerCase();
    }, callback);
  };
  this.getOrder = function(order, callback) {
    self.get(function(person) {
      if (!person.order) return false;
      return person.order.toLowerCase() === order.toLowerCase();
    }, callback);
  };
  this.getOffice = function(office, callback) {
    self.get(function(person) {
      if (!person.offices) return false;
      return person.offices.toLowerCase().indexOf(office.toLowerCase()) >= 0;
    }, callback);
  };
  this.getTag = function(tag, callback) {
    self.get(function(person) {
      if (!person.tags) return false;
      return person.tags.toLowerCase().indexOf(tag.toLowerCase()) >= 0;
    }, callback);
  };

  this.sortPatron = function(a, b) {
    if (a.city === "god") return -1;
    if (b.city === "god") return 1;
    if (a.order === "No Order" && b.order === "No Order") {
      return 0;
    }
    if (a.order === "No Order") {
      return 1;
    }
    return -1;
  };

  this.getWho = function(callback) {
    var who = avalon.users();
    self.get(function(person) {
      if (!person.name) return false;
      return _.contains(who, person.name);
    }, callback);
  };


  this.index = function(req, res, next) {
    avalon.info("rollcall.md", function(err, meta) {
      if (err) return next(err);
      self.get(null, function(err, list) {
        if (err) return next(err);
        self.getWho(function(err, who) {
          if (err) return next(err);
          res.render('rollcall/index', {
            characters: list,
            who: who,
            meta: meta.meta
          });
        });
      });
    });
  };

  this.list = function(req, res, next) {
    avalon.info("rollcall.md", function(err, meta) {
      if (err) return next(err);
      
      var city = req.params.city || req.query.city;
      var guild = req.params.guild || req.query.guild;
      var order = req.params.order || req.query.order;
      var tag = req.params.tag || req.query.tag;
      var office = req.params.office || req.query.office;

      if (city) {
        self.getCity(city, function(err, list) {
          list = list.sort(self.sortPatron);
          res.render('rollcall/list', { 
            city: util.cap(city),
            list: list,
            meta: meta.meta
          });
        });
      } else if (guild) {
        self.getGuild(guild, function(err, list) {
          list = list.sort(self.sortPatron);
          res.render('rollcall/list', { 
            guild: util.cap(guild),
            list: list,
            meta: meta.meta
          });
        });
      } else if (order) {
        self.getOrder(order, function(err, list) {
          res.render('rollcall/list', { 
            order: util.cap(order),
            list: list,
            meta: meta.meta
          });
        });
      } else if (office) {
        self.getOffice(office, function(err, list) {
          res.render('rollcall/list', {
            list: list,
            meta: meta.meta
          });
        });
      } else if (tag) {
        self.getTag(tag, function(err, list) {
          res.render('rollcall/list', {
            list: list,
            meta: meta.meta
          });
        });
      } else {
        self.get(null, function(err, list) {
          list = list.sort(self.sortPatron);
          res.render('rollcall/list', { 
            list: list,
            meta: meta.meta
          });
        });
      }

    });
  };

  this.search = function(req, res) {
    res.redirect("/rollcall/characters/" + req.query.character.toLowerCase());
  };

  this.redirect = function(req, res, next) {
    var city = req.params.city || req.query.city;
    var guild = req.params.guild || req.query.guild;
    var order = req.params.order || req.query.order;
    var status = req.params.status || req.query.status;

    if (status === "god") res.redirect("/rollcall/deities");
    else if (city) res.redirect("/rollcall/cities/"+city);
    else if (guild) res.redirect("/rollcall/guilds/"+guild);
    else if (order) res.redirect("/rollcall/orders/"+order);
    else self.list(req, res, next);
  };

  this.character = function(req, res, next) {
    var character = req.params.character || req.query.character;
    self.getName(character, function(err, list) {
      if (err || list.length === 0) return next(err);

      var person = list[0];
      if (person.city === "god") {
        util.readFile(HELPDIR + "/" + character, function(err, help) {
          if (err) return next(err);

          res.render('rollcall/character', {
            help: parser(help),
            character: character,
            list: list
          });
        });

      } else {
        util.readFile(ROLLCALLDIR + "/" + character, function(err, help) {
          if (err) {
            if (err.code === "ENOENT") {
              return res.redirect("/rollcall");
            }
            return next(err);
          }

          res.render('rollcall/character', {
            help: parser(help),
            character: character,
            description: util.getDescription(help),
            keywords: util.getKeywords(help),
            list: list
          });
        });
      }
    });
  };

  this.deities = function(req, res, next) {
    req.query = {city: "god"};
    self.list(req, res, next);
  };
}

module.exports = new RollCallController();