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
app.use("/api/auth", authRoutes);
app.use("/api/roles", rolesRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
