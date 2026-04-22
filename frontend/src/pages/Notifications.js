import { useEffect, useState, useCallback } from "react";
import axios from "axios";

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const token = localStorage.getItem("token");

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await axios.get(
        "http://localhost:8000/notifications",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setNotifications(res.data);
    } catch (err) {
      console.log(err.response?.data);
    }
  }, [token]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return (
    <div style={{ textAlign: "center" }}>
      <h2>Notifications</h2>

      {notifications.length === 0 && <p>No notifications</p>}

      {notifications.map((n, index) => (
        <div
          key={index}
          style={{
            border: "1px solid gray",
            margin: "10px",
            padding: "10px",
          }}
        >
          <p>{n.message}</p>
        </div>
      ))}
    </div>
  );
}

export default Notifications;