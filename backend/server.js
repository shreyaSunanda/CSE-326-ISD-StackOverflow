

// server.js

require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const questionRoutes = require("./routes/questionRoutes");
const authRoutes = require("./routes/auth");
const cors = require("cors");

const app = express();


app.use(cors({
  origin: "http://localhost:3000" 
}));


app.use(express.json()); 


connectDB();


app.use("/api/questions", questionRoutes); 
app.use("/api/auth", authRoutes);


app.get("/ping", (req, res) => {
  res.json({ success: true, message: "Backend is connected!" });
});


app.use((req, res) => {
    res.status(404).json({ success: false, message: "Route not found" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));