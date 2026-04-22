from pydantic import BaseModel

# User
class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: str

class UserLogin(BaseModel):
    email: str
    password: str

# Event
class EventCreate(BaseModel):
    title: str
    description: str
    date: str
    total_tickets: int       

# Booking
class BookingCreate(BaseModel):
    event_id: int
    tickets: int     