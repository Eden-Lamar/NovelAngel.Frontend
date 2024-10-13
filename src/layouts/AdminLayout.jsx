import { useState } from "react";
import AdminHeader from "../components/admin/AdminHeader";
import Sidebar from "../components/admin/Sidebar";
import AdminDashboard from "../pages/AdminDashboard";
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
			<AdminDashboard />
		</div>
	);
}

export default AdminLayout;
