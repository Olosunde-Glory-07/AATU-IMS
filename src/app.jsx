import { BrowserRouter, Routes, Route } from "react-router-dom";

import AdminLayout from "./layouts/AdminLayout";
import Dashboard from "./pages/Dashboard";
import Requests from "./pages/Requests";
import Users from "./pages/Users";
import Assets from "./pages/Assets";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AdminLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/requests" element={<Requests />} />
          <Route path="/users" element={<Users />} />
          <Route path="/assets" element={<Assets />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}