/**
 * Module dependencies.
 */

const express = require('express');
const compression = require('compression');
const session = require('express-session');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser')
const logger = require('morgan');
const chalk = require('chalk');
const errorHandler = require('errorhandler');
const lusca = require('lusca');
const dotenv = require('dotenv').load({ path: '.env' });
/*const MongoStore = require('connect-mongo')(session);*/
/*const flash = require('express-flash');*/
const path = require('path');
/*const mongoose = require('mongoose');*/
const passport = require('passport');
const expressValidator = require('express-validator');
const expressStatusMonitor = require('express-status-monitor');
const sass = require('node-sass-middleware');
const multer = require('multer');

const upload = multer({ dest: path.join(__dirname, 'uploads') });

const PgStore=require('connect-pg-simple')(session);
const routes = require('./routes/web.js');
const handlebars = require('express3-handlebars');
const fileUpload = require('express-fileupload');
const ngrok =  (process.env.NGROK_ENABLED==="true") ? require('ngrok'):null;
/**
 * Load environment variables from .env file, where API keys and passwords are configured.
 */
// dotenv.config();
// console.log(dotenv.load({ path: '.env' }));
// console.log(process.env.DATABASE_URL);
/**
 * API keys and Passport configuration.
 */
const passportConfig = require('./config/passport');

/**
 * Create Express server.
 */


const app = express();

/**
 * Express configuration.
 */

app.use(fileUpload());
app.set('host', process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0');
app.set('port', process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080);
app.set('views', path.join(__dirname, 'views'));
app.engine('handlebars', handlebars({defaultLayout: '/pages/index',extname: '.hbs'}));
app.set('view engine', 'ejs');
app.use(expressStatusMonitor());
app.use(compression());
app.use(sass({
  src: path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public')
}));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(expressValidator());
app.use(session({
  store: new PgStore({
    url: process.env.DATABASE_URL,
    autoReconnect: true,
  }),
  secret:'jW8aor76jpPX',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 7200000 }, // two weeks in milliseconds
  secure : true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(passport.authenticate('remember-me'));
/*app.use(flash());*/
/*app.use((req, res, next) => {
  if (req.path === '/api/upload') {
    next();
  } else {
    lusca.csrf()(req, res, next);
  }
});*/
app.use(lusca.xframe('SAMEORIGIN'));
app.use(lusca.xssProtection(true));
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});
app.use(function (req, res, next) {
    if (req.url.match(/^\/(css|js|img|font)\/.+/)) {
        res.setHeader('Cache-Control', 'public, max-age=3600'); // cache header
    }
    next();
});
app.use((req, res, next) => {
  // After successful login, redirect back to the intended page
  if (!req.user &&
    req.path !== '/login' &&
    req.path !== '/signup' &&
    !req.path.match(/^\/auth/) &&
    !req.path.match(/\./)) {
    req.session.returnTo = req.originalUrl;
  } else if (req.user &&
    (req.path === '/account' || req.path.match(/^\/api/))) {
    req.session.returnTo = req.originalUrl;
  }
  next();
});


app.use('/', express.static(path.join(__dirname, '/public'), {maxAge:'2h' }));
app.use('/node_modules', express.static(path.join(__dirname, '/node_modules'), {maxAge:'2h' }));


/** setup routes **/
routes(app);

/**
 * Error Handler.
 */
if (process.env.NODE_ENV === 'development') {
  // only use in development
  app.use(errorHandler({log: errorNotification}));
}

function errorNotification(err, str, req) {
  var title = 'Error in ' + req.method + ' ' + req.url

  notifier.notify({
    title: title,
    message: str
  })
}
/**
 * Start Express server.
 */
app.listen(app.get('port'), () => {
  console.log('%s App is running at %s in %s mode', chalk.green('✓'),process.env.BASE_URL, app.get('env'));
  console.log('  Press CTRL-C to stop\n');
  if(!ngrok){
    redirectUri = `${server.address().port}` + '/callback';
    console.log(`💳  See the Sample App in your browser : ` + 'http://localhost:' + `${server.address().port}`);
    console.log(`💳  Copy this into Redirect URI on the browser : ` + 'http://localhost:' + `${server.address().port}` + '/callback');
    console.log(`💻  Make Sure this redirect URI is also copied on your app in : https://developer.intuit.com`);
}
});



process.on('uncaughtException', (err) => {
  console.error(err);
  console.log("Uncaught Exception");
});



module.exports = app;
