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

exports.validateSignUpData = (newUser) => {
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

  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false
  }
}

exports.validateLoginData = (user) => {
  let errors = {}

  if (isEmpty(user.email)) errors.email = 'Must not be empty'
  if (isEmpty(user.password)) errors.password = 'Must not be empty'
  if (Object.keys(errors).length > 0) return res.status(400).json(errors);

  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false
  }
}

