// Microsoft Graph API - Get users (placeholder)
const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.json([
    { name: "Adele Vance", email: "AdeleV@contoso.com", accountEnabled: true },
    { name: "Alex Wilber", email: "AlexW@contoso.com", accountEnabled: false },
  ]);
});

router.get("/stats", (req, res) => {
  // Example static stats, replace with real logic
  res.json({
    total: 2,
    enabled: 1,
    disabled: 1,
  });
});

module.exports = router;
