import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import CostTracking from "./pages/finops/CostTracking";
import LicenseOptimization from "./pages/finops/LicenseOptimization";
import AutomatedCostControl from "./pages/finops/AutomatedCostControl";
import WasteDetection from "./pages/finops/WasteDetection";
import ShadowIT from "./pages/finops/ShadowIT";
import UnifiedCostReporting from "./pages/finops/UnifiedCostReporting";
import Forecasting from "./pages/finops/Forecasting";
import UserList from "./pages/UserList";
import Groups from "./pages/Groups";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/finops/cost-tracking" element={<CostTracking />} />
        <Route path="/finops/license-optimization" element={<LicenseOptimization />} />
        <Route path="/finops/automated-cost-control" element={<AutomatedCostControl />} />
        <Route path="/finops/waste-detection" element={<WasteDetection />} />
        <Route path="/finops/shadow-it" element={<ShadowIT />} />
        <Route path="/finops/cost-tracking/unified-cost-reporting" element={<UnifiedCostReporting />} />
        <Route path="/finops/cost-tracking/forecasting" element={<Forecasting />} />
        <Route path="/users" element={<UserList />} />
        <Route path="/groups" element={<Groups />} />
      </Routes>
    </Router>
  );
}

export default App;