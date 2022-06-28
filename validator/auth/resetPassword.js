const validator = require("validator"),
  isEmpty = require("../isEmpty");

const validateResetPassword = data => {
  let errors = {};

  data.password = !isEmpty(data.password) ? data.password : "";
  data.confPassword = !isEmpty(data.confPassword) ? data.confPassword : "";

  if (!validator.isLength(data.password, { min: 8 })) {
    errors.password = "Password must be greater than 8 characters";
  }
  if (validator.isEmpty(data.password)) {
    errors.password = "Password is required";
  }
  if (data.confPassword !== data.password) {
    errors.confPassword = "Confirm password not matching with the password";
  }
  if (validator.isEmpty(data.confPassword)) {
    errors.confPassword = "Confirm password is required";
  }
  return {
    errors,
    isValid: isEmpty(errors)
  };
};

module.exports = validateResetPassword;