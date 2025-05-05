module.exports = {
  username: (value) => {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(value);
  },

  password: (value) => {
    const lengthOk = value.length >= 4 && value.length <= 20;
    const uppercase = /[A-Z]/.test(value);
    const specialChar = /[!@#$%^&*_+]/.test(value);
    return lengthOk && uppercase && specialChar;
  },
};
