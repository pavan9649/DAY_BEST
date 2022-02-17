const jwt = require("jsonwebtoken");

async function auth(req, res, next) {
  try {
    let secret = process.env.jwt_secret;
    if (/admin/.test(req.originalUrl)) {
      secret = process.env.jwt_secret_admin;
    }
    let decode = await jwt.verify(req.header("x-auth-token"), secret);
    console.log(decode);
    next();
  } catch (e) {
    res.status(403).json({ message: "user is not authenticated" });
  }
}


const verifyTokenAndAuthorization = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.id === req.parms.id || req.user.role) {
      next();
    } else {
      res.status(403).json("You are not allowed");
    }
  });
};

const verifyTokenAndAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    if ((req.user.usertype=="admin"||req.user.usertype=="ADMIN")) {
      next();
    } else {
      res.status(403).json("You are not allowed");
    }
  });
};

module.exports = {
  verifyTokenAndAuthorization,
  verifyTokenAndAdmin,
  auth
};