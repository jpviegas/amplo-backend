import { Request, Response } from "express";
import mongoose from "mongoose";
import { Cities } from "../models/Cities";
import { IPoint, Point } from "../models/Point";
import { PointHistory } from "../models/PointHistory";
import { Refeicao } from "../models/Refeicao";
import { Transporte } from "../models/Transporte";
import { User } from "../models/User";

const BENEFITS_TIMEZONE = "America/Sao_Paulo";
const REFEICAO_MINUTES_THRESHOLD = 4 * 60;
const SAO_PAULO_UTC_OFFSET_HOURS = 3;

const getDateKey = (date: Date) =>
  date.toLocaleDateString("en-CA", { timeZone: BENEFITS_TIMEZONE });

const getSaoPauloDateParts = (date: Date) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BENEFITS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = Number(parts.find((p) => p.type === "year")?.value);
  const month = Number(parts.find((p) => p.type === "month")?.value);
  const day = Number(parts.find((p) => p.type === "day")?.value);

  return { year, month, day };
};

const getSaoPauloYearMonth = (date: Date) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BENEFITS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(date);

  const year = Number(parts.find((p) => p.type === "year")?.value);
  const month = Number(parts.find((p) => p.type === "month")?.value);

  return { year, month };
};

const getSaoPauloDayRangeUtc = (date: Date) => {
  const { year, month, day } = getSaoPauloDateParts(date);
  const startUtcMs = Date.UTC(
    year,
    month - 1,
    day,
    SAO_PAULO_UTC_OFFSET_HOURS,
    0,
    0,
    0,
  );
  const endUtcMs = startUtcMs + 24 * 60 * 60 * 1000 - 1;
  return { start: new Date(startUtcMs), end: new Date(endUtcMs) };
};

const getSaoPauloMonthRangeUtc = (year: number, month: number) => {
  const startUtcMs = Date.UTC(
    year,
    month - 1,
    1,
    SAO_PAULO_UTC_OFFSET_HOURS,
    0,
    0,
    0,
  );
  const nextMonthStartUtcMs = Date.UTC(
    year,
    month,
    1,
    SAO_PAULO_UTC_OFFSET_HOURS,
    0,
    0,
    0,
  );
  return {
    start: new Date(startUtcMs),
    end: new Date(nextMonthStartUtcMs - 1),
  };
};

const computeDaysWorkedFromPoints = (
  points: Array<{ timestamp: Date }>,
  minutesThreshold: number,
) => {
  const perDay = new Map<string, Date[]>();

  for (const p of points) {
    const d = new Date(p.timestamp);
    const key = getDateKey(d);
    const list = perDay.get(key) ?? [];
    list.push(d);
    perDay.set(key, list);
  }

  let daysAtLeastThreshold = 0;
  for (const [, timestamps] of perDay) {
    timestamps.sort((a, b) => a.getTime() - b.getTime());

    let totalMs = 0;
    for (let i = 0; i + 1 < timestamps.length; i += 2) {
      const start = timestamps[i].getTime();
      const end = timestamps[i + 1].getTime();
      if (end > start) totalMs += end - start;
    }

    const totalMinutes = Math.floor(totalMs / (1000 * 60));
    if (totalMinutes >= minutesThreshold) {
      daysAtLeastThreshold += 1;
    }
  }

  return {
    daysWithAnyPoint: perDay.size,
    daysAtLeastThreshold,
  };
};

export const getAllTimesheets = async (req: Request, res: Response) => {
  try {
    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    const rawLimit = parseInt(req.query.limit as string) || 10;
    const limit = Math.min(Math.max(rawLimit, 1), 100);
    const skip = (page - 1) * limit;

    const usersCollection = User.collection.name;

    const [{ data, totalCount }] = await Point.aggregate([
      {
        $addFields: {
          userIdObj: {
            $convert: {
              input: "$userId",
              to: "objectId",
              onError: null,
              onNull: null,
            },
          },
        },
      },
      {
        $lookup: {
          from: usersCollection,
          localField: "userIdObj",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          name: "$user.name",
          dateKey: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$timestamp",
              timezone: "America/Sao_Paulo",
            },
          },
        },
      },
      {
        $group: {
          _id: { userId: "$userIdObj", date: "$dateKey", name: "$name" },
          userId: { $first: "$userIdObj" },
          name: { $first: "$name" },
          date: { $first: "$dateKey" },
          records: {
            $push: {
              timestamp: {
                $dateToString: {
                  format: "%Y-%m-%d %H:%M:%S",
                  date: "$timestamp",
                  timezone: "America/Sao_Paulo",
                },
              },
              type: "$type",
            },
          },
        },
      },
      { $sort: { date: -1, name: 1 } },
      {
        $facet: {
          data: [{ $skip: skip }, { $limit: limit }],
          totalCount: [{ $count: "total" }],
        },
      },
    ]);

    const total = totalCount?.[0]?.total || 0;
    const points = (data || []).map((g: any) => {
      const records = Array.isArray(g.records) ? g.records : [];
      const timestamps = records
        .map((r: any) => r?.timestamp)
        .filter((t: any) => typeof t === "string");
      const types = records
        .map((r: any) => r?.type)
        .filter((t: any) => t === "user" || t === "rh");

      return {
        userId: g.userId,
        name: typeof g?.name === "string" ? g.name : null,
        date: g.date,
        records,
        timestamps,
        types,
      };
    });

    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    if (!points || points.length === 0) {
      return res.status(200).json({
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
        count: 0,
        points: [],
        message: "Nenhum ponto encontrado",
      });
    }
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
      count: points.length,
      points,
      message: "Lista de pontos encontrada com sucesso",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro ao buscar pontos",
    });
  }
};

export const getTimesheetByUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { month, year } = req.query;

  try {
    if (!month || !year) {
      const point = await Point.findOne({
        userId: id,
      })
        .sort({ timestamp: -1 })
        .lean();
      return res.status(200).json({
        success: true,
        message: "Ponto registrado com sucesso",
        point,
      });
    }

    const monthNumber = Number(month);
    const yearNumber = Number(year);
    const { start, end } = getSaoPauloMonthRangeUtc(yearNumber, monthNumber);

    const points = await Point.find({
      userId: id,
      timestamp: {
        $gte: start,
        $lte: end,
      },
    })
      .sort({ timestamp: 1 })
      .lean();

    if (!points || points.length === 0) {
      return res.status(200).json({
        success: true,
        points,
        message: "Nenhum ponto encontrado para este período",
      });
    }

    const result: any[] = [];
    let currentDay: string | null = null;
    let dayTimestamps: Date[] = [];

    const calculateTotalHours = (timestamps: Date[]): string => {
      let totalMilliseconds = 0;

      for (let i = 0; i < timestamps.length - 1; i += 2) {
        const start = timestamps[i].getTime();
        const end = timestamps[i + 1].getTime();
        totalMilliseconds += end - start;
      }

      const totalMinutes = Math.floor(totalMilliseconds / (1000 * 60));
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;

      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
        2,
        "0",
      )}`;
    };

    const processDay = (day: string, timestamps: Date[]) => {
      const times = timestamps.map((t) =>
        t.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: BENEFITS_TIMEZONE,
        }),
      );

      const dayObject: any = {
        date: day,
        entry1: times[0] || "",
        exit1: times[1] || "",
        entry2: times[2] || "",
        exit2: times[3] || "",
        entry3: times[2] || "",
        exit3: times[3] || "",
        totalHours: calculateTotalHours(timestamps),
      };

      return dayObject;
    };

    points.forEach((point) => {
      const dateObj = new Date(point.timestamp);

      const dateStr = dateObj.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        timeZone: BENEFITS_TIMEZONE,
      });

      if (dateStr !== currentDay) {
        if (currentDay) {
          result.push(processDay(currentDay, dayTimestamps));
        }
        currentDay = dateStr;
        dayTimestamps = [];
      }

      dayTimestamps.push(dateObj);
    });

    if (currentDay) {
      result.push(processDay(currentDay, dayTimestamps));
    }

    res.status(200).json({
      success: true,
      points: result,
      message: "Lista de pontos encontrada com sucesso",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Erro ao buscar pontos",
      error: error.message,
    });
  }
};

export const registerPoint = async (req: Request, res: Response) => {
  try {
    const { userId, location, type, timestamp } = req.body;
    console.log(req.body);

    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "O ID do usuário é obrigatório" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res
        .status(400)
        .json({ success: false, message: "ID do usuário inválido" });
    }

    if (type !== "user" && type !== "rh") {
      return res.status(400).json({
        success: false,
        message: 'type inválido (use "user" ou "rh")',
      });
    }

    const user = await User.findById(userId).populate("city");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Usuário não encontrado" });
    }

    if (!location || !location.latitude || !location.longitude) {
      return res.status(400).json({
        message: "Localização é obrigatória (latitude e longitude)",
      });
    }

    let pointTimestamp: Date;
    if (timestamp !== undefined && timestamp !== null && timestamp !== "") {
      const parsed =
        timestamp instanceof Date
          ? timestamp
          : typeof timestamp === "string" || typeof timestamp === "number"
            ? new Date(timestamp)
            : null;

      if (!parsed || Number.isNaN(parsed.getTime())) {
        return res.status(400).json({
          success: false,
          message: "timestamp inválido",
        });
      }
      pointTimestamp = parsed;
    } else {
      pointTimestamp = new Date();
    }

    const thirtySecondsAgo = new Date(pointTimestamp.getTime() - 30 * 1000);
    const recentPoint = await Point.findOne({
      userId,
      timestamp: { $gte: thirtySecondsAgo, $lte: pointTimestamp },
    });
    if (recentPoint) {
      return res.status(400).json({
        success: false,
        message:
          "Não é possível registrar pontos em intervalos menores que 30 segundos",
      });
    }

    const { start: startOfDay, end: endOfDay } =
      getSaoPauloDayRangeUtc(pointTimestamp);

    const dailyPointsCount = await Point.countDocuments({
      userId,
      timestamp: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    });

    if (dailyPointsCount >= 6) {
      return res.status(400).json({
        success: false,
        message: "Limite de 6 registros diários atingido.",
      });
    }

    const newPoint = await Point.create({
      userId,
      timestamp: pointTimestamp,
      location,
      type,
    });

    const pointDate = new Date(pointTimestamp);
    const monthNames = [
      "Janeiro",
      "Fevereiro",
      "Março",
      "Abril",
      "Maio",
      "Junho",
      "Julho",
      "Agosto",
      "Setembro",
      "Outubro",
      "Novembro",
      "Dezembro",
    ];
    const ym = getSaoPauloYearMonth(pointDate);
    const mesIndex = ym.month - 1;
    const mesNome = monthNames[mesIndex];
    const ano = ym.year;

    const { start: startOfMonth, end: endOfMonth } = getSaoPauloMonthRangeUtc(
      ano,
      ym.month,
    );

    const monthlyPoints = await Point.find({
      userId,
      timestamp: {
        $gte: startOfMonth,
        $lte: endOfMonth,
      },
    })
      .sort({ timestamp: 1 })
      .lean();

    const { daysWithAnyPoint, daysAtLeastThreshold } =
      computeDaysWorkedFromPoints(
        monthlyPoints as Array<{ timestamp: Date }>,
        REFEICAO_MINUTES_THRESHOLD,
      );

    let valorRefeicaoDiario = 0;
    let valorTransporteDiario = 0;

    if (user.city && typeof user.city === "object" && "meal" in user.city) {
      const city = user.city as any;
      valorRefeicaoDiario = city.meal || 0;
      valorTransporteDiario = city.transport || 0;
    } else if (typeof (user as any).city === "string" && (user as any).city) {
      const cityValue = String((user as any).city).trim();
      if (mongoose.Types.ObjectId.isValid(cityValue)) {
        const cityDoc = await Cities.findById(cityValue)
          .select("meal transport")
          .lean();
        if (cityDoc) {
          valorRefeicaoDiario = Number((cityDoc as any).meal) || 0;
          valorTransporteDiario = Number((cityDoc as any).transport) || 0;
        }
      } else {
        const cityDoc = await Cities.findOne({ city: cityValue })
          .collation({ locale: "pt", strength: 2 })
          .select("meal transport")
          .lean();
        if (cityDoc) {
          valorRefeicaoDiario = Number((cityDoc as any).meal) || 0;
          valorTransporteDiario = Number((cityDoc as any).transport) || 0;
        }
      }
    }

    const diasTrabalhadosRefeicao = daysAtLeastThreshold;
    const diasTrabalhadosTransporte = daysWithAnyPoint;

    const valorRefeicaoTotal = diasTrabalhadosRefeicao * valorRefeicaoDiario;
    const valorTransporteTotal =
      diasTrabalhadosTransporte * valorTransporteDiario;

    await Refeicao.findOneAndUpdate(
      { user: userId, month: mesNome, year: ano },
      {
        daysWorked: diasTrabalhadosRefeicao,
        totalValue: valorRefeicaoTotal,
        dailyValue: valorRefeicaoDiario,
        user: userId,
        month: mesNome,
        year: ano,
      },
      { upsert: true, new: true },
    );

    await Transporte.findOneAndUpdate(
      { user: userId, month: mesNome, year: ano },
      {
        daysWorked: diasTrabalhadosTransporte,
        totalValue: valorTransporteTotal,
        dailyValue: valorTransporteDiario,
        user: userId,
        month: mesNome,
        year: ano,
      },
      { upsert: true, new: true },
    );

    await PointHistory.findOneAndUpdate(
      { user: userId, month: mesNome, year: ano },
      {
        pointsCount: monthlyPoints.length,
        daysWorked: daysWithAnyPoint,
        user: userId,
        month: mesNome,
        year: ano,
      },
      { upsert: true, new: true },
    );

    res.status(201).json({
      success: true,
      data: newPoint,
      message: "Ponto registrado com sucesso!",
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Erro ao registrar ponto",
      error: error.message,
    });
  }
};

export const getPointHistoryByUser = async (req: Request, res: Response) => {
  const { userId } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res
        .status(400)
        .json({ success: false, message: "ID do usuário inválido" });
    }

    const history = await PointHistory.find({ user: userId })
      .sort({ year: -1, month: -1 })
      .lean();

    if (!history) {
      return res.status(200).json({
        success: true,
        history,
        message: "Nenhum histórico encontrado para este usuário",
      });
    }

    res.status(200).json({
      success: true,
      history,
      message: "Histórico encontrado com sucesso",
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar histórico de pontos",
      error: error.message,
    });
  }
};

export const updatePoint = async (req: Request, res: Response) => {
  try {
    const { userId, timestamp } = req.body as IPoint;
    console.log(userId, timestamp);

    if (!userId || !timestamp) {
      return res.status(400).json({
        success: false,
        message: "ID do usuário e horário são obrigatórios",
      });
    }

    const newPoint = await Point.findByIdAndUpdate(
      req.params.id,
      {
        userId,
        timestamp,
        type: "rh",
      },
      { new: true },
    );

    res.status(200).json({
      success: true,
      data: newPoint,
      message: "Ponto atualizado com sucesso!",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Erro ao editar ponto",
      error: error.message,
    });
  }
};
