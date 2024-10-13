import {BsPersonCircle, BsSearch, BsJustify } from "react-icons/bs"
// height: 60px;
// display: flex;
// align-items: center;
// justify-content: space-between;
// padding: 0 30px 0 30px;
function AdminHeader({OpenSidebar}) {
  return (
	<header className="header h-14 flex items-center justify-between px-8">
		<div className="menu-icon ">
			<BsJustify className="icon text-2xl cursor-pointer text-[#9e9ea4]" onClick={OpenSidebar}/>
		</div>

		<div className="header-left">
			<BsSearch className="icon text-2xl text-[#9e9ea4]"/>
		</div>
		<div className="header-right">
			{/* <BsFillBellFill className="icon text-2xl"/> */}
			{/* <BsFillEnvelopeFill className="icon text-2xl"/> */}
			<BsPersonCircle className="icon text-3xl text-[#9e9ea4]"/>
		</div>
	</header>
  )	
}

export default AdminHeader

AdminHeader.propTypes = false