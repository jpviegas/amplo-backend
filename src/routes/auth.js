const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const router = express.Router();

router.get("/user", async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 });

    res.status(200).json({
      success: true,
      count: users.length,
      users: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching users",
      error: error.message,
    });
  }
});

router.get("/user/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const users = await User.findById(id, { password: 0 });

    res.status(200).json({
      success: true,
      count: users.length,
      users: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Usuário não encontrado.",
      error: error.message,
    });
  }
});

router.get("/user/:email", async (req, res) => {
  const { email } = req.params;
  try {
    const users = await User.findOne({ email }, { name: 1, email: 1 });

    res.status(200).json({
      users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching users",
      error: error.message,
    });
  }
});

router.post("/user", async (req, res) => {
  const { email, password } = req.body;
  const addu = new User({
    name,
    email,
    password,
  });
  addu.save();
  res.status(200).json({
    user: {
      name,
      email,
      password,
    },
  });
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email e senha são obrigatórios" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Email ou senha incorreto" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Email ou senha incorreto" });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "24h" },
    );

    res.status(200).json({
      token,
      user: {
        id: user._id,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
