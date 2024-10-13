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
				<a href="" className="flex items-center">
					<BsGrid1X2Fill className="icon"/> Dashboard
				</a>
			</li>
			<li className="sidebar-list-item px-4 py-5 text-lg">
				<a href="" className="flex items-center">
					<ImBooks className="icon text-2xl"/> Create Book
				</a>
			</li>
			<li className="sidebar-list-item px-4 py-5 text-lg">
				<a href="" className="flex items-center">
					<BsFillGrid3X3GapFill className="icon"/> Books
				</a>
			</li>
			<li className="sidebar-list-item px-4 py-5 text-lg">
				<a href="" className="flex items-center">
					<BsPeopleFill className="icon"/> Profile
				</a>
			</li>

			{/* <li className="sidebar-list-item px-4 py-5 text-lg">
				<a href="" className="flex items-center">
					<BsListCheck className="icon"/> Inventory
				</a>
			</li>
			<li className="sidebar-list-item px-4 py-5 text-lg">
				<a href="" className="flex items-center">
					<BsMenuButtonWideFill className="icon"/> Report
				</a>
			</li> */}

			<li className="sidebar-list-item px-4 py-5 text-lg">
				<a href="" className="flex items-center">
					<BsFillGearFill className="icon"/> Settings
				</a>
			</li>
		</ul>

	</aside>
  )
}

export default Sidebar

Sidebar.propTypes = false