var passport = require('passport');
var passport = require('passport');
var FacebookTokenStrategy = require('passport-facebook-token');
var userController= require('./../controllers/userController')
const passportConfig = require('./../../config/passportConfig')
module.exports = function () {

    passport.use(new FacebookTokenStrategy({
        clientID: passportConfig.client_id,
        clientSecret: passportConfig.client_secret
      },
      function (accessToken, refreshToken, profile, done) {
        userController.getLLTandUpsertUser(accessToken, refreshToken, profile, function(err, user) {
          if(user)
          return done(err, user);
        });
      }));
  
  };