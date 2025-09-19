import { Routes, Route } from "react-router-dom";
import { useState } from "react";
import AdminHeader from "../components/admin/AdminHeader";
import Sidebar from "../components/admin/Sidebar";
import AdminDashboard from "../pages/AdminDashboard";
import Profile from "../pages/admin/Profile";
import Books from "../components/admin/Books";
import BookReader from '../components/admin/BookReader';
import BookDetails from "../components/admin/BookDetails";
import CreateBook from "../features/Admin/CreateBook";  // Import CreateBook page
import AddChapter from "../features/Admin/AddChapter";  
import EditBook from "../features/Admin/EditBook";  


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
				<Route path="add-chapter/:bookId" element={<AddChapter />} />
				<Route path="books" element={<Books />} />
				<Route path="books/:id" element={<BookDetails />} />
				<Route path="books/:bookId/read" element={<BookReader />} />
				<Route path="profile" element={<Profile />} />
				<Route path="books/:bookId/edit" element={<EditBook />} />
				</Routes>
			</div>
		</div>
	);
}

export default AdminLayout;
