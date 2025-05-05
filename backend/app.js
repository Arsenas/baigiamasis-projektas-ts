const express = require("express");
const cors = require("cors");
const app = express();

const connectDB = require("./plugins/db");
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes (įkelsim vėliau)
// const userRoute = require("./routes/userRoute");
// app.use("/user", userRoute);

// Start server
const PORT = 2000;
app.listen(PORT, () => {
  console.log("Server is running on port", PORT);
});
