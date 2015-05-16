
//     ______                              
//    / ____/  ______  ________  __________
//   / __/ | |/_/ __ \/ ___/ _ \/ ___/ ___/
//  / /____>  </ /_/ / /  /  __(__  |__  ) 
// /_____/_/|_/ .___/_/   \___/____/____/  
//           /_/                           

var pmx = require('pmx');
pmx.init();
var express = require('express');
var path = require('path');
var logger = require('morgan');
var compression = require('compression');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

if (process.env.NODE_ENV === "production") {
  global.avalon = {
    dir: {
      help: "/help/help",
      world: "/library/world/",
      rollcall: "/help/rollcall",
      autohelp: "/help/autohelp",
      bb: "/help/bb",
      library: "/library",
      library_pages: "/library/pages",
      library_help: "/library/help",
      intro: "/library/intro",
      features: "/library/features",
      guide: "/library/guide"
    },
    files: {
      menu: "/library/menu.yaml",
      synonyms: "/library/synonyms.json",
      pages: "/library/pages.yaml",
      toc: "/library/intro/toc.yaml",
      website: "/library/website.yaml",
      footer: "/library/footer.yaml"
    }
  };
} else {
  global.avalon = {
    dir: {
      help: "/help/help",
      world: "/library/test/world/",
      rollcall: "/help/rollcall",
      autohelp: "/help/autohelp",
      bb: "/help/bb",
      library: "/library/test",
      library_pages: "/library/test/pages",
      library_help: "/library/test/help",
      intro: "/library/test/intro",
      features: "/library/test/features",
      guide: "/library/test/guide"
    },
    files: {
      menu: "/library/test/menu.yaml",
      synonyms: "/library/test/synonyms.json",
      pages: "/library/test/pages.yaml",
      toc: "/library/test/intro/toc.yaml",
      website: "/library/test/website.yaml",
      footer: "/library/test/footer.yaml"
    }
  };
}

var avalon = require("./controller/avalon");
var app = express();


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.set("x-powered-by", false);

if (app.get('env') === 'development') {
  console.log("LOGGING IN DEVELOPMENT MODE");
  app.use(logger('dev'));
} else {
  console.log("LOGGING IN PRODUCTION MODE");
  app.use(logger("dev"));
}


app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// static folders
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: 1800000 // 30 minutes
  }));
app.use("/help/downloads", express.static(path.join(__dirname, 'downloads')));


app.locals.basedir = path.join(__dirname, 'views');
// Add avalon controller in every view
app.locals._ = require("lodash");
app.locals.avalon = avalon;
app.locals.mkTitle = function() {
	if (arguments.length === 0) return avalon.website.index.title;
  var args = Array.prototype.slice.call(arguments);
  return args.join(" | ") + " | " + avalon.website.title_suffix;
};
app.locals.mkKeywords = function(keys) {
	if (!keys) return avalon.website.index.keywords;
  return keys + ", " + avalon.website.keywords_suffix;
};
app.locals.pickTitle = function(a, b) {
  if (a) return app.locals.mkTitle(a);
  return app.locals.mkTitle(b);
};



//     ____              __           
//    / __ \____  __  __/ /____  _____
//   / /_/ / __ \/ / / / __/ _ \/ ___/
//  / _, _/ /_/ / /_/ / /_/  __(__  ) 
// /_/ |_|\____/\__,_/\__/\___/____/  


app.use('/', require('./routes/index'));
app.use('/', require('./routes/dynamic'));

app.use('/api', require('./routes/api'));
app.use('/bb', require('./routes/bb'));
app.use('/help', require('./routes/help'));
// app.use('/play', require('./routes/play')); //now an alias for /connect
app.use('/news', require('./routes/news'));
app.use('/rollcall', require('./routes/rollcall'));
app.use('/history', require('./routes/history'));
app.use('/maps', require('./routes/maps'));
app.use('/lumiere', require('./routes/lumiere'));

app.use('/', require('./routes/intro'));
app.use('/', require('./routes/world'));

//     ______                         
//    / ____/_____________  __________
//   / __/ / ___/ ___/ __ \/ ___/ ___/
//  / /___/ /  / /  / /_/ / /  (__  ) 
// /_____/_/  /_/   \____/_/  /____/  

var ErrorHandler = require("./controller/error");

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error("not found");
  err.status = 404;
  err.path = req.url;
  next(err);
});

app.use(function(err, req, res, next) {
  switch(err.type) {
    case "help":
    ErrorHandler.help(err, req, res, next);
    break;
    case "guild":
    res.redirect("/world#guilds");
    break;
    case "city":
    res.redirect("/world#cities");
    break;
    case "intro":
    ErrorHandler.intro(err, req, res, next);
    break;
    default:
    ErrorHandler.print(err, req, res, next);
  }
});

app.use(pmx.expressErrorHandler());
app.use(function(err, req, res, next) {
  ErrorHandler.print(err, req, res, next);
});

module.exports = app;
