const express = require("express");
const User = require("../models/User");
const Department = require("../models/Departamentos");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const department = await Department.find();

    res.status(200).json({
      success: true,
      count: department.length,
      departments: department,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching department",
      error: error.message,
    });
  }
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const department = await Department.find({ company: id });

    res.status(200).json({
      success: true,
      count: department.length,
      departments: department,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching department",
      error: error.message,
    });
  }
});

router.post("/", async (req, res) => {
  const { department, company, approvalFlow, sheetNumber } = req.body;

  try {
    const { success } = await User.findById(company);

    if (!{ success }) {
      return res.status(404).json({
        success: false,
        message: "ID da empresa não encontrado",
      });
    }

    const createNewDepartment = new Department({
      department,
      company,
      approvalFlow,
      sheetNumber,
    });
    await createNewDepartment.save();
    res.status(201).json({
      success: true,
      message: `O cargo ${department} foi criado com sucesso.`,
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
