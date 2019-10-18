/**
 * Module dependencies.
 */
const cluster = require('cluster');
const ipify = require('ipify');
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
const helmet = require('helmet')
// const csrf = require('csurf')


/**
 * Create Express server.
 */
// var csrfProtection = csrf({ cookie: true })
const app = express();

/**
 * Express configuration.
 */
/*if (cluster.isMaster) {

   // Count the machine's CPUs
   var cpuCount = require('os').cpus().length;

   // Create a worker for each CPU
   for (var i = 0; i < cpuCount; i += 1) {
       cluster.fork();
   }

   // Listen for dying workers
   cluster.on('exit', function (worker) {

       // Replace the dead worker, we're not sentimental
       console.log('Worker %d died :(', worker.id);
       cluster.fork();

   });

// Code to run if we're in a worker process
} else {

    console.log('Worker %d running!', cluster.worker.id);*/

    /*(async () => {
        console.log(await ipify());
        //=> '2001:0db8:85a3:0000:0000:8a2e:0370:7334'

        console.log(await ipify({useIPv6: false}));
        //=> '82.142.31.236'
    })();*/
    
    // app.use(helmet())
    // app.disable('x-powered-by')

    // app.use(helmet.permittedCrossDomainPolicies())
    // app.use(helmet.featurePolicy({
    //   features: {
    //     fullscreen: ["'self'"],
    //     vibrate: ["'none'"],
    //     payment: ['example.com'],
    //     syncXhr: ["'none'"]
    //   }
    // }))
    // app.use(helmet.hpkp({
    //   maxAge: 7776000,
    //   sha256s: ['jW8aor76jpPX=', '76jpPXjW8aor=']
    // }))
    // app.use(helmet.frameguard({ action: 'sameorigin' }))
    // app.use(helmet.referrerPolicy({ policy: 'same-origin' }))


    // app.use(helmet.contentSecurityPolicy({
    //   directives: {
    //     defaultSrc: ["'self'"],
    //     styleSrc: ["'self'", 'maxcdn.bootstrapcdn.com']
    //   },
    //   browserSniff: false,
    //   setAllHeaders: true
    // }))
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
      cookie: {
        httpOnly:true,
        sameSite:true,
        maxAge: 2592000000 }, // two weeks in milliseconds
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
    const server = app.listen(app.get('port'), () => {
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
//}



module.exports = app;
