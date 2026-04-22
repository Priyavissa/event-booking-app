import { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

function EventDetails() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [tickets, setTickets] = useState(1);

  // Fetch event details
  useEffect(() => {
    axios.get(`http://localhost:8000/events/${id}`)
      .then(res => setEvent(res.data))
      .catch(err => console.log(err));
  }, [id]);

  // PAYMENT FLOW (IMPORTANT)
  const handlePayment = async () => {
    try {
      const token = localStorage.getItem("token");
      const ticketCount = Number(tickets);

      if (ticketCount <= 0) {
        alert("Enter valid tickets ❌");
        return;
      }

      if (ticketCount > event.available_tickets) {
        alert("Not enough tickets ❌");
        return;
      }

      // Create booking
      await axios.post(
        "http://localhost:8000/bookings",
        {
          event_id: Number(id),
          tickets: ticketCount,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Get latest booking
      const bookingsRes = await axios.get(
        "http://localhost:8000/bookings",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const bookings = bookingsRes.data;

      if (!bookings.length) {
        alert("No bookings found ❌");
        return;
      }

      const latestBooking = bookings[bookings.length - 1];
      const bookingId = latestBooking.id;

      // Create payment session
      const paymentRes = await axios.post(
        `http://localhost:8000/payments/create-session?booking_id=${bookingId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Redirect to payment
      window.location.href = paymentRes.data.payment_url;

    } catch (err) {
      console.log(err.response?.data || err);
      alert(JSON.stringify(err.response?.data));
    }
  };

  if (!event) return <p>Loading...</p>;

  return (
    <div style={{ textAlign: "center" }}>
      <h2>{event.title}</h2>
      <p>{event.description}</p>

      <p>Total Tickets: {event.total_tickets}</p>
      <p>Available Tickets: {event.available_tickets}</p>

      <input
        type="number"
        min="1"
        value={tickets}
        onChange={(e) => setTickets(e.target.value)}
        style={{ margin: "10px" }}
      />

      <br />

      <button onClick={handlePayment}>
        Proceed to Payment
      </button>
    </div>
  );
}

export default EventDetails;