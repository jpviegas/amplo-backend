import { Request, Response } from "express";
import mongoose from "mongoose";
import { IPoint, Point } from "../models/Point";
import { PointHistory } from "../models/PointHistory";
import { Refeicao } from "../models/Refeicao";
import { Transporte } from "../models/Transporte";
import { User } from "../models/User";

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
          timestamps: {
            $push: {
              $dateToString: {
                format: "%Y-%m-%d %H:%M:%S",
                date: "$timestamp",
                timezone: "America/Sao_Paulo",
              },
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
    const points = (data || []).map((g: any) => ({
      userId: g.userId,
      name: typeof g?.name === "string" ? g.name : null,
      date: g.date,
      timestamps: Array.isArray(g.timestamps) ? g.timestamps : [],
    }));

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

    const start = new Date(Number(year), Number(month) - 1, 1);
    const end = new Date(Number(year), Number(month), 0, 23, 59, 59);

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
          timeZone: "UTC",
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
        timeZone: "UTC",
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
      const now = new Date();
      pointTimestamp = new Date(now.getTime() - 3 * 60 * 60 * 1000);
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

    const startOfDay = new Date(pointTimestamp);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(pointTimestamp);
    endOfDay.setHours(23, 59, 59, 999);

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
    const mesIndex = pointDate.getMonth();
    const mesNome = monthNames[mesIndex];
    const ano = pointDate.getFullYear();

    const startOfMonth = new Date(ano, mesIndex, 1);
    const endOfMonth = new Date(ano, mesIndex + 1, 0, 23, 59, 59);

    const monthlyPoints = await Point.find({
      userId,
      timestamp: {
        $gte: startOfMonth,
        $lte: endOfMonth,
      },
    }).lean();

    const uniqueDays = new Set(
      monthlyPoints.map((p) => {
        const d = new Date(p.timestamp);
        return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
      }),
    );

    const diasTrabalhados = uniqueDays.size;

    let valorRefeicaoDiario = 0;
    let valorTransporteDiario = 0;

    if (user.city && typeof user.city === "object" && "meal" in user.city) {
      const city = user.city as any;
      valorRefeicaoDiario = city.meal || 0;
      valorTransporteDiario = city.transport || 0;
    }

    const valorRefeicaoTotal = diasTrabalhados * valorRefeicaoDiario;
    const valorTransporteTotal = diasTrabalhados * valorTransporteDiario;

    await Refeicao.findOneAndUpdate(
      { user: userId, month: mesNome, year: ano },
      {
        daysWorked: diasTrabalhados,
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
        daysWorked: diasTrabalhados,
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
        daysWorked: diasTrabalhados,
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
