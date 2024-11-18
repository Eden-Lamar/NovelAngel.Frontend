import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { FaRegEyeSlash, FaRegEye  } from "react-icons/fa";
import { useState } from "react";




const registerSchema = yup.object().shape({
	username: yup.string().required("Username is required").min(3, "Too Short!").max(20, "Too Long!"),
	email: yup.string().email("Invalid email").required("Email is required"),
	password: yup
		.string()
		.required("Password is required")
		.min(6, "Password must be at least 6 characters long"),
	role: yup
		.string()
		.required("Please enter role"),
});


const AdminRegister = () => {
	const { register, handleSubmit, formState: { errors } } = useForm({
		resolver: yupResolver(registerSchema),
	});

	const [showPassword, setShowPassword] = useState(false);

	const onSubmit = (data) => {
		console.log("Registration data:", data);
		// Call the API to register an admin
	};


	return (
		<div className="relative h-screen bg-admin-register-img bg-cover bg-center md:bg-contain">
			<div className="absolute inset-0 bg-black opacity-80"></div>
				<div className="relative z-10 flex items-center justify-center h-full">
					<form onSubmit={handleSubmit(onSubmit)} className="backdrop-blur-sm bg-black/30 min-h-[70%] w-1/3 p-5 rounded-lg">
						<h1 className="text-white mb-4">Sign Up</h1>

						<div className="relative mb-4 flex items-center justify-center">
							<label htmlFor="username" className="absolute left-3 top-2 transition-all duration-200 ease-in-out transform text-zinc-500 pointer-events-none focus:p-1 font-semibold">Username</label>

							<input
								type="text"
								{...register("username")}
								className="w-full p-2 border rounded text-black outline-none bg-slate-200 pt-3"

								onFocus={(e) => e.target.previousSibling.classList.add('active')}
								onBlur={(e) => {
									if (!e.target.value) {
										e.target.previousSibling.classList.remove('active');
									}
								}}
							/>
							{errors.username && <p className="text-red-500">{errors.username.message}</p>}
						</div>
						
						<div className="relative mb-4 flex items-center justify-center">
							<label htmlFor="email" className="absolute left-3 top-2 transition-all duration-200 ease-in-out transform text-zinc-500 pointer-events-none focus:p-1 font-semibold">Email</label>

							<input
								type="text"
								{...register("email")}
								className="w-full p-2 border rounded text-black outline-none bg-slate-200 pt-3"

								onFocus={(e) => e.target.previousSibling.classList.add('active')}
								onBlur={(e) => {
									if (!e.target.value) {
										e.target.previousSibling.classList.remove('active');
									}
								}}
							/>
							{errors.email && <p className="text-red-500">{errors.email.message}</p>}
						</div>
						
						<div className="relative mb-4 flex items-center justify-center">
							<label htmlFor="password" className="absolute left-3 top-2 transition-all duration-200 ease-in-out transform text-zinc-500 pointer-events-none focus:p-1 font-semibold">Password</label>

							<input
								type={showPassword ? "text" : "password"}
								{...register("password")}
								className="w-full p-2 border rounded text-black outline-none bg-slate-200 pt-3"

								onFocus={(e) => e.target.previousSibling.classList.add('active')}
								onBlur={(e) => {
									if (!e.target.value) {
										e.target.previousSibling.classList.remove('active');
									}
								}}
							/>
							{/* Eye Icon */}
						<div className="absolute right-3 top-3 cursor-pointer text-black text-lg" onClick={() => setShowPassword(!showPassword)}>
							{showPassword ? <FaRegEye /> : <FaRegEyeSlash />}
						</div>
							{errors.password && <p className="text-red-500">{errors.username.message}</p>}
						</div>
							
						<div>
							<button className="btn btn-outline w-full btn-info">Sign Up</button>
						</div>

					</form>
				</div>
		</div>
	);
}

export default AdminRegister;
