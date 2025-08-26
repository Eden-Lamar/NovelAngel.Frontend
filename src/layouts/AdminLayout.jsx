import { Routes, Route } from "react-router-dom";
import { useState } from "react";
import AdminHeader from "../components/admin/AdminHeader";
import Sidebar from "../components/admin/Sidebar";
import AdminDashboard from "../pages/AdminDashboard";
import CreateBook from "../features/Admin/CreateBook";  // Import CreateBook page
import AddChapter from "../features/Admin/AddChapter";  

import "../components/admin/admin.css"

const AdminLayout = () => {
	const [openSidebarToggle, setOpenSidebarToggle] = useState(false);

	const OpenSidebar = ()=>{
		setOpenSidebarToggle(!openSidebarToggle)
	}


	return (
		<div className="grid-container">
			<AdminHeader OpenSidebar={OpenSidebar} />
			<Sidebar openSidebarToggle={openSidebarToggle} OpenSidebar={OpenSidebar}/>
			<div className="main-container">
				<Routes>
				<Route path="/" element={<AdminDashboard />} />
				<Route path="create-book" element={<CreateBook />} />
				<Route path="add-chapter" element={<AddChapter />} />
				</Routes>
			</div>
		</div>
	);
}

export default AdminLayout;
