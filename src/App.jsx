
import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Loading from "./pages/Loading";
import Analytic from "./pages/Analytic"
import Setting from "./pages/Setting"

function App() {
  return (
    <Routes>
      <Route path="/" element={<Loading />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/analytics" element={<Analytic />} />
      <Route path="/settings" element={<Setting />} />
    </Routes>
  );
}

export default App
