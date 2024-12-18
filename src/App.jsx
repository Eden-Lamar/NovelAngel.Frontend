import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AdminLayout from "./layouts/AdminLayout"
import AdminLogin from "./features/Admin/AdminLogin"
import AdminRegister from "./features/Admin/AdminRegister"


function App() {

  return (
    <>
     <Router>
        <Routes>
            {/* Public routes */}
            <Route path="/login" element={<AdminLogin />} />
            <Route path="/register" element={<AdminRegister />} />

            {/* Admin routes */}
            <Route path="/admin/*" element={<AdminLayout />} />

            {/* Redirect any unmatched route */}
            <Route path="*" element={<AdminLogin />} />
        </Routes>
      </Router>
    </>
  )
}

export default App
