const express = require("express");
const axios = require("axios");
const cors = require("cors");
const cookieParser = require("cookie-parser"); // Import cookie-parser
require("dotenv").config();

const app = express();
const port = 3200;

app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(cookieParser()); // Use cookie-parser middleware
app.use(express.json()); // Middleware to parse JSON

// Microsoft Auth URLs
const AUTHORITY = `https://login.microsoftonline.com/${process.env.TENANT_ID}`;
const REDIRECT_URI = process.env.REDIRECT_URI;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const SCOPES = process.env.SCOPES;

// Step 1: Redirect user to Microsoft login
app.get("/auth/login", (req, res) => {
  const authUrl = `${AUTHORITY}/oauth2/v2.0/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}&response_mode=query&scope=${encodeURIComponent(SCOPES)}&state=12345`;
  res.redirect(authUrl);
});

// Step 2: Callback route - Microsoft redirects here after login
app.get("/auth/callback", async (req, res) => {
  const code = req.query.code;

  try {
    const response = await axios.post(
      `${AUTHORITY}/oauth2/v2.0/token`,
      new URLSearchParams({
        client_id: CLIENT_ID,
        scope: SCOPES,
        code: code,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
        client_secret: CLIENT_SECRET,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const { access_token } = response.data;

    // Optionally, fetch user data with access token
    const user = await axios.get("https://graph.microsoft.com/v1.0/me", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    // Set the token as a secure HTTP-only cookie
    res.cookie("access_token", access_token, {
      httpOnly: true,
      secure: true, // Ensure this is true in production (HTTPS)
      sameSite: "Strict",
    });

    // Redirect to the dashboard with the user's name
    res.redirect(`http://localhost:3000/dashboard?name=${encodeURIComponent(user.data.displayName)}`);
  } catch (err) {
    console.error("Error in redirect:", err.response?.data || err.message);
    res.status(500).send("Auth failed.");
  }
});

// Fetch users from Microsoft Graph API
app.get("/api/users", async (req, res) => {
  const token = req.cookies.access_token; // Extract token from cookie

  if (!token) return res.status(401).json({ error: "Unauthorized: Missing token" });

  try {
    const graphRes = await axios.get("https://graph.microsoft.com/v1.0/users", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
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

  try {
    const token = req.cookies.access_token; // Extract token from secure cookie
    if (!token) return res.status(401).json({ error: "Unauthorized: Missing token" });

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

  try {
    const token = req.cookies.access_token; // Extract token from secure cookie
    if (!token) return res.status(401).json({ error: "Unauthorized: Missing token" });

    await axios.post(
      `https://graph.microsoft.com/v1.0/users/${id}/revokeSignInSessions`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    res.sendStatus(204); // No Content
  } catch (err) {
    console.error("Error signing out user:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to sign out user." });
  }
});

app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});
