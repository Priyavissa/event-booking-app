import { useEffect, useState, useCallback } from "react";
import axios from "axios";

function AdminDashboard() {
  const [eventsData, setEventsData] = useState([]);
  const [revenue, setRevenue] = useState(null);

  const token = localStorage.getItem("token");

  // Events analytics
  const fetchEventsAnalytics = useCallback(async () => {
    try {
      const res = await axios.get(
        "http://localhost:8000/admin/analytics/events",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setEventsData(res.data);
    } catch (err) {
      console.log(err);
    }
  }, [token]);

  // Revenue
  const fetchRevenue = useCallback(async () => {
    try {
      const res = await axios.get(
        "http://localhost:8000/admin/analytics/revenue",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setRevenue(res.data);
    } catch (err) {
      console.log(err);
    }
  }, [token]);

  useEffect(() => {
    fetchEventsAnalytics();
    fetchRevenue();
  }, [fetchEventsAnalytics, fetchRevenue]);

  return (
    <div style={{ textAlign: "center" }}>
      <h2>Admin Dashboard</h2>

      {revenue && (
        <div>
          <h3>Revenue</h3>
          <p>Tickets Sold: {revenue.total_tickets_sold}</p>
          <p>Total Revenue: ₹{revenue.total_revenue}</p>
        </div>
      )}

      <hr />

      <h3>Event Analytics</h3>

      {eventsData.map((e) => (
        <div key={e.event_id} style={{ border: "1px solid gray", margin: "10px", padding: "10px" }}>
          <p>{e.event_name}</p>
          <p>Tickets Booked: {e.tickets_booked}</p>
        </div>
      ))}
    </div>
  );
}

export default AdminDashboard;