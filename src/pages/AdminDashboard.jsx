import {BsPeopleFill } from "react-icons/bs"
import { ImBooks } from "react-icons/im";
import { GrInProgress } from "react-icons/gr";
import { IoCheckmarkDoneCircle } from "react-icons/io5"


function AdminDashboard() {
  return (
	<main className="main-container">
    <div className="main-title text-xl font-bold">
      <h3>DASHBOARD</h3>
    </div>

    <div className='main-cards'>
            <div className='card p-4 bg-blue-800'>
                <div className='flex justify-between items-center text-2xl'>
                    <h3 className="text-lg font-semibold">BOOKS</h3>
                    <ImBooks className='card_icon'/>
                </div>
                <h1 className="mt-8 text-3xl font-bold">300</h1>
            </div>

            <div className='card p-4 bg-yellow-600'>
                <div className='flex justify-between items-center text-xl'>
                    <h3 className="text-lg font-semibold">ONGOING</h3>
                    <GrInProgress className='card_icon'/>
                </div>
                <h1 className="mt-8 text-3xl font-bold">12</h1>
            </div>

            <div className='card p-4 bg-green-700'>
                <div className='flex justify-between items-center text-2xl'>
                    <h3 className="text-lg font-semibold">COMPLETED</h3>
                    <IoCheckmarkDoneCircle className='card_icon'/>
                </div>
                <h1 className="mt-8 text-3xl font-bold">42</h1>
            </div>

            <div className='card p-4 bg-rose-800'>
                <div className='flex justify-between items-center text-2xl'>
                    <h3 className="text-lg font-semibold">CUSTOMERS</h3>
                    <BsPeopleFill className='card_icon'/>
                </div>
                <h1 className="mt-8 text-3xl font-bold">33</h1>
            </div>

        </div>
  </main>
  )
}

export default AdminDashboard