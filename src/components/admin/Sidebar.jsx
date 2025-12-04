import { NavLink } from "react-router-dom";
import {BsPerson} from "react-icons/bs"
import { MdOutlineSpaceDashboard, MdCancel, MdOutlineCreateNewFolder, MdLogout } from "react-icons/md";
import { PiBooksDuotone, PiCoins } from "react-icons/pi";
import logo from "/assets/logo.png";
import { useAuth } from "../../context/AuthContext";


function Sidebar({openSidebarToggle, OpenSidebar}) {
	const { logout } = useAuth();

	const handleLogout = () => {
    logout(); // this will clear auth, remove token, and redirect to /login
  };

	const linkClasses = ({ isActive }) =>
    `flex items-center gap-1 px-4 py-5 text-lg transition-colors ${
      isActive
        ? "text-gold font-semibold bg-[#1e1e2f] border-l-4 border-gold" // active style
        : "text-gray-300 hover:text-gold"
    }`;

  return (
	<aside id="sidebar" className={openSidebarToggle ? "sidebar-responsive" : ""}>
		<div className="sidebar-title flex justify-between md:justify-center p-3">
			<div className="flex items-center">
				<img src={logo} alt="Site Logo" className="h-10 w-auto" />
				<h1 className="ml-3 text-2xl pr-1 font-bold font-vibes text-transparent bg-clip-text bg-gradient-to-r from-gold to-cyan-500">Novel Angel</h1>
			</div>
			<span onClick={OpenSidebar} className="text-2xl py-1 cursor-pointer text-[#9e9ea4]"><MdCancel /></span>
		</div>

		<ul className="sidebar-list">
			<li className="sidebar-list-item">
				<NavLink to="/admin" end className={linkClasses}>
					<MdOutlineSpaceDashboard className="text-2xl"/> Dashboard
				</NavLink>
			</li>
			<li className="sidebar-list-item">
				<NavLink to="/admin/create-book" className={linkClasses}>
					<MdOutlineCreateNewFolder className="text-2xl"/> Create Book
				</NavLink>
			</li>
			<li className="sidebar-list-item">
				<NavLink to="/admin/books" className={linkClasses}>
					<PiBooksDuotone className="text-2xl"/> Books
				</NavLink>
			</li>
			<li className="sidebar-list-item">
				<NavLink to="/admin/profile" className={linkClasses}>
					<BsPerson className="text-2xl"/> Profile
				</NavLink>
			</li>

			{/* <li className="sidebar-list-item">
				<NavLink to="" className={linkClasses}>
					<BsListCheck className=""/> Inventory
				</NavLink>
			</li>
			<li className="sidebar-list-item">
				<NavLink to="" className={linkClasses}>
					<BsMenuButtonWideFill className="icon"/> Report
				</NavLink>
			</li> */}

			<li className="hidden sidebar-list-item">
				<NavLink to="/admin/buy-coins" className={linkClasses}>
					<PiCoins className="text-2xl"/> Buy Coins
				</NavLink>
			</li>

			<li
				onClick={handleLogout}
				className="hover:bg-red-500/20 px-4 py-5 text-lg cursor-pointer text-red-400 hover:text-red-600 flex items-center gap-1"
			>
          <MdLogout className="text-2xl" /> Sign Out
			</li>
		</ul>

	</aside>
  )
}

export default Sidebar

Sidebar.propTypes = false