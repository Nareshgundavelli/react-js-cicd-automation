const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
const PORT = 5001;

app.use(cors());
app.use(express.json());

/* =========================
   Health Check (FIRST)
========================= */
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

/* =========================
   PostgreSQL Connection
========================= */
const pool = new Pool({
  user: process.env.DB_USER || "saikumar",
  host: process.env.DB_HOST || "postgres",
  database: process.env.DB_NAME || "saidb",
  password: process.env.DB_PASSWORD || "saikumar123",
  port: 5432,
});

pool.connect()
  .then(() => console.log("✅ PostgreSQL connected"))
  .catch(err => {
    console.error("❌ PostgreSQL error:", err.message);
    // ❗ DO NOT EXIT
  });

/* =========================
   Create table
========================= */
pool.query(`
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    password VARCHAR(100)
  )
`).catch(err => console.error("Table creation error:", err.message));

/* =========================
   APIs
========================= */
app.post("/api/signup", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    await pool.query(
      "INSERT INTO users (username, email, password) VALUES ($1, $2, $3)",
      [username, email, password]
    );
    res.json({ message: "Signup successful" });
  } catch (err) {
    res.status(409).json({ message: "User already exists" });
  }
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  const result = await pool.query(
    "SELECT * FROM users WHERE email=$1 AND password=$2",
    [email, password]
  );

  if (result.rows.length === 0) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  res.json({ message: "Login successful" });
});

/* =========================
   Start Server (LAST)
========================= */
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});
