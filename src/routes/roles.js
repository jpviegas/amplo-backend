const express = require("express");
const User = require("../models/User");
const Role = require("../models/Cargos");
const router = express.Router();

router.get("/", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    const [roles, total] = await Promise.all([
      Role.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Role.countDocuments(),
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
  const { role } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;

  try {
    const filter = { company: id };

    if (role) {
      filter.role = { $regex: role, $options: "i" };
    }

    const [roles, total] = await Promise.all([
      Role.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Role.countDocuments(filter),
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
