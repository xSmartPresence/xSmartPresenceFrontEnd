import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./layout/Layout";
import Dashboard from "./pages/Dashboard";
import Attendance from "./pages/Attendance";
import Employees from "./pages/Employees";
import Shifts from "./pages/Shifts";
import Reports from "./pages/Reports";
import RecognitionLogs from "./pages/RecognitionLogs";
import Anomalies from "./pages/Anomalies";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute"; // ✅ IMPORTANT

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public Route */}
        <Route path="/" element={<Login />} />

        {/* Protected Routes */}
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/shifts" element={<Shifts />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/logs" element={<RecognitionLogs />} />
          <Route path="/anomalies" element={<Anomalies />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;