const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const cors = require("cors");
const { getAllEmployees } = require("./routes/employees");
const { Sequelize, DataTypes } = require("sequelize");

require("dotenv").config();

app.use(cors());
app.use(express.json());

const sequelize = new Sequelize(process.env.RENDER_EXTERNAL_DB_URL);

sequelize
  .sync()
  .then(() => {
    console.log("database connected");
  })
  .catch((err) => {
    console.error(err);
  });

const get = sequelize.define("get", {
  name: DataTypes.STRING,
});

app.route("/").get((req, res) => {
  res.send("Hello World!");
});

app.get("/employees", get, (req, res, next) => {
  console.log("employees");
  next();
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
