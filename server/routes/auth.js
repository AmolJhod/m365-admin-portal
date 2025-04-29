const express = require("express");
const axios = require("axios");
const router = express.Router();

router.get("/login", (req, res) => {
  const AUTHORITY = `https://login.microsoftonline.com/${process.env.TENANT_ID}`;
  const CLIENT_ID = process.env.CLIENT_ID;
  const REDIRECT_URI = process.env.REDIRECT_URI;
  const SCOPES = process.env.SCOPES;

  const authUrl = `${AUTHORITY}/oauth2/v2.0/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}&response_mode=query&scope=${encodeURIComponent(SCOPES)}&state=12345`;

  res.redirect(authUrl);
});

// --- Add this handler for /auth/callback ---
router.get("/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) {
    return res.status(400).send("Missing code parameter.");
  }

  const AUTHORITY = `https://login.microsoftonline.com/${process.env.TENANT_ID}`;
  const CLIENT_ID = process.env.CLIENT_ID;
  const CLIENT_SECRET = process.env.CLIENT_SECRET;
  const REDIRECT_URI = process.env.REDIRECT_URI;
  const SCOPES = process.env.SCOPES;

  try {
    // Exchange code for access token
    const tokenResponse = await axios.post(
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

    const { access_token } = tokenResponse.data;

    // Optionally, fetch user info
    const userResponse = await axios.get("https://graph.microsoft.com/v1.0/me", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    // Set the token as a secure HTTP-only cookie
    res.cookie("access_token", access_token, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
    });

    // Redirect to dashboard with user's name
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?name=${encodeURIComponent(userResponse.data.displayName)}`);
  } catch (err) {
    console.error("OAuth callback error:", err.response?.data || err.message);
    res.status(500).send("Authentication failed.");
  }
});

module.exports = router;
