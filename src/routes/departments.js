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
  const { department } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;

  try {
    const filter = { company: id };

    if (department) {
      filter.name = { $regex: department, $options: "i" };
    }

    const [departments, total] = await Promise.all([
      Department.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Department.countDocuments(filter),
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
      count: departments.length,
      departments: departments,
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
