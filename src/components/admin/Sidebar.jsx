import { Link } from "react-router-dom";
import {BsPerson} from "react-icons/bs"
import { MdOutlineSpaceDashboard, MdCancel, MdOutlineCreateNewFolder } from "react-icons/md";
import { PiBooksDuotone, PiCoins } from "react-icons/pi";
import logo from "../../assets/logo.png";


function Sidebar({openSidebarToggle, OpenSidebar}) {
  return (
	<aside id="sidebar" className={openSidebarToggle ? "sidebar-responsive" : ""}>
		<div className="sidebar-title flex justify-between md:justify-center p-3">
			<div className="flex items-center">
				<img src={logo} alt="Site Logo" className="h-10 w-auto" />
				<h1 className="ml-3 text-2xl font-bold font-vibes text-transparent bg-clip-text bg-gradient-to-r from-gold to-cyan-500">Novel Angel</h1>
			</div>
			<span onClick={OpenSidebar} className="text-2xl py-1 cursor-pointer text-[#9e9ea4]"><MdCancel /></span>
		</div>

		<ul className="sidebar-list">
			<li className="sidebar-list-item px-4 py-5 text-lg">
				<Link to="/admin" className="flex items-center gap-1">
					<MdOutlineSpaceDashboard className="text-2xl"/> Dashboard
				</Link>
			</li>
			<li className="sidebar-list-item px-4 py-5 text-lg">
				<Link to="/admin/create-book" className="flex items-center gap-1">
					<MdOutlineCreateNewFolder className="text-2xl"/> Create Book
				</Link>
			</li>
			<li className="sidebar-list-item px-4 py-5 text-lg">
				<Link to="/admin/books" className="flex items-center gap-1">
					<PiBooksDuotone className="text-2xl"/> Books
				</Link>
			</li>
			<li className="sidebar-list-item px-4 py-5 text-lg">
				<Link to="/admin/profile" className="flex items-center gap-1">
					<BsPerson className="text-2xl"/> Profile
				</Link>
			</li>

			{/* <li className="sidebar-list-item px-4 py-5 text-lg">
				<Link to="" className="flex items-center gap-1">
					<BsListCheck className=""/> Inventory
				</Link>
			</li>
			<li className="sidebar-list-item px-4 py-5 text-lg">
				<Link to="" className="flex items-center gap-1">
					<BsMenuButtonWideFill className="icon"/> Report
				</Link>
			</li> */}

			<li className="sidebar-list-item px-4 py-5 text-lg">
				<Link to="/admin/buy-coins" className="flex items-center gap-1">
					<PiCoins className="text-2xl"/> Buy Coins
				</Link>
			</li>
		</ul>

	</aside>
  )
}

export default Sidebar

Sidebar.propTypes = false