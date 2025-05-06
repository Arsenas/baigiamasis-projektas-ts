// Reusable validation functions
const username = (value) => {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(value);
};

const password = (value) => {
  const lengthOk = value.length >= 4 && value.length <= 20;
  const uppercase = /[A-Z]/.test(value);
  const specialChar = /[!@#$%^&*_+]/.test(value);
  return lengthOk && uppercase && specialChar;
};

// Express middleware
const registerUserValidate = (req, res, next) => {
  const { username: u, password: p } = req.body;
  if (!username(u)) {
    return res.status(400).json({ error: true, message: "Invalid username" });
  }
  if (!password(p)) {
    return res.status(400).json({ error: true, message: "Invalid password" });
  }
  next();
};

const loginUserValidate = (req, res, next) => {
  const { username: u, password: p } = req.body;
  if (!u || !p) {
    return res.status(400).json({ error: true, message: "Missing fields" });
  }
  next();
};

const validateUser = (req, res, next) => {
  // Placeholder logic
  next();
};

const imageValidate = (req, res, next) => {
  // You could check for image type/format here
  next();
};

const usernameValidate = (req, res, next) => {
  if (!username(req.body.username)) {
    return res.status(400).json({ error: true, message: "Invalid username" });
  }
  next();
};

const messageValidate = (req, res, next) => {
  if (!req.body.message || req.body.message.length < 1) {
    return res.status(400).json({ error: true, message: "Message required" });
  }
  next();
};

module.exports = {
  username,
  password,
  registerUserValidate,
  loginUserValidate,
  validateUser,
  imageValidate,
  usernameValidate,
  messageValidate,
};
