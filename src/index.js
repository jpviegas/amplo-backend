require("dotenv").config();
const express = require("express");
const app = express();
const port = process.env.PORT;
const cors = require("cors");
const connectDB = require("./db/mongo");

app.use(cors());
app.use(express.json());

connectDB();

const authRoutes = require("./routes/auth");
const rolesRoutes = require("./routes/roles");
const departmentsRoutes = require("./routes/departments");
const employeesRoutes = require("./routes/employees");
const companiesRoutes = require("./routes/companies");
const hoursRoutes = require("./routes/hours");
app.use("/api/auth", authRoutes);
app.use("/api/roles", rolesRoutes);
app.use("/api/departments", departmentsRoutes);
app.use("/api/employees", employeesRoutes);
app.use("/api/companies", companiesRoutes);
app.use("/api/hours", hoursRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
