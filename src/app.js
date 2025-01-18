const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("./utils/mongodb_client");
const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Error Middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send(err);
});

// Root Route
app.get("/", (req, res) => {
  res.send("Lookover Platform API");
});

app.use("/org", require("./api/org/routes"));
app.use("/auth", require("./api/auth/routes"));



module.exports = app;
