const express = require('express')
const router = express.Router()
const userController = require('./user.controller')
const userSignInUp = require('./user.sign_in-up')
const userOTP= require('./user.verifyOTP')
const {validateFirebaseToken} = require('./authMiddleware/Validate.auth.Middleware')
const {validateGoogleToken}= require('./authMiddleware/Google.auth.Middleware');
router.get('/', userController.getUsers)
// router.post('/signup', userSignInUp.signUp) // route to handle user sign up client
router.post('/login', validateFirebaseToken, userSignInUp.login) // route to handle user login client
router.post('/google-signin', validateGoogleToken);   // route to handle google sign in from the client
router.post('/VerifyOTP', userOTP.verifyOTP)// route to verify the OTP sent to the client
router.post('/resend', userSignInUp.resend)// resend otp for current user
module.exports = router