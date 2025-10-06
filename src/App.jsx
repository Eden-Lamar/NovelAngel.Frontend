import { Routes, Route } from "react-router-dom";
import AdminLayout from "./layouts/AdminLayout"
import AdminLogin from "./features/Admin/AdminLogin"
import AdminRegister from "./features/Admin/AdminRegister"
import ProtectedRoute from "./components/admin/ProtectedRoute";
import PaymentSuccess from "./components/shared/PaymentSuccess";


function App() {

  return (
    <>
        <Routes>
            {/* Public routes */}
            <Route path="/login" element={<AdminLogin />} />
            <Route path="/register" element={<AdminRegister />} />

            {/* Standalone route for a successful payment */}
            <Route path="/payment/success" element={<PaymentSuccess />} />

            {/* Admin routes */}
            <Route path="/admin/*" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>} />

            {/* Redirect any unmatched route */}
            <Route path="*" element={<AdminLogin />} />
        </Routes>
    </>
  )
}


export default App
