const { db } = require('../util/admin')
const { validateSignUpData } = require('../util/validators')
const config = require('../util/config')

const firebase = require('firebase')
firebase.initializeApp(config)

exports.signUp = (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle,
  }

  // Validate the data
  const { valid, errors } = validateSignUpData(newUser)
  if (!valid) return res.status(400).json(errors);

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
}

exports.login = (req, res) => {
  const user = {
    email: req.body.email,
    password: req.body.password
  }

  // Validate the data
  const { valid, errors } = validateLoginData(user)
  if (!valid) return res.status(400).json(errors);

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
}