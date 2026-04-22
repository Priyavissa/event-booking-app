import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "../App.css";

function UserEvents() {
  const [events, setEvents] = useState([]);
  const navigate = useNavigate();

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

  return (
    <div className="container">
      <h2>Events</h2>

      {events.length === 0 ? (
        <p>No events available</p>
      ) : (
        events.map((e) => (
          <div
            key={e._id || e.id}
            onClick={() => navigate(`/events/${e._id || e.id}`)}
            style={{
              cursor: "pointer",
              border: "1px solid #ccc",
              margin: "10px",
              padding: "10px",
            }}
          >
            <h4>{e.title}</h4>
            <p>{e.description}</p>
            <p>Date: {e.date}</p>
            <p>Available: {e.available_tickets}</p>
          </div>
        ))
      )}
    </div>
  );
}

export default UserEvents;