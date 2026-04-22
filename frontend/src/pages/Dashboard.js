import { useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="container">
      <h2>Dashboard</h2>

      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}

export default Dashboard;