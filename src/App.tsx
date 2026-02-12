import React from "react";
import { initializeIcons } from "@fluentui/react";
import TeamsScreen from "./TeamsScreen";
import "./App.css";

// Initialize Fluent UI icons
initializeIcons();

const App: React.VFC = function App() {
  return <TeamsScreen />;
};

export default App;
