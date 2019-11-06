const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const express = require('express');
const app = express();

app.get('/screams', (req, res) => {
  admin
    .firestore()
    .collection('screams')
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
    // createdAt: admin.firestore.Timestamp.fromDate(new Date())
    createdAt: new Date().toISOString()
  };

  admin
    .firestore()
    .collection('screams')
    .add(newScream)
    .then((doc) => {
      res.json({ message: `Document ${doc.id} created successfully.` })
    })
    .catch((err) => {
      res.status(500).json({ error: err });
      console.error(err);
    })
})