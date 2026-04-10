import { Request, Response } from "express";
import { Holiday, IHoliday } from "../models/Holiday";

const normalizeHolidayDate = (value: unknown) => {
  const asString =
    typeof value === "string"
      ? value.trim()
      : typeof value === "number" && Number.isFinite(value)
        ? String(value)
        : "";

  const onlyDigits = asString.replace(/\D/g, "");
  if (onlyDigits.length === 7) return onlyDigits.padStart(8, "0");
  return onlyDigits;
};

const normalizeHolidayComment = (value: unknown) => {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
};

// const holidaySchema = z.object({
//   date: z
//     .string({ error: "A data do feriado é obrigatório" })
//     .nonempty("A data do feriado é obrigatório")
//     .min(3, "O feriado é obrigatório")
//     .refine((v) => /^\d{8}$/.test(v), {
//       message: "A data do feriado deve estar no formato DDMMAAAA",
//     }),
//   comment: z
//     .string({ error: "O comentário do feriado é obrigatório" })
//     .nonempty("O comentário do feriado é obrigatório")
//     .min(3, "O comentário do feriado é obrigatório"),
// });

// type HolidayType = z.infer<typeof holidaySchema>;

const escapeRegex = (input: string) =>
  input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const getAllHolidays = async (req: Request, res: Response) => {
  try {
    const { search } = req.query;

    const page = parseInt(req.query.page as string) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};
    if (typeof search === "string" && search.trim()) {
      const pattern = escapeRegex(search.trim());
      filter.$or = [
        { date: { $regex: pattern, $options: "i" } },
        { comment: { $regex: pattern, $options: "i" } },
      ];
    }

    const [holidays, total] = await Promise.all([
      Holiday.find(filter)
        .collation({ locale: "pt", strength: 2 })
        .sort({ date: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Holiday.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    if (!holidays || holidays.length === 0) {
      return res.status(200).json({
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
        count: 0,
        holidays: [],
        message: "Nenhum feriado encontrado",
      });
    }

    return res.status(200).json({
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
      count: holidays.length,
      holidays,
      message: "Lista de feriados encontrada com sucesso",
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Erro ao buscar feriados",
      error: error.message,
    });
  }
};

export const getHolidayById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const holiday = await Holiday.findById(id).lean();

    if (!holiday) {
      return res.status(404).json({
        success: false,
        message: "Feriado não encontrado",
      });
    }

    return res.status(200).json({
      success: true,
      holiday,
      message: "Feriado encontrado com sucesso",
    });
  } catch (error: any) {
    if (error?.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "ID inválido",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Erro ao buscar feriado",
      error: error.message,
    });
  }
};

export const createHoliday = async (req: Request, res: Response) => {
  try {
    const { date, comment } = req.body as IHoliday;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Data é obrigatório",
      });
    }

    const newHoliday = await Holiday.create({
      date,
      comment,
    });

    res.status(201).json({
      success: true,
      data: newHoliday,
      message: "Feriado cadastrado com sucesso!",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Erro ao cadastrar feriado",
      error: error.message,
    });
  }
};

export const updateHoliday = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { date, comment } = req.body as IHoliday;

    const existingHoliday = await Holiday.findById(id);

    if (!existingHoliday) {
      return res.status(404).json({
        success: false,
        message: "Feriado não encontrado",
      });
    }

    existingHoliday.date = date || existingHoliday.date;
    existingHoliday.comment = comment || existingHoliday.comment;

    await existingHoliday.save();

    res.status(200).json({
      success: true,
      data: existingHoliday,
      message: "Feriado atualizado com sucesso!",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Erro ao atualizar feriado",
      error: error.message,
    });
  }
};

export const deleteHoliday = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const existingHoliday = await Holiday.findById(id).lean();

    if (!existingHoliday) {
      return res.status(404).json({
        success: false,
        message: "Feriado não encontrado",
      });
    }

    await Holiday.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: `O feriado ${existingHoliday.date} foi excluído com sucesso.`,
    });
  } catch (error: any) {
    if (error?.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "ID inválido",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Erro ao excluir o feriado.",
      error: error.message,
    });
  }
};
