import { useState } from "react";

import DriverDashboard from "./features/driver/DriverDashboard";
import { CurrentRoute } from "./features/driver/CurrentRoute";
import { Collections } from "./features/driver/Collections";

function App() {
  const [page, setPage] = useState("dashboard");

  if (page === "route") {
    return <CurrentRoute onNavigate={setPage} />;
  }

  if (page === "collections") {
  return <Collections onNavigate={setPage} />;
}

  return <DriverDashboard onNavigate={setPage} />;
}

export default App;
