const { db } = require('../util/admin')

exports.getAllScreams = (req, res) => {
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
}

exports.postOneScream = (req, res) => {
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
}