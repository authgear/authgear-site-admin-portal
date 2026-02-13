import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { initializeIcons } from "@fluentui/react";
import ScreenLayout from "./ScreenLayout";
import TeamsScreen from "./TeamsScreen";
import ProjectDetailsPage from "./ProjectDetailsPage";
import AuditLogDetailPage from "./AuditLogDetailPage";
import "./App.css";

initializeIcons();

/** When embedded in an iframe (e.g. portal shell), parent provides header/sidebar — render only content to avoid double top bar and sidebar. */
const isEmbedded = typeof window !== "undefined" && window.self !== window.top;

const App: React.VFC = function App() {
  const routes = (
    <Routes>
      <Route path="/" element={<Navigate to="/teams" replace />} />
      <Route path="/teams" element={<TeamsScreen />} />
      <Route path="/teams/:projectId" element={<ProjectDetailsPage />} />
      <Route
        path="/teams/:projectId/audit-log/:logKey"
        element={<AuditLogDetailPage />}
      />
    </Routes>
  );

  return (
    <BrowserRouter>
      {isEmbedded ? (
        <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
          {routes}
        </div>
      ) : (
        <ScreenLayout>{routes}</ScreenLayout>
      )}
    </BrowserRouter>
  );
};

export default App;
