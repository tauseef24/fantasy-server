const jwt = require("jsonwebtoken");
const argon2 = require("argon2");
const FantasyUserModel = require("../../models/fantasy-users.js");
const User = require("../../models/fantasy-users.js")
exports.register = async (req, res) => {
  console.log(req.body);
  const password = await argon2.hash(req.body.password);
  const user = new FantasyUserModel({
    name: req.body.name,
    email: req.body.email,
    role: req.body.role ? req.body.role : "user",
    password,
  });

  try {
    await user.save();
    res.status(200).json({ msg: "User created successfully" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    console.log(req.body.email)
    const foundUser = await FantasyUserModel.findOne(
      { email: req.body.email }
    );
    if (!foundUser) {
      return res.status(404).json({ msg: "User not found" });
    }

    let passwordValidity = await argon2.verify(
      foundUser.password,
      req.body.password
    );

    if (!passwordValidity) {
      return res.status(401).json({
        accessToken: null,
        msg: "Invalid password",
      });
    }

    let token = jwt.sign({ id: foundUser.id }, process.env.API_SECRET, {
      expiresIn: 86400,
    });

    res.status(200).json({
      user: {
        id: foundUser._id,
        name: foundUser.name,
        wallet: foundUser.wallet,
        skillScore: foundUser.skillScore,
      },
      msg: "Login Successfully!",
      accessToken: token,
    });
  } catch (error) {
    res.status(500).send({ msg: error });
  }
};

exports.updateWallet = async (req, res) => {
  const { userId, amount } = req.body;

  try {
    // Find the user by ID
    const user = await FantasyUserModel.findById(userId);

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Update the wallet balance
    user.wallet = amount;
    
    // Save the updated user
    await user.save();

    res.status(200).json({ msg: "Wallet updated successfully", wallet: user.wallet });
  } catch (error) {
    res.status(500).send({ msg: error });
  }
};

exports.getUserWallet = async (req,res)=>{
  const {userId} = req.params;
  try{
    console.log(userId)
    const user = await User.findById(userId)
    console.log(user)
    res.status(200).send({money:user.wallet})
  }
  catch(err)
  {
    res.status(500).send({ msg: error });
  }
}
