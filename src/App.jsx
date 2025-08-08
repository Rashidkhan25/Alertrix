
import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard"
import Loading from "./pages/Loading"

function App() {
  return (
    <Routes>
      <Route path="/" element={<Loading />} />
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  );
}

export default App
