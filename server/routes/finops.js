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
  const token = req.cookies.access_token;
  if (!token) return res.status(401).json({ error: "Unauthorized: Missing token" });

  try {
    // Fetch users with assignedLicenses and displayName
    const usersRes = await axios.get(
      "https://graph.microsoft.com/v1.0/users?$select=displayName,assignedLicenses,userPrincipalName",
      { headers: { Authorization: `Bearer ${token}` } }
    );
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

// --- Cost Tracking & Dashboards: Comparison Reports ---
router.get("/cost-tracking/comparison-reports", async (req, res) => {
  res.json({
    months: ["2024-05", "2024-06"],
    departments: ["IT", "HR", "Finance"],
    data: [
      { department: "IT", "2024-05": 12, "2024-06": 14 },
      { department: "HR", "2024-05": 8, "2024-06": 7 },
      { department: "Finance", "2024-05": 5, "2024-06": 6 }
    ]
  });
});

// --- License Optimization: Recommend Downgrades ---
router.get("/license-optimization/recommend-downgrade", async (req, res) => {
  const token = req.cookies.access_token;
  if (!token) return res.status(401).json({ error: "Unauthorized: Missing token" });

  try {
    // Example: Get users with assigned licenses and mailbox usage
    const usersRes = await axios.get(
      "https://graph.microsoft.com/v1.0/users?$select=displayName,userPrincipalName,assignedLicenses",
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const users = usersRes.data.value;

    // For each user, get mailbox usage (requires Reports.Read.All permission)
    // This is a simplified example; for production, batch requests and handle pagination
    const recommendations = [];
    for (const user of users) {
      // Example: Only recommend downgrade if user has licenses and no mailbox usage
      // (You should use the real reports API for mailbox/Teams/OneDrive usage)
      if (user.assignedLicenses.length > 0) {
        // Fetch mailbox usage (replace with real API call)
        // const usageRes = await axios.get(`https://graph.microsoft.com/v1.0/users/${user.id}/mailboxSettings`, { headers: { Authorization: `Bearer ${token}` } });
        // if (usageRes.data.lastAccessedDateTime is old) { ... }
        recommendations.push({
          user: user.displayName,
          email: user.userPrincipalName,
          currentLicense: "E3/E5/...", // Map from assignedLicenses
          suggestedLicense: "Business Basic", // Your logic here
          reason: "Mailbox usage data not available in this demo"
        });
      }
    }
    res.json({ recommendations });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch recommendations" });
  }
});

// --- License Optimization: Track M365 vs. O365 Usage ---
router.get("/license-optimization/track-usage", async (req, res) => {
  res.json({
    usage: [
      { license: "M365", users: 25, active: 20 },
      { license: "O365", users: 15, active: 10 }
    ]
  });
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

// --- Automated Cost Control ---
router.get("/automated-cost-control/auto-shutdown", async (req, res) => {
  res.json({
    autoShutdowns: [
      { vm: "az-vm-01", lastActive: "2024-06-01", status: "Stopped" },
      { vm: "az-vm-02", lastActive: "2024-06-10", status: "Running" }
    ]
  });
});
router.get("/automated-cost-control/budget-alerts", async (req, res) => {
  res.json({
    budgetAlerts: [
      { name: "M365 Budget", threshold: 1000, current: 950, status: "OK" },
      { name: "Azure Budget", threshold: 2000, current: 2100, status: "Exceeded" }
    ]
  });
});
router.get("/automated-cost-control/policy-governance", async (req, res) => {
  res.json({
    policyBlocks: [
      { policy: "No Public IP", violations: 2 },
      { policy: "Tagging Required", violations: 0 }
    ]
  });
});

// 4. Waste Detection & Savings Tips
router.get("/waste-detection/idle-resources", async (req, res) => {
  const token = req.cookies.access_token;
  if (!token) return res.status(401).json({ error: "Unauthorized: Missing token" });

  try {
    const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID;
    // Example: List all VMs (you need to analyze metrics for idleness)
    const vmRes = await axios.get(
      `https://management.azure.com/subscriptions/${subscriptionId}/providers/Microsoft.Compute/virtualMachines?api-version=2023-03-01`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const vms = vmRes.data.value || [];
    // You would need to call Azure Monitor for metrics to determine idleness
    res.json({ idleResources: vms.map(vm => ({ resource: vm.name, type: "VM", lastUsed: "Unknown" })) });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch Azure VM data" });
  }
});

router.get("/waste-detection/right-size", async (req, res) => {
  res.json({
    rightSize: [
      { resource: "az-vm-04", current: "Standard_D4s_v3", recommended: "Standard_D2s_v3" }
    ]
  });
});

router.get("/waste-detection/spot-vs-reserved", async (req, res) => {
  res.json({
    spotVsReserved: [
      { type: "Spot", count: 2, cost: 100 },
      { type: "Reserved", count: 1, cost: 80 }
    ]
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

// --- Shadow IT & SaaS Spend Tracking ---
router.get("/shadow-it/unauthorized-apps", async (req, res) => {
  res.json({
    unauthorizedApps: [
      { app: "Dropbox", users: 3 },
      { app: "Slack", users: 2 }
    ]
  });
});
router.get("/shadow-it/compare-costs", async (req, res) => {
  res.json({
    teamsVsZoom: [
      { platform: "Teams", usage: 120 },
      { platform: "Zoom", usage: 45 }
    ]
  });
});

module.exports = router;