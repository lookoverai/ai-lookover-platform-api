require("dotenv").config();
const app = require("./src/app");
const PORT = process.env.PORT || 5990;
const logger = require("./src/utils/logger");

app.listen(PORT, () => {
  logger.info(`Server is running on port http://localhost:${PORT}`);
});
