import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { initializeIcons, Spinner, SpinnerSize } from "@fluentui/react";
import { AuthgearProvider, useAuthgear } from "./auth/AuthgearContext";
import ScreenLayout from "./components/ScreenLayout";
import ProjectsScreen from "./pages/ProjectsScreen";
import ProjectDetailsPage from "./pages/ProjectDetailsPage";
import AuthRedirectPage from "./auth/AuthRedirectPage";
import LoginPage from "./auth/LoginPage";
import APITestPage from "./pages/APITestPage";
import AccessDeniedPage from "./pages/AccessDeniedPage";
import { listApps } from "./api/siteadmin";
import "./App.css";

initializeIcons();

const AuthenticatedApp: React.VFC = function AuthenticatedApp() {
  const { sessionState, userInfoLoading } = useAuthgear();
  const [accessChecking, setAccessChecking] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    if (userInfoLoading) return;
    listApps({ page_size: 1 })
      .then(() => setAccessChecking(false))
      .catch(() => {
        setAccessDenied(true);
        setAccessChecking(false);
      });
  }, [userInfoLoading]);

  if (sessionState !== "AUTHENTICATED") {
    return <LoginPage />;
  }

  if (userInfoLoading || accessChecking) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
        }}
      >
        <Spinner size={SpinnerSize.large} />
      </div>
    );
  }

  if (accessDenied) {
    return <AccessDeniedPage />;
  }

  return (
    <ScreenLayout>
      <Routes>
        <Route path="/" element={<ProjectsScreen />} />
        <Route path="/api-test" element={<APITestPage />} />
        <Route path="/project/:projectId" element={<ProjectDetailsPage />} />
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
