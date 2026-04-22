import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "../App.css";

function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const handleLogin = async () => {
    try {
      // Login
      const res = await API.post("/auth/login", form);

      const token = res.data.access_token;
      localStorage.setItem("token", token);

      // Get user details (role)
      const userRes = await API.get("/auth/me");

      const role = userRes.data.role;
      localStorage.setItem("role", role);

      alert("Login Successful");

      // Role-based redirect
      if (role === "admin") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }

    } catch (error) {
      console.log(error.response?.data || error);
      alert("Invalid credentials");
    }
  };

  return (
    <div className="container">
      <h2>Login</h2>

      <input
        type="email"
        placeholder="Email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />

      <input
        type="password"
        placeholder="Password"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
      />

      <button onClick={handleLogin}>Login</button>
    </div>
  );
}

export default Login;