const express = require("express");
const axios = require("axios");
const cors = require("cors");
const cookieParser = require("cookie-parser"); // Import cookie-parser
require("dotenv").config();

const app = express();
const port = 3200;

app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(cookieParser()); // Use cookie-parser middleware
app.use(express.json()); // Middleware to parse JSON

const authRouter = require("./routes/auth");
app.use("/auth", authRouter);

const finopsRouter = require("./routes/finops");
app.use("/api/finops", finopsRouter);

// Fetch users from Microsoft Graph API
app.get("/api/users", async (req, res) => {
  const token = req.cookies.access_token; // Extract token from cookie
  if (!token) return res.status(401).json({ error: "Unauthorized: Missing token" });

  try {
    const graphRes = await axios.get("https://graph.microsoft.com/v1.0/users", {
      headers: { Authorization: `Bearer ${token}` },
    });
    res.json(graphRes.data);
  } catch (err) {
    console.error("Error fetching users:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// PATCH: Disable or enable user account
app.patch("/api/users/:id/account", async (req, res) => {
  const { id } = req.params;
  const { enabled } = req.body;
  if (typeof enabled !== "boolean") {
    return res.status(400).json({ error: "Invalid 'enabled' value. Must be true or false." });
  }
  const token = req.cookies.access_token; // Extract token from secure cookie
  if (!token) return res.status(401).json({ error: "Unauthorized: Missing token" });

  try {
    await axios.patch(
      `https://graph.microsoft.com/v1.0/users/${id}`,
      { accountEnabled: enabled },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    res.sendStatus(204); // No Content
  } catch (err) {
    console.error("Error updating account status:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to update account status." });
  }
});

// POST: Force sign-out user
app.post("/api/users/:id/signout", async (req, res) => {
  const { id } = req.params;
  const token = req.cookies.access_token; // Extract token from secure cookie
  if (!token) return res.status(401).json({ error: "Unauthorized: Missing token" });

  try {
    await axios.post(
      `https://graph.microsoft.com/v1.0/users/${id}/revokeSignInSessions`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    res.sendStatus(204); // No Content
  } catch (err) {
    console.error("Error signing out user:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to sign out user." });
  }
});

// Optional: Test route to verify backend is running
app.get("/test", (req, res) => {
  res.send("Backend is working!");
});

app.get("/", (req, res) => {
  res.send("Root route: backend is up!");
});

app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});
