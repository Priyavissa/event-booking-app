import { useEffect, useState, useCallback } from "react";
import axios from "axios";

function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const token = localStorage.getItem("token");

  // Fetch bookings (useCallback to avoid warning)
  const fetchBookings = useCallback(async () => {
    try {
      const res = await axios.get(
        "http://localhost:8000/my-bookings",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setBookings(res.data);
    } catch (err) {
      console.log(err);
    }
  }, [token]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Cancel booking
  const handleCancel = async (id) => {
    try {
      await axios.post(
        `http://localhost:8000/bookings/${id}/cancel`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Booking cancelled");
      fetchBookings(); // refresh
    } catch (err) {
      console.log(err.response?.data);
      alert("Cancel failed");
    }
  };

  return (
    <div style={{ textAlign: "center" }}>
      <h2>My Bookings</h2>

      {bookings.length === 0 && <p>No bookings</p>}

      {bookings.map((b) => (
        <div
          key={b.id}
          style={{
            border: "1px solid gray",
            margin: "10px",
            padding: "10px",
          }}
        >
          <p><b>Booking ID:</b> {b.id}</p>
          <p><b>Event ID:</b> {b.event_id}</p>
          <p><b>Tickets:</b> {b.tickets_booked}</p>
          <p><b>Status:</b> {b.status}</p>

          {b.status !== "cancelled" && (
            <button onClick={() => handleCancel(b.id)}>
              Cancel Booking
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export default MyBookings;