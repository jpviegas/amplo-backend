import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import connectDB from "./config/db";
import { protect } from "./middleware/authMiddleware";
import abonoRoutes from "./routes/AbonoRoutes";
import companiesRoutes from "./routes/CompanyRoutes";
import departmentsRoutes from "./routes/DepartmentRoutes";
import noticesRoutes from "./routes/NoticesRoutes";
import refeicaoRoutes from "./routes/RefeicaoRoutes";
import servicesRoutes from "./routes/ServicesRoutes";
import timesheetRoutes from "./routes/TimesheetRoutes";
import trainingRoutes from "./routes/TrainingRoutes";
import transporteRoutes from "./routes/TransporteRoutes";
import userRoutes from "./routes/UserRoutes";

dotenv.config();

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", userRoutes);
app.use("/api/timesheet", timesheetRoutes);
app.use("/api/notices", noticesRoutes);
app.use("/api/refeicoes", refeicaoRoutes);
app.use("/api/transportes", transporteRoutes);
app.use("/api/trainings", trainingRoutes);
app.use("/api/services", servicesRoutes);
app.use("/api/abonos", abonoRoutes);
app.use("/api/companies", protect, companiesRoutes);
app.use("/api/departments", protect, departmentsRoutes);

app.get("/", (_req, res) => {
  res.send("API is running...");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
