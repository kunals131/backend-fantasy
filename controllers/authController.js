const jwt = require("jsonwebtoken");
const User = require("../models/User");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const crypto = require("crypto");
const sendMail = require("../utils/email");

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    // payload + secret + expire time
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createsendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  // Remove the password from output
  user.password = undefined;
  res.status(statusCode).json({
    status: "success",
    token,
    user,
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const checkUser = await User.findOne({email: req.body.email})
  if(checkUser){
    return next(new AppError("Email already exists!", 400));
  }
  let user = await User.create({
    name: req.body.name,
    email: req.body.email,
    dob: req.body.dob,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    deleted: false
  });

  // Generate Account Activation Link
  const activationToken = user.createAccountActivationLink();

  user.save({ validateBeforeSave: false });

  // 4 Send it to Users Email
  const activationURL = `${process.env.BASE_URL}auth/confirmMail/${activationToken}`;
  // let activationURL = `${req.headers.origin}/confirmMail/${activationToken}`;

  console.log(`req.get('host')`, req.get("host"));
  console.log(`req.host`, req.host);
  console.log(`req.protocol`, req.protocol);

  const message = `GO to this link to activate your App Account : ${activationURL} .`;

  sendMail({
    email: user.email,
    message,
    subject: "Your Account Activation Link for Daily Fantasy!",
    user,
    template: "signupEmail.ejs",
    url: activationURL,
  });
  res.status(200).json({
    status: "Success",
    message: `Email verification link successfully sent to your email.`,
    user,
  });
  // createsendToken(user, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    //  check email and password exist
    return next(new AppError("Please proveide email and password ", 400));
  }

  const user = await User.findOne({ email, deleted: false }).select("+password"); // select expiclity password

  if (!user)
    return next(new AppError(`No User found against email ${email}`, 404));
  if (
    !user || // check user exist and password correct
    !(await user.correctPassword(password, user.password))
  ) {
    // candinate password,correctpassword
    return next(new AppError("Incorrect email or password", 401));
  }
  if (user.activated === false)
    return next(
      new AppError(
        `Your account is not activated! Please contact admin@daily-fantasy.com to know the status.`,
        401
      )
    );
  if (user.verified === false)
    return next(
      new AppError(
        `Please Activate your email by the Link sent to your email ${user.email}.`,
        401
      )
    );

  // if eveything is ok
  createsendToken(user, 200, res);
});

exports.confirmMail = catchAsync(async (req, res, next) => {
  // 1 Hash The Avtivation Link
  // console.log(req.params.activationLink);

  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.activationLink)
    .digest("hex");

  // console.log(hashedToken);

  const user = await User.findOne({
    activationLink: hashedToken,
  });

  if (!user) {
    res.render("auth/activateAccount", {
      msg_text: "Activation Link Invalid or Expired!",
      msg_title: "FAILED!",
      success: false,
    });
    // return next(new AppError(`Activation Link Invalid or Expired !`));
  } else {
    // 3 Activate his Account
    user.activated = true;
    user.verified = true;
    user.activationLink = undefined;
    await user.save({ validateBeforeSave: false });
    // res.redirect(`${process.env.APP_URL}`);
    res.render("auth/activateAccount", {
      msg_text:
        "Your account has been successfully activated. Sign in to your account with the email and password.",
      msg_title: "SUCCESS!",
      loginUrl: process.env.APP_URL,
      success: true,
    });
  }
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1 Check if Email Exists
  const { email } = req.body;

  if (!email) return next(new AppError(`Please provide Email with request`, 400));

  // 2 Check If User Exists with this email
  const user = await User.findOne({
    email: email.toLowerCase(),
    deleted: false
  });

  if (!user)
    return next(
      new AppError(`No User Found against this Email : ${email}`, 400)
    );

  // 3 Create Password Reset Token
  const resetToken = user.createPasswordResetToken();

  await user.save({ validateBeforeSave: false });

  // 4 Send it to Users Email
  // const resetURL = `localhost:5000/api/users/resetPassword/${resetToken}`;
  let resetURL = `${process.env.APP_URL}/resetPassword/${resetToken}`;
  //    = `${req.protocol}://${req.get(
  //     'host'
  //   )}/api/users/resetPassword/${resetToken}`;

  const message = `Forgot Password . Update your Password at this link ${resetURL} if you actually request it
   . If you did NOT forget it , simply ignore this Email`;

  sendMail({
    email,
    message,
    subject:
      "Your Password reset link for daily-fantasy.com (will expire in 20 minutes)",
    user,
    template: "forgotPassword.ejs",
    url: resetURL,
  });

  res.status(200).json({
    status: "Success",
    message: `Forget password link successfully sent to your email : ${email}`,
  });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1 Find the  user based on Token

  // console.log(req.params.resetToken);

  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.resetToken)
    .digest("hex");

  console.log(hashedToken);

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: {
      $gt: Date.now(),
    },
  });

  // 2 Check if user still exists and token is NOT Expired
  if (!user)
    return next(new AppError(`Reset Password Link Invalid or Expired !`));

  // 3 Change Password and Log the User in
  const { password, confPassword } = req.body;

  // console.log('passwords are', password, passwordConfirm);

  user.password = password;
  user.passwordConfirm = confPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  const token = signToken(user._id);

  // * If you don't want the user to be logged In after pass reset
  // * Remove token from respone
  res.status(200).json({
    status: "success",
    token,
    user
  });
});

//    Update Password for only logged in user

exports.updatePassword = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("+password");
  if (!(await user.correctPassword(req.body.oldPassword, user.password))) {
    return next(new AppError(" Your current password is wrong", 401));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.confPassword;
  await user.save();
  createsendToken(user, 200, res);
});

exports.createAdmin = catchAsync(async (req, res, next) => {
  if(req.body.adminPassword !== process.env.ADMIN_CREATE_PASSWORD){
    return next(new AppError('Unauthorized!', 401));
  }
  let user = await User.create({
    username: req.body.username,
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role: "admin",
    activated: true,
    verified: true
  });
  res.status(200).json({
    status: 'Success',
    message: `Admin created successfully`,
    user,
  });
  // createsendToken(user, 201, res);
});