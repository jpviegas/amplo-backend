const express = require("express");
const Role = require("../models/Cargos");
const Company = require("../models/Empresas");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const companies = await Company.find();

    res.status(200).json({
      success: true,
      count: companies.length,
      companies: companies,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching companies",
      error: error.message,
    });
  }
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const companies = await Role.find({ company: id });

    res.status(200).json({
      success: true,
      count: companies.length,
      companies: companies,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching companies",
      error: error.message,
    });
  }
});

router.post("/", async (req, res) => {
  const values = req.body;
  try {
    const existingCompany = await Company.findOne({
      companyName: values.companyName,
    }).lean();

    if (existingCompany) {
      return res.status(409).json({
        success: false,
        message: "Empresa já cadastrada com este nome",
      });
    }

    const createNewCompany = new Company(values);
    await createNewCompany.save();
    res.status(201).json({
      success: true,
      message: `A empresa ${values.companyName} foi criada com sucesso.`,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Dados inválidos para cadastro da empresa",
        errors: Object.values(error.errors).map((err) => err.message),
      });
    }

    res.status(500).json({
      success: false,
      message: "Erro ao cadastrar a empresa",
      error: error.message,
    });
  }
});

module.exports = router;
