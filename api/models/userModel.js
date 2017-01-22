import mongoose, { Schema } from 'mongoose'
import bcrypt from 'bcrypt-nodejs'
import jwt from 'jsonwebtoken'

var UserSchema = new Schema({
  username: {
    type: String,
    sparse: true,
    unique: true
  },
  password: String,
  tempPassword: String,
  email: {
    type: String,
    required: true,
    unique: true
  },
  joined: {
    type: Number,
    default: ( new Date() / 1000 ).toFixed()
  },
  role: String,
  permissions: Array,
  waiting: Boolean
})

UserSchema.index( { username: 'text', sparse: true } )

//
// hashes the password so it's not plain text
//
UserSchema.pre( 'save', function(callback) {
  var user = this

  if (!user.isModified('password'))
    return callback()

  bcrypt.genSalt(5, function( error, salt ) {
    if (error)
      return callback(error)

    bcrypt.hash( user.password, salt, null, function( err, hash ) {
      if (err)
        return callback(err)

      user.password = hash
      callback()
    })
  })
})

/*
 adds verifyPassword method to user schema
*/
UserSchema.methods.verifyPassword = function( password, callback ) {
  var origPassword = this.password ? this.password : ''
  var tempPassword = this.tempPassword ? this.tempPassword : ''

  bcrypt.compare( password, origPassword, function( error, match ) {
    if ( error || !match ) {
      bcrypt.compare( password, tempPassword, function ( err, isMatch ) {
        if ( err ) return callback( err )

        return callback( null, isMatch )
      })
    } else if ( match ) {
      return callback( null, match )
    }
  })
}

UserSchema.methods.validPassword = function( password ) {
  return bcrypt.compare( password, this.password )
}

UserSchema.methods.token = function () {
  return jwt.sign({ _id: this._id }, process.env.SECRET_TOKEN)
}

module.exports = mongoose.model( 'User', UserSchema )
