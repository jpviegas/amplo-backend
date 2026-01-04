import console from "console";
import { Request, Response } from "express";
import mongoose from "mongoose";
import { Point } from "../models/Point";
import { User } from "../models/User";

export const getAllTimesheets = async (_req: Request, res: Response) => {
  try {
    const points = await Point.find().sort({ timestamp: 1 }).lean();

    if (!points || points.length === 0) {
      return res.status(200).json({
        success: true,
        points,
        message: "Nenhum ponto encontrado",
      });
    }
    res.status(200).json({
      success: true,
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
      return res.status(400).json({
        success: false,
        message: "Mês e ano são obrigatórios",
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
        points: {},
        message: "Nenhum ponto encontrado para este período",
      });
    }

    // Group points by day
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
        "0"
      )}`;
    };

    const processDay = (day: string, timestamps: Date[]) => {
      const times = timestamps.map((t) =>
        t.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "UTC",
        })
      );

      const dayObject: any = {
        date: day,
        entry1: times[0] || "",
        exit1: times[1] || "",
        entry2: times[2] || "",
        exit2: times[3] || "",
        totalHours: calculateTotalHours(timestamps),
      };

      return dayObject;
    };

    points.forEach((point) => {
      const dateObj = new Date(point.timestamp);

      // Format: DD/MM
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
    const { userId, location } = req.body;
    console.log(userId, location);

    if (!userId) {
      return res.status(400).json({ message: "O ID do usuário é obrigatório" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "ID do usuário inválido" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    if (!location || !location.latitude || !location.longitude) {
      return res.status(400).json({
        message: "Localização é obrigatória (latitude e longitude)",
      });
    }

    // Adjust for Brasilia Time (UTC-3)
    const now = new Date();
    const brasiliaTime = new Date(now.getTime() - 3 * 60 * 60 * 1000);

    const newPoint = await Point.create({
      userId,
      timestamp: brasiliaTime,
      location,
    });

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
