const express = require("express");
const User = require("../models/User");
const Hour = require("../models/Horarios");
const router = express.Router();

router.get("/", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    const [hours, total] = await Promise.all([
      Hour.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Hour.countDocuments(),
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
      count: hours.length,
      hours: hours,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching hours",
      error: error.message,
    });
  }
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const { hour } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;

  try {
    const filter = { company: id };

    if (hour) {
      filter.hour = { $regex: hour, $options: "i" };
    }

    const [hours, total] = await Promise.all([
      Hour.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Hour.countDocuments(filter),
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
      count: hours.length,
      hours: hours,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching hours",
      error: error.message,
    });
  }
});

router.post("/", async (req, res) => {
  const { hour, company } = req.body;

  try {
    const findCompany = await User.findById(company);
    if (!findCompany) {
      return res.status(404).json({
        success: false,
        message: "ID da empresa não encontrado",
      });
    }

    const createNewHour = new Hour({
      hour,
      company,
    });
    await createNewHour.save();
    res.status(201).json({
      success: true,
      message: `O horário ${hour} foi criado com sucesso.`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erro ao cadastrar o horário.",
      error: error.message,
    });
  }
});

module.exports = router;
