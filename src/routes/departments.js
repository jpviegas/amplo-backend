const express = require("express");
const User = require("../models/User");
const Department = require("../models/Departamentos");
const router = express.Router();

router.get("/", async (req, res) => {
  const { company, role } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const filter = {};

  if (company) {
    filter.company = company;
  }

  if (role) {
    filter.role = { $regex: role, $options: "i" };
  }

  try {
    const [departments, total] = await Promise.all([
      Department.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Department.countDocuments(),
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
      count: departments.length,
      departments: departments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching departments",
      error: error.message,
    });
  }
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = 10;

  try {
    const [departments, total] = await Promise.all([
      Department.findById(id).lean(),
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
      departments: departments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching departments",
      error: error.message,
    });
  }
});

router.post("/", async (req, res) => {
  const { department, company, approvalFlow, sheetNumber } = req.body;

  try {
    const findCompany = await User.findById(company);
    const findDepartment = await Department.exists({
      department: department,
      company: company,
    });

    if (!findCompany) {
      return res.status(404).json({
        success: false,
        message: "ID da empresa não encontrado",
      });
    }

    if (findDepartment) {
      return res.status(409).json({
        success: false,
        message: "Departamento já cadastrado com este nome",
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
      message: `O departamento ${department} foi criado com sucesso.`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erro ao cadastrar o departamento.",
      error: error.message,
    });
  }
});

module.exports = router;
