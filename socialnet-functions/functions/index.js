const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const app = require('express')(); // Call it on the same line

const firebaseConfig = {
  apiKey: "AIzaSyA-n2WOuSaEoj2PEseTSZO0_2sFMAtisrw",
  authDomain: "loyal-acre-258201.firebaseapp.com",
  databaseURL: "https://loyal-acre-258201.firebaseio.com",
  projectId: "loyal-acre-258201",
  storageBucket: "loyal-acre-258201.appspot.com",
  messagingSenderId: "954396928955",
  appId: "1:954396928955:web:81b92b8def28c1ed58b29e",
  measurementId: "G-L9F9VGMPCS"
};

const firebase = require('firebase');
firebase.initializeApp(firebaseConfig);

const db = admin.firestore()

app.get('/screams', (req, res) => {
  db.collection('screams')
    .orderBy('createdAt', 'desc')
    .get()
    .then((data) => {
      let screams = [];
      data.forEach((doc) => {
        screams.push({
          screamId: doc.id,
          body: doc.data().body,
          userHandle: doc.data().userHandle,
          createdAt: doc.data().createdAt
        });
      });
      return res.json(screams);
    })
    .catch((err) => console.error(err));
})

// Best practice for API is if we have an endpoint https://baseurl.com/screams.
// We should have a subroute for API, such as /api/. Or a subdomain, such as api.baseurl.

exports.api = functions.https.onRequest(app);

// MIDDLEWARE
// A typical Middleware function demonstrating the architecture of req, res, next.
const FBAuth = (req, res, next) => {
  let idToken;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    idToken = req.headers.authorization.split('Bearer ')[1]
  } else {
    console.error('No token found')
    return res.status(403).json({ error: 'Unauthorized.' })
  }

  // Now we need to make sure the token was issued by our app and not created somewhere else
  admin.auth().verifyIdToken(idToken)
  .then(decodedToken => {
    req.user = decodedToken;
    console.log(decodedToken)
    return db.collection('users')
      .where('userId', '==', req.user.uid)
      .limit(1)
      .get()
  })
  .then(data => {
    // user firebase api function data() to get the handle
    req.user.handle = data.docs[0].data().handle
    return next();
  })
  .catch(err => {
    console.error('Error while verifying token', err)
    return res.status(403).json(err); // Not like others, but oh well.
  })
}

// Post one scream
app.post('/scream', FBAuth, (req, res) => {
  if (req.method !== 'POST') {
    return res.status(400).json({error: 'Method not allowed.'})
  }
  const newScream = {
    body: req.body.body,
    userHandle: req.user.handle,
    // createdAt: db.Timestamp.fromDate(new Date())
    createdAt: new Date().toISOString()
  };

  db.collection('screams')
    .add(newScream)
    .then((doc) => {
      res.json({ message: `Document ${doc.id} created successfully.` })
    })
    .catch((err) => {
      res.status(500).json({ error: err });
      console.error(err );
    })
})

const isEmail = (email) => {
  const regEx = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
  if (email.match(regEx)) {
    return true;
  } else {
    return false;
  }
}

const isEmpty = (string) => {
  if (string.trim() === '') return true;
  else return false;
}

// Signup route
app.post('/signup', (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle,
  }

  let errors = {};

  // VALIDATION
  if (isEmpty(newUser.email)) {
    errors.email = 'Email must not be empty.'
  } else if (!isEmail(newUser.email)) {
    errors.email = 'Must be a valid email address.'
  }

  // We don't need to validate for the PRESENCE of certain keys in the JSON,
  // since we're the only ones who will be consuming our own API endpoint, and
  // we can handle all of that in the React.

  if (isEmpty(newUser.password)) errors.password = 'Must not be empty.' // Shorthand `is then` syntax
  if (newUser.password !== newUser.confirmPassword) errors.confirmPassword = 'Passwords must match.'
  if (isEmpty(newUser.handle)) errors.handle = 'Must not be empty.' // Shorthand `is then` syntax

  if (Object.keys(errors).length > 0) return res.status(400).json(errors)

  // Checking to see if the handle exists already
  let token, userId;
  db.doc(`/users/${newUser.handle}`).get()
    .then(doc => {
      if (doc.exists) {
        return res.status(400).json({
          handle: 'this handle is already taken'
        });
      } else {
        // Need to return since we're inside a then.
        return firebase.auth().createUserWithEmailAndPassword(newUser.email, newUser.password);
      }
    })
    .then (data => {
      userId = data.user.uid;
      return data.user.getIdToken();
    })
    .then (idToken => { // We're processing the token returned by the prior then()
      token = idToken;
      // Here we're creating the userCredentials by integrating the original
      // newUser data we created with the userId returned by Firebase)
      const userCredentials = {
        handle: newUser.handle,
        email: newUser.email,
        createdAt: new Date().toISOString(),
        userId // This is shorthand for userId: userId
      };
      // We're basically providing the userCredentials to the user record in our user table
      // (NOT the Firebase Authentication table, which manages users sort of like Rails Devise)
      return db.doc(`/users/${newUser.handle}`).set(userCredentials); // Don't forget to return, since it's in a Promise
    })
    .then ((data) => {
      return res.status(201).json({ token });
    })
    // Put our .catch()es all at the very end
    .catch (err => {
      if (err.code === 'auth/email-already-in-use') {
        return res.status(400).json({email: 'Email is already in use'})
      } else {
        return res.status(500).json({error: err.code})
      }
    })
})

app.post('/login', (req, res) => {
  const user = {
    email: req.body.email,
    password: req.body.password
  }

  let errors = {}

  if (isEmpty(user.email)) errors.email = 'Must not be empty'
  if (isEmpty(user.password)) errors.password = 'Must not be empty'
  if (Object.keys(errors).length > 0) return res.status(400).json(errors);

  firebase.auth().signInWithEmailAndPassword(user.email, user.password)
  .then(data => {
    return data.user.getIdToken()
  })
  .then(token => {
    return res.json({token})
  })
  .catch(err => {
    if (err.code === 'auth/wrong-password') {
      return res.status(403).json({ general: 'Wrong credentials. Please try again.'})
    } else {
      return res.status(500).json({error: err.code})
    }
  })
})








