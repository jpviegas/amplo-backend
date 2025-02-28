const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const req = require("express/lib/request");
const Role = require("../models/Cargos");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const roles = await Role.find();

    res.status(200).json({
      success: true,
      count: roles.length,
      roles: roles,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching roles",
      error: error.message,
    });
  }
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const roles = await Role.find({ company: id });

    res.status(200).json({
      success: true,
      count: roles.length,
      roles: roles,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching roles",
      error: error.message,
    });
  }
});

router.post("/", async (req, res) => {
  const { role, company } = req.body;

  try {
    const findCompany = await User.findById(company);
    if (!findCompany) {
      return res.status(404).json({
        success: false,
        message: "ID da empresa não encontrado",
      });
    }

    const createNewRole = new Role({
      role,
      company,
    });
    await createNewRole.save();
    res.status(201).json({
      success: true,
      message: `O cargo ${role} foi criado com sucesso.`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erro ao cadastrar o cargo.",
      error: error.message,
    });
  }
});

module.exports = router;
