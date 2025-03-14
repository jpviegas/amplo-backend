const express = require("express");
const Company = require("../models/Empresas");
const router = express.Router();

router.get("/", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    const [companies, total] = await Promise.all([
      Company.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Company.countDocuments(),
    ]);

    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.status(200).json({
      success: true,
      pagination: {
        total,
        page,
        totalPages,
        limit,
        hasNextPage,
        hasPrevPage,
        nextPage: hasNextPage ? page + 1 : null,
        prevPage: hasPrevPage ? page - 1 : null,
      },
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
  const { companyName } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;

  try {
    const filter = { company: id };

    if (companyName) {
      filter.companyName = { $regex: companyName, $options: "i" };
    }

    const [companies, total] = await Promise.all([
      Company.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Company.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.status(200).json({
      success: true,
      pagination: {
        total,
        page,
        totalPages,
        hasNextPage,
        hasPrevPage,
        nextPage: hasNextPage ? page + 1 : null,
        prevPage: hasPrevPage ? page - 1 : null,
      },
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
