const express = require("express");
const Employee = require("../models/Funcionarios");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const employee = await Employee.find();

    res.status(200).json({
      success: true,
      count: employee.length,
      employees: employee,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching roles",
      error: error.message,
    });
  }
});

router.get("/:name", async (req, res) => {
  const { name } = req.params;

  try {
    const employees = await Employee.find({
      name: { $regex: name, $options: "i" },
    });

    res.status(200).json({
      success: true,
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
