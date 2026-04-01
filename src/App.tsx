import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { initializeIcons } from "@fluentui/react";
import { AuthgearProvider, useAuthgear } from "./auth/AuthgearContext";
import ScreenLayout from "./components/ScreenLayout";
import TeamsScreen from "./pages/TeamsScreen";
import ProjectDetailsPage from "./pages/ProjectDetailsPage";
import AuditLogDetailPage from "./pages/AuditLogDetailPage";
import AuthRedirectPage from "./auth/AuthRedirectPage";
import LoginPage from "./auth/LoginPage";
import "./App.css";

initializeIcons();

const AuthenticatedApp: React.VFC = function AuthenticatedApp() {
  const { sessionState } = useAuthgear();

  if (sessionState !== "AUTHENTICATED") {
    return <LoginPage />;
  }

  return (
    <ScreenLayout>
      <Routes>
        <Route path="/" element={<TeamsScreen />} />
        <Route path="/:projectId" element={<ProjectDetailsPage />} />
        <Route
          path="/:projectId/audit-log/:logNum"
          element={<AuditLogDetailPage />}
        />
      </Routes>
    </ScreenLayout>
  );
};

const App: React.VFC = function App() {
  return (
    <BrowserRouter>
      <AuthgearProvider>
        <Routes>
          <Route path="/auth-redirect" element={<AuthRedirectPage />} />
          <Route path="/*" element={<AuthenticatedApp />} />
        </Routes>
      </AuthgearProvider>
    </BrowserRouter>
  );
};

export default App;
