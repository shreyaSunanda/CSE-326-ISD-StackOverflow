import React, { useState } from "react";
import toast from "react-hot-toast";
import axios from "../api/client";
import "./Auth.css";

const Auth = (props) => {
	const [isLogin, setIsLogin] = useState(true);
	const [formData, setFormData] = useState({
		name: "",
		email: "",
		password: "",
	});

	const handleChange = (e) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		try {
			if (isLogin) {
				const res = await axios.post("/api/auth/login", {
					email: formData.email,
					password: formData.password,
				});

				if (res.data.success) {
					localStorage.setItem("token", res.data.data.accessToken);

					const userData = {
						id: res.data.data.userId,
						username: res.data.data.username,
					};
					localStorage.setItem("user", JSON.stringify(userData));

					toast.success("Login Successful!");

					if (props.onLoginSuccess) {
						props.onLoginSuccess(userData);
					}
				}
			} else {
				const res = await axios.post("/api/auth/register", {
					username: formData.email.split("@")[0],
					email: formData.email,
					password: formData.password,
					displayName: formData.name,
				});

				if (res.data.success) {
					toast.success("Registration Successful! Please Login.");
					setIsLogin(true);
				}
			}
		} catch (err) {
			const errorMsg = err.response?.data?.message || "An error occurred. Please try again.";
			toast.error(errorMsg);
		}
	};

	return (
		<div className="auth-container">
			<div className="auth-card">
				<h2>{isLogin ? "Login to Stack Overflow" : "Create Account"}</h2>
				<form onSubmit={handleSubmit}>
					{!isLogin && (
						<div className="input-group">
							<label>Full Name</label>
							<input
								name="name"
								type="text"
								placeholder="Enter your name"
								onChange={handleChange}
								required
								minLength="2"
							/>
						</div>
					)}

					<div className="input-group">
						<label>Email Address</label>
						<input name="email" type="email" placeholder="example@mail.com" onChange={handleChange} required />
					</div>

					<div className="input-group">
						<label>Password</label>
						<input
							name="password"
							type="password"
							placeholder="Min 6 characters"
							onChange={handleChange}
							required
							minLength="6"
						/>
					</div>

					<button type="submit" className="auth-btn">
						{isLogin ? "Login" : "Register"}
					</button>
				</form>

				<div className="auth-toggle">
					<p>
						{isLogin ? "Don't have an account? " : "Already have an account? "}
						<span onClick={() => setIsLogin(!isLogin)} className="toggle-link">
							{isLogin ? "Register" : "Login"}
						</span>
					</p>
				</div>
			</div>
		</div>
	);
};

export default Auth;
