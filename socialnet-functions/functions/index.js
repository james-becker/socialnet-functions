const functions = require('firebase-functions');

const app = require('express')(); // Call it on the same line

const FBAuth = require('./util/FBAuth')

const { getAllScreams, postOneScream } = require('./handlers/screams')
const { signUp, login } = require('./handlers/users')

// Scream routes
app.get('/screams', getAllScreams)
app.post('/scream', FBAuth, postOneScream)

// Signup route
app.post('/signup', signUp)
app.post('/login', login)

// Best practice for API is if we have an endpoint https://baseurl.com/screams.
// We should have a subroute for API, such as /api/. Or a subdomain, such as api.baseurl.

exports.api = functions.https.onRequest(app);




