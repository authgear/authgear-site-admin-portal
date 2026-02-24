import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { initializeIcons } from "@fluentui/react";
import ScreenLayout from "./ScreenLayout";
import TeamsScreen from "./TeamsScreen";
import ProjectDetailsPage from "./ProjectDetailsPage";
import AuditLogDetailPage from "./AuditLogDetailPage";
import "./App.css";

initializeIcons();

/** Always show full layout (header + sidebar). If you need content-only for a specific embedder later, use a URL param or env check instead of window.self !== window.top, which also triggers in Ruttl/Vercel preview iframes. */
const App: React.VFC = function App() {
  const routes = (
    <Routes>
      <Route path="/" element={<TeamsScreen />} />
      <Route path="/:projectId" element={<ProjectDetailsPage />} />
      <Route path="/:projectId/audit-log/:logNum" element={<AuditLogDetailPage />} />
    </Routes>
  );

  return (
    <BrowserRouter>
      <ScreenLayout>{routes}</ScreenLayout>
    </BrowserRouter>
  );
};

export default App;
