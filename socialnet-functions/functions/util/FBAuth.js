const { admin, db } = require('./admin')


// MIDDLEWARE
// A typical Middleware function demonstrating the architecture of req, res, next.
module.exports = (req, res, next) => {
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