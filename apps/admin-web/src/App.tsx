import { Navigate, Route, Routes } from "react-router-dom";

import { AppShell } from "./layout/AppShell";
import { CustomerDetailPage } from "./pages/CustomerDetailPage";
import { DashboardPage } from "./pages/DashboardPage";
import { StaffDetailPage } from "./pages/StaffDetailPage";
import { StaffSchedulePage } from "./pages/StaffSchedulePage";
import { LoginPage } from "./pages/LoginPage";
import { SettingsPage } from "./pages/SettingsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<AppShell />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="customers/:customerSlug" element={<CustomerDetailPage />} />
        <Route path="staff/:staffSlug/schedule" element={<StaffSchedulePage />} />
        <Route path="staff/:staffSlug" element={<StaffDetailPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}
