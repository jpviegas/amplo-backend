import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import connectDB from "./config/db";
// import { protect } from "./middleware/authMiddleware";
import abonoRoutes from "./routes/AbonoRoutes";
import citiesRoutes from "./routes/CitiesRoutes";
import companiesRoutes from "./routes/CompanyRoutes";
import departmentsRoutes from "./routes/DepartmentRoutes";
import documentRoutes from "./routes/documentRoutes";
import epiRoutes from "./routes/EPIRoutes";
import holidayRoutes from "./routes/HolidayRoutes";
import hoursRoutes from "./routes/hoursRoutes";
import managementRoutes from "./routes/ManagementRoutes";
import noticesRoutes from "./routes/NoticesRoutes";
import positionsRoutes from "./routes/PositionsRoutes";
import refeicaoRoutes from "./routes/RefeicaoRoutes";
import servicesRoutes from "./routes/ServicesRoutes";
import timesheetRoutes from "./routes/TimesheetRoutes";
import trainingRoutes from "./routes/TrainingRoutes";
import transporteRoutes from "./routes/TransporteRoutes";
import userRoutes from "./routes/UserRoutes";
import zapSignRoutes from "./routes/ZapSignRoutes";

dotenv.config();

connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  console.log("REQ", {
    method: req.method,
    url: req.originalUrl,
    contentType: req.headers["content-type"],
  });
  res.on("finish", () => {
    console.log("RES", {
      status: res.statusCode,
      method: req.method,
      url: req.originalUrl,
    });
  });
  next();
});

app.use("/api/auth", userRoutes);
app.use("/api/timesheet", timesheetRoutes);
app.use("/api/notices", noticesRoutes);
app.use("/api/hours", hoursRoutes);
app.use("/api/refeicoes", refeicaoRoutes);
app.use("/api/transportes", transporteRoutes);
app.use("/api/trainings", trainingRoutes);
app.use("/api/services", servicesRoutes);
app.use("/api/abonos", abonoRoutes);
app.use("/api/cities", citiesRoutes);
app.use("/api/companies", companiesRoutes);
app.use("/api/departments", departmentsRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/epis", epiRoutes);
app.use("/api/holidays", holidayRoutes);
app.use("/api/managements", managementRoutes);
app.use("/api/positions", positionsRoutes);
// ZapSign integration endpoints (mounted at root to match required paths)
app.use("/", zapSignRoutes);
app.use(
  (
    err: any,
    _req: express.Request,
    _res: express.Response,
    next: express.NextFunction,
  ) => {
    console.error("ERR", {
      status: err?.status,
      message: err?.message,
      data: err?.response?.data,
    });
    next(err);
  },
);

app.get("/", (_req, res) => {
  res.send("API is running...");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
