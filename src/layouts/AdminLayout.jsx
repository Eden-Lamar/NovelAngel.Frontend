import { Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
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
import BuyCoins from "../components/shared/BuyCoins";
import MobileRestricted from "../components/shared/MobileRestricted"  


import "../components/admin/admin.css"

const AdminLayout = () => {
	const [openSidebarToggle, setOpenSidebarToggle] = useState(false);
	const [isMobile, setIsMobile] = useState(false); // State to track screen size

	// Effect to check screen size on load and resize
  useEffect(() => {
    const checkScreenSize = () => {
      // 1024px covers tablets and mobiles. 
      // If you want to allow tablets (iPad), change this to 768.
      setIsMobile(window.innerWidth < 1024); 
    };

    // Check initially
    checkScreenSize();

    // Add listener
    window.addEventListener('resize', checkScreenSize);

    // Cleanup
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

	const OpenSidebar = ()=>{
		setOpenSidebarToggle(!openSidebarToggle)
	}

	// Conditionally render the restricted page
  if (isMobile) {
    return <MobileRestricted />;
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
				<Route path="buy-coins" element={<BuyCoins />} />
				</Routes>
			</div>
		</div>
	);
}

export default AdminLayout;
