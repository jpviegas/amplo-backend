const express = require("express");
const Employee = require("../models/Funcionarios");
const router = express.Router();

router.get("/", async (req, res) => {
  const { name, company } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const filter = {};

  if (company) {
    filter.company = company;
  }

  if (name) {
    filter.name = { $regex: name, $options: "i" };
  }

  try {
    const [employees, total] = await Promise.all([
      Employee.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Employee.countDocuments(filter),
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
      count: employees.length,
      employees: employees,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching employees",
      error: error.message,
    });
  }
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [employee] = await Promise.all([Employee.findById(id).lean()]);

    if (!employee) {
      res.status(404).json({
        success: false,
        message: "Funcionário não encontrado",
      });
    }

    res.status(200).json({
      success: true,
      employee: employee,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching employee",
      error: error.message,
    });
  }
});

router.post("/", async (req, res) => {
  const values = req.body;

  try {
    const existingEmployee = await Employee.findOne({
      name: values.name,
    }).lean();

    if (existingEmployee) {
      return res.status(409).json({
        success: false,
        message: "Funcionário já cadastrado com este nome",
      });
    }

    const createNewEmployee = new Employee(values);
    await createNewEmployee.save();
    res.status(201).json({
      success: true,
      message: `O funcionário ${values.name} foi criado com sucesso.`,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Dados inválidos para cadastro do funcionário",
        errors: Object.values(error.errors).map((err) => err.message),
      });
    }

    res.status(500).json({
      success: false,
      message: "Erro ao cadastrar o funcionário.",
      error: error.message,
    });
  }
});

module.exports = router;
