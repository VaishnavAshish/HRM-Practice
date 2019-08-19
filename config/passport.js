const passport = require('passport');
const request = require('request');
/*const { Strategy: InstagramStrategy } = require('passport-instagram');*/
const { Strategy: LocalStrategy } = require('passport-local');
const bcrypt = require('bcrypt-nodejs');
var pool = require('./dbconfig');
var userrole = require('./user-role');
const RememberMeStrategy = require('passport-remember-me').Strategy;
const handleResponse = require('../controllers/page-error-handle');
global.inputUser = [];
global.currencyWithSymbolArray=[
  {"symbol":"؋","name":"AFN","value":1},
  {"symbol":"$","name":"ARS","value":1},
  {"symbol":"ƒ","name":"AWG","value":1.60},
  {"symbol":"$","name":"AUD","value":1.22},
  {"symbol":"₼","name":"AZN","value":1},
  {"symbol":"$","name":"BSD","value":1},
  {"symbol":"$","name":"BBD","value":1},
  {"symbol":"Br","name":"BYN","value":1},
  {"symbol":"BZ$","name":"BZD","value":1},
  {"symbol":"$","name":"BMD","value":1},
  {"symbol":"$b","name":"BOB","value":1},
  {"symbol":"KM","name":"BAM","value":1},
  {"symbol":"P","name":"BWP","value":1},
  {"symbol":"лв","name":"BGN","value":1},
  {"symbol":"R$","name":"BRL","value":3.72},
  {"symbol":"$","name":"BND","value":1},
  {"symbol":"៛","name":"KHR","value":1},
  {"symbol":"$","name":"CAD","value":1.16},
  {"symbol":"$","name":"KYD","value":1},
  {"symbol":"$","name":"CLP","value":1},
  {"symbol":"¥","name":"CNY","value":6.05},
  {"symbol":"$","name":"COP","value":1},
  {"symbol":"₡","name":"CRC","value":1},
  {"symbol":"kn","name":"HRK","value":1},
  {"symbol":"₱","name":"CUP","value":1},
  {"symbol":"Kč","name":"CZK","value":1},
  {"symbol":"kr","name":"DKK","value":1},
  {"symbol":"RD$","name":"DOP","value":1},
  {"symbol":"$","name":"XCD","value":2.42},
  {"symbol":"£","name":"EGP","value":1},
  {"symbol":"$","name":"SVC","value":1},
  {"symbol":"€","name":"EUR","value":0.86},
  {"symbol":"£","name":"FKP","value":1},
  {"symbol":"$","name":"FJD","value":1},
  {"symbol":"¢","name":"GHS","value":1},
  {"symbol":"£","name":"GIP","value":1},
  {"symbol":"Q","name":"GTQ","value":1},
  {"symbol":"£","name":"GGP","value":1},
  {"symbol":"$","name":"GYD","value":1},
  {"symbol":"L","name":"HNL","value":1},
  {"symbol":"$","name":"HKD","value":1},
  {"symbol":"Ft","name":"HUF","value":1},
  {"symbol":"kr","name":"ISK","value":1},
  {"symbol":"₹","name":"INR","value":72.41},
  {"symbol":"Rp","name":"IDR","value":12574.98},
  {"symbol":"﷼","name":"IRR","value":1},
  {"symbol":"£","name":"IMP","value":1},
  {"symbol":"₪","name":"ILS","value":1},
  {"symbol":"J$","name":"JMD","value":1},
  {"symbol":"¥","name":"JPY","value":99.72},
  {"symbol":"£","name":"JEP","value":1},
  {"symbol":"лв","name":"KZT","value":1},
  {"symbol":"₩","name":"KPW","value":1},
  {"symbol":"лв","name":"KGS","value":1},
  {"symbol":"₭","name":"LAK","value":1},
  {"symbol":"£","name":"LBP","value":1},
  {"symbol":"$","name":"LRD","value":1},
  {"symbol":"ден","name":"MKD","value":1},
  {"symbol":"RM","name":"MYR","value":1},
  {"symbol":"₨","name":"MUR","value":1},
  {"symbol":"$","name":"MXN","value":16.69},
  {"symbol":"₮","name":"MNT","value":1},
  {"symbol":"MT","name":"MZN","value":1},
  {"symbol":"$","name":"NAD","value":1},
  {"symbol":"₨","name":"NPR","value":1},
  {"symbol":"ƒ","name":"ANG","value":1},
  {"symbol":"$","name":"NZD","value":1},
  {"symbol":"C$","name":"NIO","value":1},
  {"symbol":"₦","name":"NGN","value":1},
  {"symbol":"kr","name":"NOK","value":1},
  {"symbol":"﷼","name":"OMR","value":1},
  {"symbol":"₨","name":"PKR","value":1},
  {"symbol":"B/.","name":"PAB","value":1},
  {"symbol":"Gs","name":"PYG","value":1},
  {"symbol":"S/.","name":"PEN","value":1},
  {"symbol":"₱","name":"PHP","value":1},
  {"symbol":"zł","name":"PLN","value":1},
  {"symbol":"﷼","name":"QAR","value":1},
  {"symbol":"lei","name":"RON","value":1},
  {"symbol":"₽","name":"RUB","value":1},
  {"symbol":"£","name":"SHP","value":1},
  {"symbol":"﷼","name":"SAR","value":1},
  {"symbol":"Дин.","name":"RSD","value":1},
  {"symbol":"₨","name":"SCR","value":1},
  {"symbol":"$","name":"SGD","value":1},
  {"symbol":"$","name":"SBD","value":1},
  {"symbol":"S","name":"SOS","value":1},
  {"symbol":"R","name":"ZAR","value":1},
  {"symbol":"₨","name":"LKR","value":1},
  {"symbol":"kr","name":"SEK","value":1},
  {"symbol":"CHF","name":"CHF","value":1},
  {"symbol":"$","name":"SRD","value":1},
  {"symbol":"£","name":"SYP","value":1},
  {"symbol":"NT$","name":"TWD","value":1},
  {"symbol":"฿","name":"THB","value":1},
  {"symbol":"TT$","name":"TTD","value":1},
  {"symbol":"₺","name":"TRY","value":1},
  {"symbol":"$","name":"TVD","value":1},
  {"symbol":"₴","name":"UAH","value":1},
  {"symbol":"£","name":"GBP","value":0.69},
  {"symbol":"$","name":"USD","value":1},
  {"symbol":"$U","name":"UYU","value":1},
  {"symbol":"лв","name":"UZS","value":1},
  {"symbol":"Bs","name":"VEF","value":1},
  {"symbol":"₫","name":"VND","value":17460.00},
  {"symbol":"﷼","name":"YER","value":1},
  {"symbol":"Z$","name":"ZWD","value":1}

];
/*const { Strategy: FacebookStrategy } = require('passport-facebook');
const { Strategy: TwitterStrategy } = require('passport-twitter');
const { Strategy: GitHubStrategy } = require('passport-github');
const { OAuth2Strategy: GoogleStrategy } = require('passport-google-oauth');
const { Strategy: LinkedInStrategy } = require('passport-linkedin-oauth2');
const { Strategy: OpenIDStrategy } = require('passport-openid');
const { OAuthStrategy } = require('passport-oauth');
const { OAuth2Strategy } = require('passport-oauth');
const User = require('../models/User');
*/
// const pg = require("pg");
// const client = new pg.Client(process.env.DATABASE_URL||'postgres://ctrmdvdfcrqljj:db35345e3d63d318e372f360000fcf82669d465451c671550af4dbc0c88a1086@ec2-54-243-253-24.compute-1.amazonaws.com:5432/d2pjluiq7l61ha');
var pool = require('./dbconfig');

shouldAbort = (err, client, done) => {
  console.error('inside shouldAbort');
  if (err) {
    console.error('Error in transaction', err.stack)
    client.query('ROLLBACK', (err) => {
      if (err) {
        console.error('Error rolling back client', err.stack)
      }
      // release the client back to the pool
      done();
    })
  }
  return !!err
}

handleError = (res, reason, message, code) => {
  // console.log("ERROR: " + reason);
  res.status(code || 500).json({ "error": message });
}

passport.serializeUser((user, done) => {
  // console.log('serialize user is '+JSON.stringify(user));
  done(null, user);
});

passport.deserializeUser((user, done) => {
  pool.connect((err, client, poolDone) => {
    if(err) {
      // console.log(err);
    } else {
      let queryToExec='SELECT * FROM users where email=$1 AND company_id=$2';
      client.query(queryToExec,[user.email,user.company_id], function(err, userD) {
        if(err) {
          shouldAbort(err, client, poolDone);
          done(err, null);
        } else {
          let userData=user;
          // console.log('passport.deserializeUser'+JSON.stringify(user));
          poolDone();
          // console.log("After Pool done");
          done(null, userData);
          // console.log("After done");
        }
      });
    }
  });
});

comparePassword=(candidatePassword, actualPassword, cb)=> {
  if(candidatePassword === actualPassword){
    return cb(null, true);
  }else{
    return cb('Error in password.Please enter again', false);
  }
  /*bcrypt.compare(candidatePassword, actualPassword, (err, isMatch) => {
    cb(err, isMatch);
  });*/
}
/**
 * Sign in using Email and Password.
 */
/*passport.use('admin',new LocalStrategy({ usernameField: 'email'}, (email , password, done) => {
  let queryToExec='SELECT * FROM users where email = $1';
  // console.log('SELECT * FROM users where email = $1 '+email.toLowerCase());
  client.query(queryToExec, [email.toLowerCase()], function(err, user) {
    // console.log('signed in user with email is '+JSON.stringify(user)+' size of user is '+user.rows.length);
      if (err) { return done('error in getting email'+err,false,null); }
      if (user.rows.length<=0) {
        return done(null, false, { msg: `Email ${email} not found.` });
      }
      // console.log('user entered password is'+password);
      // console.log('db stored password is'+user.rows[0].password);
      comparePassword(password,user.rows[0].password, (err, isMatch) => {
        if (err) { return done('error in password confirmation'+err,false,null); }
        if (isMatch) {
          // console.log('is match '+isMatch);
          return done(null, user,null);
        }
        // console.log('inside compare');
        return done(null, false, { msg: 'Invalid email or password.' });
      });

  });
}));*/
passport.use('user', new LocalStrategy({ usernameField: 'email',passReqToCallback: true}, (req, email, password, done) => {
  let domain=req.body.domain;

  pool.connect((err, client, poolDone) => {
    client.query("select * from company INNER JOIN (SELECT company_id,stripe_customer_id,stripe_subscription_id,quickbook_enabled,xero_enabled FROM setting) setting ON company.id = setting.company_id AND company.domain ilike $1 AND company.archived=$2", [domain,false], function(err, company) {
    // client.query("select * from company where domain=$1 AND archived=$2", [domain,false], function(err, company) {
      if (err) {
        // console.log('err-----------' + JSON.stringify(err));
        /*poolDone();*/
        shouldAbort(err, client, poolDone);
        return done('Failed to load domain', null);

      }else{
        // console.log('err-----------' + company);
        if (company.rows.length<=0) {
          // console.log('company.rows.length-----------' + company);
          poolDone();
          return done('Domain not found', null);
        }
        // console.log('email-----------' + email);
        //  console.log('company domain-----------' + JSON.stringify(company.rows[0]));
        //  console.log('SELECT * FROM users where email=$1 and company_id=$2'+email.toLowerCase()+company.rows[0].id);

        client.query("SELECT * FROM users where email=$1 and company_id=$2 and archived=$3 and add_status IN ('Joined','Approved')", [email.toLowerCase(),company.rows[0].id,false], function(err, user) {
            if (err) {
              /*poolDone();*/
              // console.log(err);
              shouldAbort(err, client, poolDone);
              return done('Failed to load user', null);
            }else if (user.rows.length<=0) {
              // console.log(user.rows[0]);
              poolDone();
              return done('Email is not correct or not connected to the company.Please contact to the administrator', null);
            }else{
              // console.log(user.rows[0]);
              comparePassword(password, user.rows[0].password, (err, isMatch) => {
                if (err) {
                  poolDone();
                  return done('Error in password confirmation. Please enter password correctly.',null);
                }else if (isMatch) {
                  // console.log('is match '+isMatch);
                  user.rows[0]['company'] = company.rows[0].name;
                  user.rows[0]['company_id'] = company.rows[0].id;
                  user.rows[0]['company_info'] = company.rows[0];
                  // console.log("**********************user*********************");
                  // console.log(user.rows[0]);
                  // console.log("**********************user*********************");
                  poolDone();
                  return done(null, user.rows[0]);
                }
                // console.log('inside compare');
                poolDone();
                return done('Invalid credentials', null);
              });
            }
        });
      }

    });
  });

}));


global.tokens = {}

function consumeRememberMeToken(token, fn) {
  console.log('consume remember me token');
  var uid = tokens[token];
  // invalidate the single-use token
  delete tokens[token];
  return fn(null, uid);
}

function saveRememberMeToken(token, uid, fn) {
  console.log('save remember me token');
  tokens[token] = uid;
  return fn();
}

function findById(id, fn) {
  console.log('find for id '+id);
  pool.connect((err, client, poolDone) => {
    if(err) {
      console.log(err);
    } else {
      let queryToExec='SELECT * FROM users where id=$1';
      client.query(queryToExec,[id], function(err, userD) {
        if(err) {
          shouldAbort(err, client, poolDone);
          fn(new Error('User ' + id + ' does not exist'));
        } else {
          poolDone();
          console.log('findById');
          console.log(userD.rows[0]);
          userD.rows[0].pages = userrole.setupPagePermissions(userD.rows[0],userD.rows[0]);
          fn(null, userD.rows[0]);
        }
      });
    }
  });
}

passport.use(new RememberMeStrategy(
  function(token, done) {
    console.log('inside remember me strategy')
    consumeRememberMeToken(token, function(err, uid) {
      if (err) { return done(err); }
      if (!uid) { return done(null, false); }
      console.log('uid '+uid);
      findById(uid, function(err, user) {
        if (err) { return done(err); }
        if (!user) { return done(null, false); }
        return done(null, user);
      });
    });
  },
  issueToken
));

function issueToken(user, done) {
  var token = randomString(64);
  saveRememberMeToken(token, user.id, function(err) {
    if (err) { return done(err); }
    return done(null, token);
  });
}
function randomString(len) {
  var buf = []
    , chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    , charlen = chars.length;

  for (var i = 0; i < len; ++i) {
    buf.push(chars[getRandomInt(0, charlen - 1)]);
  }

  return buf.join('');
};

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * OAuth Strategy Overview
 *
 * - User is already logged in.
 *   - Check if there is an existing account with a provider id.
 *     - If there is, return an error message. (Account merging not supported)
 *     - Else link new OAuth account with currently logged-in user.
 * - User is not logged in.
 *   - Check if it's a returning user.
 *     - If returning user, sign in and we are done.
 *     - Else check if there is an existing account with user's email.
 *       - If there is, return an error message.
 *       - Else create a new account.
 */

/**
 * Sign in with Facebook.
 */
/*passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_ID,
  clientSecret: process.env.FACEBOOK_SECRET,
  callbackURL: '/auth/facebook/callback',
  profileFields: ['name', 'email', 'link', 'locale', 'timezone', 'gender'],
  passReqToCallback: true
}, (req, accessToken, refreshToken, profile, done) => {
  if (req.user) {
    User.findOne({ facebook: profile.id }, (err, existingUser) => {
      if (err) { return done(err); }
      if (existingUser) {
        req.flash('errors', { msg: 'There is already a Facebook account that belongs to you. Sign in with that account or delete it, then link it with your current account.' });
        done(err);
      } else {
        User.findById(req.user.id, (err, user) => {
          if (err) { return done(err); }
          user.facebook = profile.id;
          user.tokens.push({ kind: 'facebook', accessToken });
          user.profile.name = user.profile.name || `${profile.name.givenName} ${profile.name.familyName}`;
          user.profile.gender = user.profile.gender || profile._json.gender;
          user.profile.picture = user.profile.picture || `https://graph.facebook.com/${profile.id}/picture?type=large`;
          user.save((err) => {
            req.flash('info', { msg: 'Facebook account has been linked.' });
            done(err, user);
          });
        });
      }
    });
  } else {
    User.findOne({ facebook: profile.id }, (err, existingUser) => {
      if (err) { return done(err); }
      if (existingUser) {
        return done(null, existingUser);
      }
      User.findOne({ email: profile._json.email }, (err, existingEmailUser) => {
        if (err) { return done(err); }
        if (existingEmailUser) {
          req.flash('errors', { msg: 'There is already an account using this email address. Sign in to that account and link it with Facebook manually from Account Settings.' });
          done(err);
        } else {
          const user = new User();
          user.email = profile._json.email;
          user.facebook = profile.id;
          user.tokens.push({ kind: 'facebook', accessToken });
          user.profile.name = `${profile.name.givenName} ${profile.name.familyName}`;
          user.profile.gender = profile._json.gender;
          user.profile.picture = `https://graph.facebook.com/${profile.id}/picture?type=large`;
          user.profile.location = (profile._json.location) ? profile._json.location.name : '';
          user.save((err) => {
            done(err, user);
          });
        }
      });
    });
  }
}));*/

/**
 * Sign in with GitHub.
 */
/*passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_ID,
  clientSecret: process.env.GITHUB_SECRET,
  callbackURL: '/auth/github/callback',
  passReqToCallback: true
}, (req, accessToken, refreshToken, profile, done) => {
  if (req.user) {
    User.findOne({ github: profile.id }, (err, existingUser) => {
      if (existingUser) {
        req.flash('errors', { msg: 'There is already a GitHub account that belongs to you. Sign in with that account or delete it, then link it with your current account.' });
        done(err);
      } else {
        User.findById(req.user.id, (err, user) => {
          if (err) { return done(err); }
          user.github = profile.id;
          user.tokens.push({ kind: 'github', accessToken });
          user.profile.name = user.profile.name || profile.displayName;
          user.profile.picture = user.profile.picture || profile._json.avatar_url;
          user.profile.location = user.profile.location || profile._json.location;
          user.profile.website = user.profile.website || profile._json.blog;
          user.save((err) => {
            req.flash('info', { msg: 'GitHub account has been linked.' });
            done(err, user);
          });
        });
      }
    });
  } else {
    User.findOne({ github: profile.id }, (err, existingUser) => {
      if (err) { return done(err); }
      if (existingUser) {
        return done(null, existingUser);
      }
      User.findOne({ email: profile._json.email }, (err, existingEmailUser) => {
        if (err) { return done(err); }
        if (existingEmailUser) {
          req.flash('errors', { msg: 'There is already an account using this email address. Sign in to that account and link it with GitHub manually from Account Settings.' });
          done(err);
        } else {
          const user = new User();
          user.email = profile._json.email;
          user.github = profile.id;
          user.tokens.push({ kind: 'github', accessToken });
          user.profile.name = profile.displayName;
          user.profile.picture = profile._json.avatar_url;
          user.profile.location = profile._json.location;
          user.profile.website = profile._json.blog;
          user.save((err) => {
            done(err, user);
          });
        }
      });
    });
  }
}));

// Sign in with Twitter.

passport.use(new TwitterStrategy({
  consumerKey: process.env.TWITTER_KEY,
  consumerSecret: process.env.TWITTER_SECRET,
  callbackURL: '/auth/twitter/callback',
  passReqToCallback: true
}, (req, accessToken, tokenSecret, profile, done) => {
  if (req.user) {
    User.findOne({ twitter: profile.id }, (err, existingUser) => {
      if (err) { return done(err); }
      if (existingUser) {
        req.flash('errors', { msg: 'There is already a Twitter account that belongs to you. Sign in with that account or delete it, then link it with your current account.' });
        done(err);
      } else {
        User.findById(req.user.id, (err, user) => {
          if (err) { return done(err); }
          user.twitter = profile.id;
          user.tokens.push({ kind: 'twitter', accessToken, tokenSecret });
          user.profile.name = user.profile.name || profile.displayName;
          user.profile.location = user.profile.location || profile._json.location;
          user.profile.picture = user.profile.picture || profile._json.profile_image_url_https;
          user.save((err) => {
            if (err) { return done(err); }
            req.flash('info', { msg: 'Twitter account has been linked.' });
            done(err, user);
          });
        });
      }
    });
  } else {
    User.findOne({ twitter: profile.id }, (err, existingUser) => {
      if (err) { return done(err); }
      if (existingUser) {
        return done(null, existingUser);
      }
      const user = new User();
      // Twitter will not provide an email address.  Period.
      // But a person’s twitter username is guaranteed to be unique
      // so we can "fake" a twitter email address as follows:
      user.email = `${profile.username}@twitter.com`;
      user.twitter = profile.id;
      user.tokens.push({ kind: 'twitter', accessToken, tokenSecret });
      user.profile.name = profile.displayName;
      user.profile.location = profile._json.location;
      user.profile.picture = profile._json.profile_image_url_https;
      user.save((err) => {
        done(err, user);
      });
    });
  }
}));

/**
 * Sign in with Google.
 */
/*passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_ID,
  clientSecret: process.env.GOOGLE_SECRET,
  callbackURL: '/auth/google/callback',
  passReqToCallback: true
}, (req, accessToken, refreshToken, profile, done) => {
  if (req.user) {
    User.findOne({ google: profile.id }, (err, existingUser) => {
      if (err) { return done(err); }
      if (existingUser) {
        req.flash('errors', { msg: 'There is already a Google account that belongs to you. Sign in with that account or delete it, then link it with your current account.' });
        done(err);
      } else {
        User.findById(req.user.id, (err, user) => {
          if (err) { return done(err); }
          user.google = profile.id;
          user.tokens.push({ kind: 'google', accessToken });
          user.profile.name = user.profile.name || profile.displayName;
          user.profile.gender = user.profile.gender || profile._json.gender;
          user.profile.picture = user.profile.picture || profile._json.image.url;
          user.save((err) => {
            req.flash('info', { msg: 'Google account has been linked.' });
            done(err, user);
          });
        });
      }
    });
  } else {
    User.findOne({ google: profile.id }, (err, existingUser) => {
      if (err) { return done(err); }
      if (existingUser) {
        return done(null, existingUser);
      }
      User.findOne({ email: profile.emails[0].value }, (err, existingEmailUser) => {
        if (err) { return done(err); }
        if (existingEmailUser) {
          req.flash('errors', { msg: 'There is already an account using this email address. Sign in to that account and link it with Google manually from Account Settings.' });
          done(err);
        } else {
          const user = new User();
          user.email = profile.emails[0].value;
          user.google = profile.id;
          user.tokens.push({ kind: 'google', accessToken });
          user.profile.name = profile.displayName;
          user.profile.gender = profile._json.gender;
          user.profile.picture = profile._json.image.url;
          user.save((err) => {
            done(err, user);
          });
        }
      });
    });
  }
}));

/**
 * Sign in with LinkedIn.
 */
/*passport.use(new LinkedInStrategy({
  clientID: process.env.LINKEDIN_ID,
  clientSecret: process.env.LINKEDIN_SECRET,
  callbackURL: process.env.LINKEDIN_CALLBACK_URL,
  scope: ['r_basicprofile', 'r_emailaddress'],
  passReqToCallback: true
}, (req, accessToken, refreshToken, profile, done) => {
  if (req.user) {
    User.findOne({ linkedin: profile.id }, (err, existingUser) => {
      if (err) { return done(err); }
      if (existingUser) {
        req.flash('errors', { msg: 'There is already a LinkedIn account that belongs to you. Sign in with that account or delete it, then link it with your current account.' });
        done(err);
      } else {
        User.findById(req.user.id, (err, user) => {
          if (err) { return done(err); }
          user.linkedin = profile.id;
          user.tokens.push({ kind: 'linkedin', accessToken });
          user.profile.name = user.profile.name || profile.displayName;
          user.profile.location = user.profile.location || profile._json.location.name;
          user.profile.picture = user.profile.picture || profile._json.pictureUrl;
          user.profile.website = user.profile.website || profile._json.publicProfileUrl;
          user.save((err) => {
            if (err) { return done(err); }
            req.flash('info', { msg: 'LinkedIn account has been linked.' });
            done(err, user);
          });
        });
      }
    });
  } else {
    User.findOne({ linkedin: profile.id }, (err, existingUser) => {
      if (err) { return done(err); }
      if (existingUser) {
        return done(null, existingUser);
      }
      User.findOne({ email: profile._json.emailAddress }, (err, existingEmailUser) => {
        if (err) { return done(err); }
        if (existingEmailUser) {
          req.flash('errors', { msg: 'There is already an account using this email address. Sign in to that account and link it with LinkedIn manually from Account Settings.' });
          done(err);
        } else {
          const user = new User();
          user.linkedin = profile.id;
          user.tokens.push({ kind: 'linkedin', accessToken });
          user.email = profile._json.emailAddress;
          user.profile.name = profile.displayName;
          user.profile.location = profile._json.location.name;
          user.profile.picture = profile._json.pictureUrl;
          user.profile.website = profile._json.publicProfileUrl;
          user.save((err) => {
            done(err, user);
          });
        }
      });
    });
  }
}));

/**
 * Sign in with Instagram.
 */
/*passport.use(new InstagramStrategy({
  clientID: process.env.INSTAGRAM_ID,
  clientSecret: process.env.INSTAGRAM_SECRET,
  callbackURL: '/auth/instagram/callback',
  passReqToCallback: true
}, (req, accessToken, refreshToken, profile, done) => {
  if (req.user) {
    User.findOne({ instagram: profile.id }, (err, existingUser) => {
      if (err) { return done(err); }
      if (existingUser) {
        req.flash('errors', { msg: 'There is already an Instagram account that belongs to you. Sign in with that account or delete it, then link it with your current account.' });
        done(err);
      } else {
        User.findById(req.user.id, (err, user) => {
          if (err) { return done(err); }
          user.instagram = profile.id;
          user.tokens.push({ kind: 'instagram', accessToken });
          user.profile.name = user.profile.name || profile.displayName;
          user.profile.picture = user.profile.picture || profile._json.data.profile_picture;
          user.profile.website = user.profile.website || profile._json.data.website;
          user.save((err) => {
            req.flash('info', { msg: 'Instagram account has been linked.' });
            done(err, user);
          });
        });
      }
    });
  } else {
    User.findOne({ instagram: profile.id }, (err, existingUser) => {
      if (err) { return done(err); }
      if (existingUser) {
        return done(null, existingUser);
      }
      const user = new User();
      user.instagram = profile.id;
      user.tokens.push({ kind: 'instagram', accessToken });
      user.profile.name = profile.displayName;
      // Similar to Twitter API, assigns a temporary e-mail address
      // to get on with the registration process. It can be changed later
      // to a valid e-mail address in Profile Management.
      user.email = `${profile.username}@instagram.com`;
      user.profile.website = profile._json.data.website;
      user.profile.picture = profile._json.data.profile_picture;
      user.save((err) => {
        done(err, user);
      });
    });
  }
}));

/**
 * Tumblr API OAuth.
 */
/*passport.use('tumblr', new OAuthStrategy({
  requestTokenURL: 'https://www.tumblr.com/oauth/request_token',
  accessTokenURL: 'https://www.tumblr.com/oauth/access_token',
  userAuthorizationURL: 'https://www.tumblr.com/oauth/authorize',
  consumerKey: process.env.TUMBLR_KEY,
  consumerSecret: process.env.TUMBLR_SECRET,
  callbackURL: '/auth/tumblr/callback',
  passReqToCallback: true
},
(req, token, tokenSecret, profile, done) => {
  User.findById(req.user._id, (err, user) => {
    if (err) { return done(err); }
    user.tokens.push({ kind: 'tumblr', accessToken: token, tokenSecret });
    user.save((err) => {
      done(err, user);
    });
  });
}));

/**
 * Foursquare API OAuth.
 */
/*passport.use('foursquare', new OAuth2Strategy({
  authorizationURL: 'https://foursquare.com/oauth2/authorize',
  tokenURL: 'https://foursquare.com/oauth2/access_token',
  clientID: process.env.FOURSQUARE_ID,
  clientSecret: process.env.FOURSQUARE_SECRET,
  callbackURL: process.env.FOURSQUARE_REDIRECT_URL,
  passReqToCallback: true
},
(req, accessToken, refreshToken, profile, done) => {
  User.findById(req.user._id, (err, user) => {
    if (err) { return done(err); }
    user.tokens.push({ kind: 'foursquare', accessToken });
    user.save((err) => {
      done(err, user);
    });
  });
}));

/**
 * Steam API OpenID.
 */
/*passport.use(new OpenIDStrategy({
  apiKey: process.env.STEAM_KEY,
  providerURL: 'http://steamcommunity.com/openid',
  returnURL: `${process.env.BASE_URL}/auth/steam/callback`,
  realm: `${process.env.BASE_URL}/`,
  stateless: true,
  passReqToCallback: true,
}, (req, identifier, done) => {
  const steamId = identifier.match(/\d+$/)[0];
  const profileURL = `http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${process.env.STEAM_KEY}&steamids=${steamId}`;

  if (req.user) {
    User.findOne({ steam: steamId }, (err, existingUser) => {
      if (err) { return done(err); }
      if (existingUser) {
        req.flash('errors', { msg: 'There is already an account associated with the SteamID. Sign in with that account or delete it, then link it with your current account.' });
        done(err);
      } else {
        User.findById(req.user.id, (err, user) => {
          if (err) { return done(err); }
          user.steam = steamId;
          user.tokens.push({ kind: 'steam', accessToken: steamId });
          request(profileURL, (error, response, body) => {
            if (!error && response.statusCode === 200) {
              const data = JSON.parse(body);
              const profile = data.response.players[0];
              user.profile.name = user.profile.name || profile.personaname;
              user.profile.picture = user.profile.picture || profile.avatarmedium;
              user.save((err) => {
                done(err, user);
              });
            } else {
              user.save((err) => { done(err, user); });
              done(error, null);
            }
          });
        });
      }
    });
  } else {
    request(profileURL, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        const data = JSON.parse(body);
        const profile = data.response.players[0];

        const user = new User();
        user.steam = steamId;
        user.email = `${steamId}@steam.com`; // steam does not disclose emails, prevent duplicate keys
        user.tokens.push({ kind: 'steam', accessToken: steamId });
        user.profile.name = profile.personaname;
        user.profile.picture = profile.avatarmedium;
        user.save((err) => {
          done(err, user);
        });
      } else {
        done(error, null);
      }
    });
  }
}));

/**
 * Pinterest API OAuth.
 */
/*passport.use('pinterest', new OAuth2Strategy({
  authorizationURL: 'https://api.pinterest.com/oauth/',
  tokenURL: 'https://api.pinterest.com/v1/oauth/token',
  clientID: process.env.PINTEREST_ID,
  clientSecret: process.env.PINTEREST_SECRET,
  callbackURL: process.env.PINTEREST_REDIRECT_URL,
  passReqToCallback: true
},
(req, accessToken, refreshToken, profile, done) => {
  User.findById(req.user._id, (err, user) => {
    if (err) { return done(err); }
    user.tokens.push({ kind: 'pinterest', accessToken });
    user.save((err) => {
      done(err, user);
    });
  });
}));
*/
/**
 * Login Required middleware.
 */
exports.isAuthenticated = (req, res, next) => {
  // console.log('in authentication request user id is ');
  // console.log(req.user);
  if (!req.isAuthenticated()) {
    res.redirect('/domain');
  }else{

    // console.log('------------inputUser------------');
    // console.log(inputUser);

    // let matchUser=inputUser.find(inpUser=>{
    //   return inpUser.userid==req.user.id;
    // })

    // console.log('matchUser');
    // console.log(matchUser);
    // if(matchUser!=undefined){
    //
        pool.connect((err, client, done) => {
          console.log('company id inside isauthenticated');
          console.log(req.user.company_id);
          client.query("select * from company INNER JOIN (SELECT company_id,stripe_customer_id,stripe_subscription_id,quickbook_enabled,xero_enabled FROM setting) setting ON company.id = setting.company_id AND company.id=$1 AND company.archived=$2", [req.user.company_id,false], function(err, company) {
            if (err) {
              handleResponse.shouldAbort(err, client, done);
              // handleResponse.handleError(res, err, ' Error in finding company data');
              res.redirect('/domain');
            }else{
                  client.query("SELECT * FROM users where id=$1 and archived=$2 and add_status IN ('Joined','Approved')", [req.user.id,false], function (err, existingUser) {
                  if (err) {
                    handleResponse.shouldAbort(err, client, done);
                    // handleResponse.handleError(res, err, ' Error in finding user data');
                    res.redirect('/domain');
                  } else {
                      // console.log('------existingUser.rows[0]--------');
                      // console.log(existingUser.rows[0]);
                      if(existingUser.rowCount>0){

                        var userData=existingUser.rows[0];
                        userData.company = company.rows[0].name;
                        userData.company_id = company.rows[0].id;
                        userData.company_info=company.rows[0];
                        req.login(userData, function(err) {
                          if (err) {
                            try {
                              res.clearCookie('remember_me');
                              req.logout();
                              req.session.destroy((error) => {
                                if (error) {
                                  // console.log('Error : Failed to destroy the session during logout.', err);
                                  // handleResponse.handleError(res, error, ' Failed to destroy the session during logout.');
                                  res.redirect('/domain');
                                }else{
                                  req.user = null;

                                  // handleResponse.handleError(res, err, ' Error in user logout before logging in another user.');
                                  res.redirect('/domain');

                                }
                              });
                            } catch (err) {
                              console.debug("--------3333-" + err);

                              // handleResponse.handleError(res, err, ' Error in user logout');
                              res.redirect('/domain');
                            }
                          }else{
                            userData.domain = company.rows[0].domain;
                            // console.log('inside relogin after update user is ' + JSON.stringify(userData));
                            var pages = userrole.setupPagePermissions(userData, req.user);
                            // console.log("userData========================= ");
                            userData.pages = pages;
                            // console.log(userData);
                            done();
                            // inputUser=inputUser.filter(inpUser=>{
                            //   return inpUser.userid!=req.user.id;
                            // })
                            // req.user=userData;

                            // console.log('--------req.user----------');
                            // console.log(req.user);
                            return next();
                          }
                        })
                      }else{
                        done();
                        // handleResponse.handleError(res, ' Error in finding user data', ' Error in finding user data');
                        try {
                          res.clearCookie('remember_me');
                          req.logout();
                          req.session.destroy((error) => {
                            if (error) {
                              // console.log('Error : Failed to destroy the session during logout.', err);
                              // handleResponse.handleError(res, error, ' Failed to destroy the session during logout.');
                              res.redirect('/domain');
                            }else{
                              req.user = null;

                              // handleResponse.handleError(res, err, ' Error in user logout before logging in another user.');
                              res.redirect('/domain');

                            }
                          });
                        } catch (err) {
                          console.debug("--------3333-" + err);

                          // handleResponse.handleError(res, err, ' Error in user logout');
                          res.redirect('/domain');
                        }
                      }
                  }
               })
             }
           })
          })
    // }else{
    //     return next();
    // }

  }
};

/**
 * Authorization Required middleware.
 */
exports.isAuthorized = (req, res, next) => {
  const provider = req.path.split('/').slice(-1)[0];
  const token = req.user.tokens.find(token => token.kind === provider);
  if (token) {
    next();
  } else {
    res.redirect(`/auth/${provider}`);
  }
};
