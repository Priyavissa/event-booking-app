import { useState } from "react";
import API from "../services/api";
import "../App.css";

function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
  });

  const handleRegister = async () => {
    if (!form.role) {
      alert("Please select a role");
      return;
    }

    try {
      await API.post("/auth/register", form);
      alert("Registered Successfully");
    } catch (error) {
      console.log(error.response?.data || error);
      alert("Error in registration");
    }
  };

  return (
    <div className="container">
      <h2>Register</h2>

      <input
        type="text"
        placeholder="Name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />

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

      {/* Role Dropdown */}
      <select
        value={form.role}
        onChange={(e) => setForm({ ...form, role: e.target.value })}
      >
        <option value="">Select Role</option>
        <option value="user">User</option>
        <option value="admin">Admin</option>
      </select>

      <br /><br />

      <button onClick={handleRegister}>Register</button>
    </div>
  );
}

export default Register;