import { useEffect, useState } from "react";
import API from "../services/api";
import "../App.css";

function AdminEvents() {
  const [events, setEvents] = useState([]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    total_tickets: "",
    available_tickets: "",
  });

  // Fetch events
  const fetchEvents = async () => {
    try {
      const res = await API.get("/events");
      setEvents(res.data.events || res.data);
    } catch (error) {
      console.log(error);
      alert("Error fetching events");
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Create event
  const handleCreate = async () => {
    try {
      await API.post("/events", {
        ...form,
        total_tickets: Number(form.total_tickets),
        available_tickets: Number(form.available_tickets),
      });

      alert("Event created");

      setForm({
        title: "",
        description: "",
        date: "",
        total_tickets: "",
        available_tickets: "",
      });

      fetchEvents();
    } catch (error) {
      console.log(error.response?.data);
      alert(JSON.stringify(error.response?.data));
    }
  };

  // Delete event
  const handleDelete = async (id) => {
    try {
      await API.delete(`/events/${id}`);
      alert("Event deleted");
      fetchEvents();
    } catch (error) {
      console.log(error);
      alert("Error deleting event");
    }
  };

  return (
    <div className="container">
      <h2>Admin Events</h2>

      <input
        type="text"
        placeholder="Title"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
      />

      <input
        type="text"
        placeholder="Description"
        value={form.description}
        onChange={(e) =>
          setForm({ ...form, description: e.target.value })
        }
      />

      <input
        type="date"
        value={form.date}
        onChange={(e) => setForm({ ...form, date: e.target.value })}
      />

      <input
        type="number"
        placeholder="Total Tickets"
        value={form.total_tickets}
        onChange={(e) =>
          setForm({ ...form, total_tickets: e.target.value })
        }
      />

      <input
        type="number"
        placeholder="Available Tickets"
        value={form.available_tickets}
        onChange={(e) =>
          setForm({ ...form, available_tickets: e.target.value })
        }
      />

      <button onClick={handleCreate}>Create Event</button>

      <hr />

      {events.map((e) => (
        <div key={e._id || e.id}>
          <h4>{e.title}</h4>
          <p>{e.description}</p>
          <p>Date: {e.date}</p>
          <p>Total: {e.total_tickets}</p>
          <p>Available: {e.available_tickets}</p>

          <button onClick={() => handleDelete(e._id || e.id)}>
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}

export default AdminEvents;