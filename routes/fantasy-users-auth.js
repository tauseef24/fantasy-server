const express = require("express");
const router = express.Router();
const { login, register } = require("../controllers/users/fantasyUsers");
const verifyToken = require("../middlewares/authJWT");
 
router.post("/register", register);
router.post("/login", login);
router.post("/protectedContent", verifyToken, (req, res) => {
  res.json({ msg: "Authorized" });
});
 
module.exports = router;