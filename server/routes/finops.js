const express = require("express");
const axios = require("axios");
const router = express.Router();

function getToken(req) {
  return req.cookies.access_token;
}

// 1. Cost Tracking & Dashboards
router.get("/cost-tracking", async (req, res) => {
  const token = getToken(req);
  if (!token) return res.status(401).json({ error: "Unauthorized: Missing token" });
  try {
    // Fetch users with department and assignedLicenses
    const usersRes = await axios.get("https://graph.microsoft.com/v1.0/users?$select=displayName,department,assignedLicenses", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const users = usersRes.data.value;

    // Group license count by department
    const costByDept = {};
    users.forEach(u => {
      const dept = u.department || "Unknown";
      costByDept[dept] = (costByDept[dept] || 0) + (u.assignedLicenses.length || 0);
    });

    res.json({
      costByDept
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch cost data" });
  }
});

// Azure VM Info (requires Azure API access and token with right permissions)
router.get("/cost-tracking/azure-vms", async (req, res) => {
  const token = getToken(req);
  if (!token) return res.status(401).json({ error: "Unauthorized: Missing token" });

  try {
    // Replace with your Azure subscription ID
    const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID;
    // Get Azure VMs
    const vmRes = await axios.get(
      `https://management.azure.com/subscriptions/${subscriptionId}/providers/Microsoft.Compute/virtualMachines?api-version=2023-03-01`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const vms = vmRes.data.value || [];
    // For each VM, get name and creation time (if available)
    const vmDetails = vms.map(vm => ({
      name: vm.name,
      resourceGroup: vm.id.split("/")[4],
      location: vm.location,
      // Uptime: you may need to call instance view API for real uptime
      // Here, just show provisioning time if available
      provisioningTime: vm.properties.timeCreated || "Unknown"
    }));
    res.json({ count: vms.length, vms: vmDetails });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch Azure VM data" });
  }
});

// License usage by department
router.get("/cost-tracking/license-by-department", async (req, res) => {
  const token = getToken(req);
  if (!token) return res.status(401).json({ error: "Unauthorized: Missing token" });

  try {
    // Get users with department and assignedLicenses
    const usersRes = await axios.get(
      "https://graph.microsoft.com/v1.0/users?$select=displayName,department,assignedLicenses",
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const users = usersRes.data.value;
    // Group by department
    const deptUsage = {};
    users.forEach(u => {
      const dept = u.department || "Unknown";
      deptUsage[dept] = (deptUsage[dept] || 0) + (u.assignedLicenses.length || 0);
    });
    res.json({ usage: deptUsage });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch license usage data" });
  }
});

router.get("/cost-tracking/license-forecast", async (req, res) => {
  const token = req.cookies.access_token;
  if (!token) return res.status(401).json({ error: "Unauthorized: Missing token" });

  // Example static mapping for license SKU IDs to prices (USD/month)
  // In production, fetch from Microsoft API or update regularly
  const skuPrices = {
    "ENTERPRISEPACK": 23, // Office 365 E3
    "EMS": 11,            // Enterprise Mobility + Security E3
    "SPE_E5": 57,         // Microsoft 365 E5
    "SPE_E3": 36,         // Microsoft 365 E3
    "POWER_BI_PRO": 10,   // Power BI Pro
    // Add more as needed
  };

  try {
    // Get all users and their assigned licenses
    const usersRes = await axios.get(
      "https://graph.microsoft.com/v1.0/users?$select=assignedLicenses",
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const users = usersRes.data.value;

    // Count licenses by SKU
    const licenseCounts = {};
    users.forEach(u => {
      (u.assignedLicenses || []).forEach(lic => {
        const sku = lic.skuPartNumber || lic.skuId || "UNKNOWN";
        licenseCounts[sku] = (licenseCounts[sku] || 0) + 1;
      });
    });

    // Prepare report
    const report = [];
    let totalYearly = 0;
    for (const [sku, count] of Object.entries(licenseCounts)) {
      const price = skuPrices[sku] || 0;
      const yearly = price * 12 * count;
      totalYearly += yearly;
      report.push({
        sku,
        price,
        count,
        yearly
      });
    }

    res.json({
      licenses: report,
      totalYearly
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch license price/usage data" });
  }
});

// 2. License Optimization
router.get("/license-optimization", async (req, res) => {
  const token = getToken(req);
  if (!token) return res.status(401).json({ error: "Unauthorized: Missing token" });
  try {
    // Fetch users with assignedLicenses and displayName
    const usersRes = await axios.get("https://graph.microsoft.com/v1.0/users?$select=displayName,assignedLicenses,userPrincipalName", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const users = usersRes.data.value;

    // Map license SKU to users
    const licenseMap = {};
    users.forEach(u => {
      (u.assignedLicenses || []).forEach(lic => {
        const sku = lic.skuPartNumber || lic.skuId || "UNKNOWN";
        if (!licenseMap[sku]) licenseMap[sku] = [];
        licenseMap[sku].push({ name: u.displayName, email: u.userPrincipalName });
      });
    });

    // Prepare report
    const report = Object.entries(licenseMap).map(([sku, users]) => ({
      sku,
      count: users.length,
      users
    }));

    res.json({ licenses: report });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch license data" });
  }
});

// 3. Automated Cost Control
router.get("/automated-cost-control", async (req, res) => {
  // TODO: Integrate with Azure APIs for live data
  res.json({
    autoShutdowns: null,
    budgetAlerts: null,
    policyBlocks: null,
    message: "Live data integration required"
  });
});

// 4. Waste Detection & Savings Tips
router.get("/waste-detection", async (req, res) => {
  // TODO: Integrate with Azure Resource Graph for idle resources
  res.json({
    idleResources: 0, // TODO: Implement real logic
    rightSize: 0, // TODO: Implement real logic
    spotVsReserved: "", // TODO: Implement real logic
  });
});

// 5. Shadow IT & SaaS Spend Tracking
router.get("/shadow-it", async (req, res) => {
  // TODO: Integrate with Microsoft Defender for Cloud Apps API
  res.json({
    unauthorizedApps: 0, // TODO: Implement real logic
    teamsVsZoom: { teams: 0, zoom: 0 }, // TODO: Implement real logic
  });
});

module.exports = router;