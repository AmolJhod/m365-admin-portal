
// Microsoft Graph API - Get users (placeholder)
const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.json([
    { name: "Adele Vance", email: "AdeleV@contoso.com" },
    { name: "Alex Wilber", email: "AlexW@contoso.com" },
  ]);
});

module.exports = router;
