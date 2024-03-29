"use strict";
/**
 * Created by Navit.
 */
var Config = require("../config");
var Jwt = require("jsonwebtoken");
var async = require("async");
var Services = require("../services");

var getTokenFromDB = async function(userId, userType, token) {
  var criteria = {
    _id: userId,
    accessToken: token
  };
  switch (userType) {
    case Config.APP_CONSTANTS.DATABASE.USER_ROLES.USER:
      const result = await Services.UserService.getUserPromise(
        criteria,
        {},
        {}
      );
      if (result && result.length > 0) {
        result[0].type = userType;
        return result[0];
      } else {
        return Config.APP_CONSTANTS.STATUS_MSG.ERROR.INVALID_TOKEN;
      }
    default:
      return Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR;
  }
};

var setTokenInDB = function(userId, userType, tokenToSave, callback) {
  console.log("login_type::::::::", userType);
  var criteria = {
    _id: userId
  };
  var setQuery = {
    accessToken: tokenToSave
  };
  async.series(
    [
      function(cb) {
        switch (userType) {
          case Config.APP_CONSTANTS.DATABASE.USER_ROLES.USER:
            Services.UserService.updateUser(
              criteria,
              setQuery,
              { new: true },
              function(err, dataAry) {
                if (err) {
                  cb(err);
                } else {
                  if (dataAry && dataAry._id) {
                    cb();
                  } else {
                    cb(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR);
                  }
                }
              }
            );
            break;
          default:
            cb(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR);
        }
      }
    ],
    function(err, result) {
      if (err) {
        callback(err);
      } else {
        callback();
      }
    }
  );
};

var setToken = function(tokenData, callback) {
  if (!tokenData.id || !tokenData.type) {
    callback(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR);
  } else {
    var tokenToSend = Jwt.sign(
      tokenData,
      process.env.JWT_SECRET_KEY
    );
    setTokenInDB(tokenData.id, tokenData.type, tokenToSend, function(
      err,
      data
    ) {
      console.log("token>>>>", err, data);
      callback(err, { accessToken: tokenToSend });
    });
  }
};

var verifyToken = async function(token) {
  try {
    const decodedData = await Jwt.verify(token, process.env.JWT_SECRET_KEY);
    const result = await getTokenFromDB(
      decodedData.id,
      decodedData.type,
      token
    );
    if(result && result._id) return { userData: result };
    else throw result
  } catch (err) {
    return err;
  }
};

var decodeToken = async function(token) {
  try {
    const decodedData = await Jwt.verify(token, process.env.JWT_SECRET_KEY);
    return { userData: decodedData, token: token };
  } catch (err) {
    return err;
  }
};

module.exports = {
  decodeToken: decodeToken,
  verifyToken: verifyToken,
  setToken:setToken
};
