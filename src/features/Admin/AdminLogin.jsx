import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { FaRegEyeSlash, FaRegEye  } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import 'animate.css';
import { useAuth } from "../../context/AuthContext";




const loginSchema = yup.object().shape({
	email: yup.string().email("Invalid email").required("Email is required"),
	password: yup
		.string()
		.required("Password is required")
		.min(8, "Password must be at least 8 characters long"),
	// role: yup
	// 	.string()
	// 	.required("Please enter role"),
});

const AdminLogin = () => {
	// const navigate = useNavigate()
	const { login, authError, clearAuth } = useAuth();

	const { register, handleSubmit, formState: { errors } } = useForm({
		resolver: yupResolver(loginSchema),
	});

	const [showPassword, setShowPassword] = useState(false);
	const [loginError, setLoginError] = useState(null);
	const [loading, setLoading] = useState(false);




	const onSubmit = async (data) => {
		setLoading(true)
		setLoginError(null); // Clear previous errors

		try {
			const response = await api.post("/user/login", data);
			const token = response.headers["authorization"]?.split(" ")[1];

			console.log(response);
			// Extract token from response headers
			// console.log(`TOKEN ${token}`);

			if (token) {
			  login({ token }); // Save token in AuthContext and localStorage
			} else {
				setLoginError("Authentication failed. No token received.");
				// console.log(loginError);
			}
		} catch (error) {
			setLoginError(error.response?.data?.error || "Login failed. Please try again.");
			// console.log(loginError);
		}finally {
			setLoading(false); // Hide spinner
		}
	};


		// Run clearAuth only once when this component mounts
		useEffect(() => {
			clearAuth(); 
		}, [clearAuth]);

		// Handle login error timeout separately
		useEffect(() => {
			if (loginError) {
				const timer = setTimeout(() => setLoginError(null), 5000);
				return () => clearTimeout(timer);
			}
		}, [loginError]);

	return (
		<div className="relative h-screen bg-admin-login-img bg-cover bg-center md:bg-contain">


			<div className="absolute inset-0 bg-black opacity-80"></div>

			<div className={`absolute mt-3 w-full flex justify-center animate__animated  ${loginError || authError ? "block animate__fadeInDown" : "hidden"}`}>
				<div role="alert" className="alert alert-error w-1/2">
				<svg
					className="h-6 w-6 shrink-0 stroke-current"
					fill="none"
					viewBox="0 0 24 24">
					<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth="2"
					d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
				<span>{loginError || authError }</span>
				</div>
			</div>

				<div className="relative z-10 flex items-center justify-center h-full">
					<form onSubmit={handleSubmit(onSubmit)} className="backdrop-blur-sm bg-black/30 min-h-[50%] w-1/3 p-5 rounded-lg">
						<h1 className="text-white mb-4">Admin Login</h1>
						
						<div className="relative mb-4">
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
						
						<div className="relative mb-4">
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
							{errors.password && <p className="text-red-500">{errors.password.message}</p>}
						</div>
							
						<div>
						<button
							type="submit" // Ensure the button triggers the form submission
							className="btn btn-outline w-full btn-info"
							disabled={loading} // Disable the button while loading
						>
								<span className={loading ? "loading loading-spinner" : "hidden"}></span>
								Login
							</button>
						</div>

						<p className="mt-6 text-sm">Don&apos;t have an account? <Link to="/register" className="text-blue-500"> Sign up</Link> </p>
					</form>
				</div>
		</div>
	);
}

export default AdminLogin;
