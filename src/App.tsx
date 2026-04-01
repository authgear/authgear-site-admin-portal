import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { initializeIcons, Spinner, SpinnerSize } from "@fluentui/react";
import { AuthgearProvider, useAuthgear } from "./auth/AuthgearContext";
import ScreenLayout from "./components/ScreenLayout";
import ProjectsScreen from "./pages/ProjectsScreen";
import ProjectDetailsPage from "./pages/ProjectDetailsPage";
import AuditLogDetailPage from "./pages/AuditLogDetailPage";
import AuthRedirectPage from "./auth/AuthRedirectPage";
import LoginPage from "./auth/LoginPage";
import APITestPage from "./pages/APITestPage";
import "./App.css";

initializeIcons();

const AuthenticatedApp: React.VFC = function AuthenticatedApp() {
  const { sessionState, userInfoLoading } = useAuthgear();

  if (sessionState !== "AUTHENTICATED") {
    return <LoginPage />;
  }

  if (userInfoLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <Spinner size={SpinnerSize.large} />
      </div>
    );
  }

  return (
    <ScreenLayout>
      <Routes>
        <Route path="/" element={<ProjectsScreen />} />
        <Route path="/api-test" element={<APITestPage />} />
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
