// server.js

require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const questionRoutes = require("./routes/questionRoutes");
const cors = require("cors"); // 1️⃣ import cors


const app = express();

// 2️⃣ enable CORS before routes
app.use(cors({
  origin: "http://localhost:3000" // allow React frontend
}));

app.use(express.json()); // to parse JSON bodies

// 3️⃣ connect to MongoDB
connectDB();

app.get("/ping", (req, res) => {
  res.json({ success: true, message: "Backend is connected!" });
});

// 4️⃣ define routes
app.use("/questions", questionRoutes);

// 5️⃣ start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));