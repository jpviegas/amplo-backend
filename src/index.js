const express = require("express");
const app = express();
const port = process.env.PORT || 4000;
const cors = require("cors");
const connectDB = require("./db/mongo");

require("dotenv").config();

app.use(cors());
app.use(express.json());

connectDB();

const authRoutes = require("./routes/auth");
const rolesRoutes = require("./routes/roles");
const departmentsRoutes = require("./routes/departments");
const employeesRoutes = require("./routes/employees");
const companiesRoutes = require("./routes/companies");
app.use("/api/auth", authRoutes);
app.use("/api/roles", rolesRoutes);
app.use("/api/departments", departmentsRoutes);
app.use("/api/employees", employeesRoutes);
app.use("/api/companies", companiesRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
