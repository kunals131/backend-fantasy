const validator = require("validator"),
  isEmpty = require("../isEmpty");

const validateRegisterInput = data => {
  let errors = {};

  data.name = !isEmpty(data.name) ? data.name : "";
  data.email = !isEmpty(data.email) ? data.email : "";
  data.phone = !isEmpty(data.phone) ? data.phone : "";
  data.phoneExt = !isEmpty(data.phoneExt) ? data.phoneExt : "";
  data.password = !isEmpty(data.password) ? data.password : "";
  data.confPassword = !isEmpty(data.confPassword) ? data.confPassword : "";
  data.gender = !isEmpty(data.gender) ? data.gender : "";

  if (!validator.isLength(data.name, { min: 2, max: 30 })) {
    errors.name = "Name must be min 2 and max 30 characters.";
  }
  if (validator.isEmpty(data.name)) {
    errors.name = "Name is required";
  }
  if (!validator.isEmail(data.email)) {
    errors.email = "Please provide a valid email";
  }
  if (validator.isEmpty(data.email)) {
    errors.email = "Email is required";
  }
  if (validator.isEmpty(data.phone)) {
    errors.phone = "Phone is required";
  }
  if (validator.isEmpty(data.phoneExt)) {
    errors.phoneExt = "Phone extension is required";
  }
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
  if (validator.isEmpty(data.gender)) {
    errors.gender = "Gender is required";
  }
  return {
    errors,
    isValid: isEmpty(errors)
  };
};

module.exports = validateRegisterInput;