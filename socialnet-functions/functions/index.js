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

app.post('/scream', (req, res) => {
  if (req.method !== 'POST') {
    return res.status(400).json({error: 'Method not allowed.'})
  }
  const newScream = {
    body: req.body.body,
    userHandle: req.body.userHandle,
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

// Signup route
app.post('/signup', (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle,
  }

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









