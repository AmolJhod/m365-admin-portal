
// OAuth2 flow placeholder
const express = require("express");
const router = express.Router();

router.get("/login", (req, res) => {
  res.send("Redirect to Microsoft Login here.");
});

module.exports = router;
