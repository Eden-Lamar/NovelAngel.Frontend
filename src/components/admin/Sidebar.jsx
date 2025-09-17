import { Link } from "react-router-dom";
import {BsGrid1X2Fill, BsFillGrid3X3GapFill, BsPeopleFill, BsFillGearFill} from "react-icons/bs"
import { MdCancel } from "react-icons/md";
import { ImBooks } from "react-icons/im";



function Sidebar({openSidebarToggle, OpenSidebar}) {
  return (
	<aside id="sidebar" className={openSidebarToggle ? "sidebar-responsive" : ""}>
		<div className="sidebar-title flex justify-between md:justify-center p-3">
			<div>
				<p className="font-serif text-blue-500 font-extrabold text-2xl">NA</p>
			</div>
			<span onClick={OpenSidebar} className="text-2xl py-1 cursor-pointer text-[#9e9ea4]"><MdCancel /></span>
		</div>

		<ul className="sidebar-list">
			<li className="sidebar-list-item px-4 py-5 text-lg">
				<Link to="/admin" className="flex items-center">
					<BsGrid1X2Fill className="icon"/> Dashboard
				</Link>
			</li>
			<li className="sidebar-list-item px-4 py-5 text-lg">
				<Link to="/admin/create-book" className="flex items-center">
					<ImBooks className="icon text-2xl"/> Create Book
				</Link>
			</li>
			<li className="sidebar-list-item px-4 py-5 text-lg">
				<Link to="/admin/books" className="flex items-center">
					<BsFillGrid3X3GapFill className="icon"/> Books
				</Link>
			</li>
			<li className="sidebar-list-item px-4 py-5 text-lg">
				<Link to="/admin/profile" className="flex items-center">
					<BsPeopleFill className="icon"/> Profile
				</Link>
			</li>

			{/* <li className="sidebar-list-item px-4 py-5 text-lg">
				<Link to="" className="flex items-center">
					<BsListCheck className="icon"/> Inventory
				</Link>
			</li>
			<li className="sidebar-list-item px-4 py-5 text-lg">
				<Link to="" className="flex items-center">
					<BsMenuButtonWideFill className="icon"/> Report
				</Link>
			</li> */}

			<li className="sidebar-list-item px-4 py-5 text-lg">
				<Link to="#" className="flex items-center">
					<BsFillGearFill className="icon"/> Settings
				</Link>
			</li>
		</ul>

	</aside>
  )
}

export default Sidebar

Sidebar.propTypes = false