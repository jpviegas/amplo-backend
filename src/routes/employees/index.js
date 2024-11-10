const getAllEmployees = async function (req, res, next) {
  res.send("get all employees");
  next();
};

module.exports = {
  getAllEmployees,
};
