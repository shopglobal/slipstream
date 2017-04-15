import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import bcrypt from 'bcrypt-nodejs'
import fs from 'fs'
import path from 'path'

import getUser from '../helpers/get-user'
import User from '../models/userModel'

const { SECRET_TOKEN } = process.env

//
// check the username and password and returns token if verified
//
exports.login = function ( req, res ) {
  User.findOne( { username: req.body.username } )
  .exec()
  .then( function ( user ) {
    if ( !user ) {
      console.log( { username: req.body.username }, "Error logging in." )
      return res.status( 403 ).json( "Error logging in with those credentials." )
    }

    user.verifyPassword( req.body.password, function( err, isMatch ) {
      if ( err || !isMatch ) {
        return res.status( 403 ).json( "Trouble signing in." )
      }

      return res.status( 200 )
      .json({
        token: user.token(),
        username: user.username,
        role: user.role
      })
    })
  }, function ( error ) {
    console.log( error )
    return res.status( 500 ).send( error.message )
  })
}

/*
ENDPOINT: /api/signup

METHOD: POST

DESCRIPTION: Accepts email, password, username and beta-key
*/
exports.signUp = function ( req, res ) {
  var user = new User({
    username: req.body.username,
    password: req.body.password,
    email: req.body.email
  })

  function postSignup ( object ) {
    return new Promise( function ( resolve, reject ) {
      var user = object.user

      user.save( function ( err, newUser ) {
        return resolve( newUser )
      })
    })
  }

  /*
  Check if the username or email has already been used before. 
  */
  User.findOne( { $or: [ { username: user.username }, { email: user.email } ] } )
  .then( function ( result ) {
    if ( !result ) {
      user.save()
      .then( function () {
        postSignup( { user: user } )
        .then( function ( user ) {
          return res.status( 200 ).json({
            token: user.token(),
            username: user.username,
            role: user.role
          })
        })
      } )
      .catch ( function ( error ) {
        console.log( error )
        return res.status( 500 ).json( error.message )
      })
    } else if ( ( !result.username || result.username == null || typeof result.username == undefined) && result ) {
      result.username = user.username
      result.email = user.email
      result.joined = ( new Date() / 1000 ).toFixed()

      result.save()
      .then( function ( result ) {
        postSignup( { user: result } )
        .then( function ( user ) {
          return res.status( 200 ).json({
            token: user.token(),
            username: user.username,
            role: user.role
          })
        })
      } )
      .catch ( function ( error ) {
        console.log( error )
        return res.status( 500 ).json( error.message )
      })
    } else {
      console.log( "User signed up with that info:" + user.username + " or " + user.email )

      if ( result.username === user.username ) return res.status( 500 ).json( "That username is already taken." )
      else return res.status( 500 ).json( "That email has already been used." )
    }
  }, function ( error ) {
    console.error( error )

    return res.status( 500 ).json( error.message )
  })
}

//
// return all of a users information, except password, etc
//
exports.getUser = function( req, res ) {
  const { user } = req

  return res.status( 200 ).json({
    id: user._id,
    username: user.username,
    email: user.email,
    joined: user.joined,
    role: user.role
  })
}

//
// delete a user
//
exports.deleteUser = function( req, res ) {
  User.findOneAndRemove( { token: req.token } ).exec()
  .then( function () {
    return res.status( 200 ).json( "User removed. Bye." )
  }, function ( error ) {
    console.log( error )
    return res.status( 500 ).json( error )
  })
}

//
// check that the request has an authorization header and attach it to
// the req as req.token
//
exports.checkAuthorization = function( req, res, next ) {
  const {authorization} = req.headers

  if (!authorization || !authorization.includes(' ')) {
    return res.status( 500 ).send( "Token authorization failed. 1" )
  }

  const authToken = authorization.split(' ')[1]

  const object = jwt.verify(authToken, SECRET_TOKEN)

  User.findOne({ _id: object._id })
  .then(user => {
    if (!user) {
      return res.status( 500 ).send( "Token authorization failed. 2" )
    }

    if (user.role !== 'ADMIN') {
      return res.status(403).send("You don't have permission to do that.")
    }

    req.user = user
    return next()
  })
}

/*
This function updates a users password and emails it to them.

TODO: Makes this send a password update link with temporary password as it's own field in the user model. Also, it generates the password before even checking if the email matches a user, which is not efficient. Add a check first.
*/
exports.sendPasswordReset = function ( req, res ) {
  
  function updateUser ( password ) {
    return new Promise( function ( resolve, reject ) {
      User.findOneAndUpdate( 
        { email: req.query.email },
        { tempPassword: password.encryptedPassword } 
      ).exec()
      .then( function ( user ) {
        if ( !user )
          reject( new Error( "We couldn't find a user for that email address: " + req.query.email ) )

        var updatedUser = {
          email: user.email,
          username: user.username,
          temporaryPassword: password.temporaryPassword
        }

        resolve( updatedUser )
      }, function ( error ) {
        reject( new Error( "Error looking up user for password reest" ) )
      })
    })
  }
  
  function emailTemporaryPassword ( user ) {
    return new Promise( function ( resolve ) {
      
      var passwordHtml = fs.readFileSync( path.join( __dirname, "../lib/emails/password-reset.html" ) ).toString().split( '<!-- Breakpoint -->' )

      var email = {
        from: 'Slipstream <hello@slipstreamapp.com>',
        to: user.email,
        subject: 'Your temporary Slipstream password',
        html: passwordHtml[0] + user.temporaryPassword + passwordHtml[1]
      }

      resolve(user)
    })
  }
  
  function createPassword () {  
    return new Promise( function ( resolve, reject ) {
      
      var password = {}
      
      password.temporaryPassword = crypto.randomBytes(8).toString( 'hex' )
      
      bcrypt.genSalt( 5, function( err, salt ) {
        if (err)
          reject( new Error( "Could not generate temporary password salt." ) )

        bcrypt.hash( password.temporaryPassword, salt, null, function( err, hash ) {
          if (err)
            reject( new Error( "Could not hash new temporary password." ) )

          password.encryptedPassword = hash
            
          resolve( password )
        })
      })
    })
  }
  
  createPassword()
  .then( updateUser )
  .then( emailTemporaryPassword )
  .then( function ( body ) {
    return res.status( 200 ).send( "A reset email was sent." )
  }, function ( error ) {
    console.log( error, "Password reset error" )
    return res.status( 500 ).send( error.message )
  })
  
}

/*
ENDPOINT: /api/user/password/change

ACCEPTS: oldPassword and newPassword

DESCRIPTION: Confirms a users old password and sets a new password.
*/
exports.changePassword = function ( req, res ) {
  
  function verifyOldPassword ( user ) {
    return new Promise( function ( resolve, reject ) {
      user.verifyPassword( req.body.oldPassword, function( err, isMatch ) {
        if ( err || !isMatch )
          return res.status( 403 ).send( { message: "Please verify your old password." } )

        else 
          resolve( user )
      } )
    })
  }
  
  function generatePassword ( user ) {
    var userObj = {
      id: user._id
    }
    
    return new Promise( function ( resolve, reject ) {  
      bcrypt.genSalt( 5, function( err, salt ) {
        if (err)
          reject( new Error( "Could not generate temporary password salt." ) )

        bcrypt.hash( req.body.newPassword, salt, null, function( err, hash ) {
          if (err)
            return reject( new Error( "Could not hash new temporary password." ) )

          userObj.password = hash

          resolve( userObj )
        })
      })
    })
  }
  
  function savePassword ( user ) {
    return new Promise( function ( resolve, reject ) {  
      User.findOneAndUpdate( 
        { _id: user.id },
        { password: user.password } 
      ).exec()
      .then( function ( user ) {
        if ( !user )
          reject( new Error( "Could not save the new password." ) )
        
        resolve ( user )
      }, function ( error ) {
        reject( new Error( "Could not save the new password." ) ) 
      })
    })
  } 
  
  getUser( req.token )
  .then( verifyOldPassword )
  .then( generatePassword )
  .then( savePassword )
  .then( function ( user ) {
    return res.json( "Your password was changed." )
  }, function ( error ) {
    console.log( error )
    return res.status( 500 ).json( error.message )
  })
}

function checkAdmin ( object ) {
  return new Promise( function ( resolve, reject ) {
    User.findOne( { token: object.token, role: 'admin' } )
    .then( function ( user ) {
      if ( !user ) return reject( new Error ( { message: "Permissions don't appear to allow that." } ) )
      
      resolve( user )
    })
    .catch( function ( error ) {
      return reject( error )
    })
  })
}

exports.exportEmails = function ( req, res ) {
  checkAdmin( { token: req.token } )
  .then( function ( admin ) {
    
    /*Find the type of email list to get based on the optional query parameter 'type'.*/
    
    if ( !req.query.type ) {
      var query = { username: { $exists: true } }
    } else if ( req.query.type == 'unregistered' ) {
      var query = { username: { $exists: false }, waiting: false }
    } else {
      throw new Error( "That is not a valid type of list to send." )
    }   
    
    User.find( query )
    .select( 'email' )
    .exec()
    .then( function ( results ) {
      var emails = ""
      
      var map = results.map( function ( user ) {
        return emails += user.email + ", " 
      })
      
      return  res.status( 200)
          .set({"Content-Disposition":'attachment; filename="user-emails-' + new Date() + '.txt"'})
          .send( emails )
      
    }, function ( error ) {
      console.log( error )
      return res.status( 500 ).json( error.message )
    })
  })
  .catch( function( error ) {
    console.log( error )
    return res.status( 500 ).json( error.message )
  })
}
