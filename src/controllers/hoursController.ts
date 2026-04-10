import { Request, Response } from "express";
import { Hour } from "../models/Hour";

const TIME_RE = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

const parseTimeToMinutes = (time: string) => {
  const [hh, mm] = time.split(":").map((v) => Number(v));
  return hh * 60 + mm;
};

const formatMinutesToHHMM = (minutes: number) => {
  const safe = Math.max(0, Math.floor(minutes));
  const hh = Math.floor(safe / 60);
  const mm = safe % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
};

type TimeRangeInput = { start: string; end: string };
type DayScheduleInput = { dayOfWeek: number; ranges: TimeRangeInput[] };

const normalizeSchedule = (input: unknown) => {
  if (!Array.isArray(input)) return null;

  const days: DayScheduleInput[] = [];
  for (const item of input) {
    if (!item || typeof item !== "object") return null;
    const dayOfWeek = (item as any).dayOfWeek;
    const ranges = (item as any).ranges;

    if (typeof dayOfWeek !== "number" || dayOfWeek < 0 || dayOfWeek > 6) {
      return null;
    }
    if (!Array.isArray(ranges)) return null;

    const normalizedRanges: TimeRangeInput[] = [];
    for (const range of ranges) {
      if (!range || typeof range !== "object") return null;
      const start = (range as any).start;
      const end = (range as any).end;
      if (typeof start !== "string" || typeof end !== "string") return null;
      const startTrimmed = start.trim();
      const endTrimmed = end.trim();
      if (!TIME_RE.test(startTrimmed) || !TIME_RE.test(endTrimmed)) return null;
      normalizedRanges.push({ start: startTrimmed, end: endTrimmed });
    }

    days.push({ dayOfWeek, ranges: normalizedRanges });
  }

  const mergedByDay = new Map<number, TimeRangeInput[]>();
  for (const day of days) {
    mergedByDay.set(day.dayOfWeek, day.ranges);
  }

  const finalDays: DayScheduleInput[] = [];
  for (let d = 0; d <= 6; d++) {
    finalDays.push({ dayOfWeek: d, ranges: mergedByDay.get(d) ?? [] });
  }

  return finalDays;
};

const computeTotals = (days: DayScheduleInput[]) => {
  const computedDays = days.map((day) => {
    const ranges = [...day.ranges].map((r) => ({
      start: r.start,
      end: r.end,
      startMinutes: parseTimeToMinutes(r.start),
      endMinutes: parseTimeToMinutes(r.end),
    }));

    ranges.sort((a, b) => a.startMinutes - b.startMinutes);

    let lastEnd = -1;
    let totalMinutes = 0;
    for (const r of ranges) {
      if (r.endMinutes <= r.startMinutes) {
        return { ok: false as const, error: "Horário inválido: saída deve ser maior que entrada" };
      }
      if (r.startMinutes < lastEnd) {
        return { ok: false as const, error: "Horário inválido: períodos não podem se sobrepor" };
      }
      totalMinutes += r.endMinutes - r.startMinutes;
      lastEnd = r.endMinutes;
    }

    return {
      ok: true as const,
      day: {
        dayOfWeek: day.dayOfWeek,
        ranges: day.ranges,
        totalMinutes,
      },
    };
  });

  for (const d of computedDays) {
    if (!d.ok) return d;
  }

  const normalized = computedDays.map((d) => (d as any).day) as Array<{
    dayOfWeek: number;
    ranges: TimeRangeInput[];
    totalMinutes: number;
  }>;

  const weeklyTotalMinutes = normalized.reduce((acc, d) => acc + d.totalMinutes, 0);

  return {
    ok: true as const,
    days: normalized,
    weeklyTotalMinutes,
  };
};

export const getAllHours = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;

  try {
    const [hours, total] = await Promise.all([
      Hour.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Hour.countDocuments(),
    ]);

    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    if (!hours || hours.length === 0) {
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
        hours: [],
        message: "Nenhuma horário encontrada",
      });
    }
    const mapped = hours.map((h: any) => ({
      ...h,
      weeklyTotal: typeof h.weeklyTotalMinutes === "number" ? formatMinutesToHHMM(h.weeklyTotalMinutes) : undefined,
      days: Array.isArray(h.days)
        ? h.days.map((d: any) => ({
            ...d,
            total: typeof d.totalMinutes === "number" ? formatMinutesToHHMM(d.totalMinutes) : undefined,
          }))
        : [],
    }));

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
      count: mapped.length,
      hours: mapped,
      message: "Lista de horários encontrada com sucesso",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro ao buscar notícias",
    });
  }
};

export const getHourById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const hour = await Hour.findOne({ _id: id }).lean();

    if (!hour) {
      return res.status(404).json({
        success: false,
        message: "Horário não encontrado",
      });
    }

    res.status(200).json({
      success: true,
      hour: {
        ...(hour as any),
        weeklyTotal:
          typeof (hour as any).weeklyTotalMinutes === "number"
            ? formatMinutesToHHMM((hour as any).weeklyTotalMinutes)
            : undefined,
        days: Array.isArray((hour as any).days)
          ? (hour as any).days.map((d: any) => ({
              ...d,
              total:
                typeof d.totalMinutes === "number"
                  ? formatMinutesToHHMM(d.totalMinutes)
                  : undefined,
            }))
          : [],
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Error fetching hour",
      error: error.message,
    });
  }
};

export const createHour = async (req: Request, res: Response) => {
  try {
    const body = req.body as any;
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const schedule = normalizeSchedule(body?.days);

    if (schedule) {
      const totals = computeTotals(schedule);
      if (!totals.ok) {
        return res.status(400).json({
          success: false,
          message: totals.error,
        });
      }

      const newHour = await Hour.create({
        name,
        days: totals.days,
        weeklyTotalMinutes: totals.weeklyTotalMinutes,
      });

      return res.status(201).json({
        success: true,
        data: {
          ...(newHour.toObject() as any),
          weeklyTotal: formatMinutesToHHMM(totals.weeklyTotalMinutes),
          days: totals.days.map((d) => ({
            ...d,
            total: formatMinutesToHHMM(d.totalMinutes),
          })),
        },
        message: "Horário criado com sucesso!",
      });
    }

    const initialHour =
      typeof body?.initialHour === "string" ? body.initialHour.trim() : "";
    const finalHour =
      typeof body?.finalHour === "string" ? body.finalHour.trim() : "";

    if (!initialHour || !finalHour) {
      return res.status(400).json({
        success: false,
        message: "Conteúdo da hora é obrigatório",
      });
    }

    if (!TIME_RE.test(initialHour) || !TIME_RE.test(finalHour)) {
      return res.status(400).json({
        success: false,
        message: "Horário inválido (use HH:MM)",
      });
    }

    const existingHour = await Hour.findOne({
      initialHour,
      finalHour,
      days: { $size: 0 },
    }).lean();

    if (existingHour) {
      return res.status(409).json({
        success: false,
        message: "Horário já cadastrado com este período",
      });
    }

    const newHour = await Hour.create({ name, initialHour, finalHour });

    res.status(201).json({
      success: true,
      data: newHour,
      message: "Horário criado com sucesso!",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Erro ao criar horário",
      error: error.message,
    });
  }
};

export const updateHour = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const existing = await Hour.findById(id).lean();
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Horário não encontrado",
      });
    }

    const body = req.body as any;
    const name = typeof body?.name === "string" ? body.name.trim() : (existing as any).name ?? "";

    const schedule =
      body?.days !== undefined ? normalizeSchedule(body?.days) : null;

    if (schedule) {
      const totals = computeTotals(schedule);
      if (!totals.ok) {
        return res.status(400).json({
          success: false,
          message: totals.error,
        });
      }

      const updated = await Hour.findByIdAndUpdate(
        id,
        {
          name,
          days: totals.days,
          weeklyTotalMinutes: totals.weeklyTotalMinutes,
          initialHour: undefined,
          finalHour: undefined,
        },
        { new: true, runValidators: true },
      ).lean();

      return res.status(200).json({
        success: true,
        data: {
          ...(updated as any),
          weeklyTotal: formatMinutesToHHMM(totals.weeklyTotalMinutes),
          days: totals.days.map((d) => ({
            ...d,
            total: formatMinutesToHHMM(d.totalMinutes),
          })),
        },
        message: "Hora atualizada com sucesso!",
      });
    }

    const initialHour =
      typeof body?.initialHour === "string"
        ? body.initialHour.trim()
        : (existing as any).initialHour ?? "";
    const finalHour =
      typeof body?.finalHour === "string"
        ? body.finalHour.trim()
        : (existing as any).finalHour ?? "";

    if (!initialHour || !finalHour) {
      return res.status(400).json({
        success: false,
        message: "Conteúdo da hora é obrigatório",
      });
    }

    if (!TIME_RE.test(initialHour) || !TIME_RE.test(finalHour)) {
      return res.status(400).json({
        success: false,
        message: "Horário inválido (use HH:MM)",
      });
    }

    const updated = await Hour.findByIdAndUpdate(
      id,
      { name, initialHour, finalHour, days: [], weeklyTotalMinutes: 0 },
      { new: true, runValidators: true },
    ).lean();

    return res.status(200).json({
      success: true,
      data: updated,
      message: "Hora atualizada com sucesso!",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Erro ao atualizar hora",
      error: error.message,
    });
  }
};

export const deleteHour = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const existingHour = await Hour.findById(id).lean();

    if (!existingHour) {
      return res.status(404).json({
        success: false,
        message: "Hora não encontrada",
      });
    }

    await Hour.findByIdAndDelete(id);
    res.status(200).json({
      success: true,
      message: `A hora ${(existingHour as any).initialHour ?? ""}${(existingHour as any).finalHour ? ` - ${(existingHour as any).finalHour}` : ""} foi excluído com sucesso.`,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Erro ao excluir a hora.",
      error: error.message,
    });
  }
};
