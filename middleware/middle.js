const jwt = require("jsonwebtoken");

async function auth(req, res, next) {
  try {
    let secret = process.env.JWT_SECRET;
    const authHeader = req.header('Authorization')
    console.log(authHeader,8)
    const token = authHeader.split(" ")[1]
     jwt.verify(token, secret);
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