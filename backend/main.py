from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func 

from database import engine, Base, SessionLocal
from models import User, Event, Booking
from schemas import UserCreate, UserLogin, EventCreate, BookingCreate
from auth import hash_password, verify_password, create_access_token, decode_access_token

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# create tables
Base.metadata.create_all(bind=engine)

# DB dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# OAuth2 (for Swagger Authorize button)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# get current user
def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    payload = decode_access_token(token)

    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid token")

    email = payload.get("sub")

    user = db.query(User).filter(User.email == email).first()

    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    return user

def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


# Roots
@app.get("/")
def root():
    return {"message": "Backend running successfully"}


# Register
@app.post("/auth/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_pw = hash_password(user.password)

    new_user = User(
        name=user.name,
        email=user.email,
        password=hashed_pw,
        role=user.role
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "User registered successfully"}


# Login
@app.post("/auth/login")
def login(user: UserLogin, db: Session = Depends(get_db)):

    db_user = db.query(User).filter(User.email == user.email).first()
    
    if not db_user:
        raise HTTPException(status_code=400, detail="Invalid email")

    if not verify_password(user.password, db_user.password):
        raise HTTPException(status_code=400, detail="Invalid password")

    token = create_access_token({"sub": db_user.email})

    return {
        "access_token": token,
        "token_type": "bearer"
    }


# Current user
@app.get("/auth/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role
    }

# Create event (admin only)
@app.post("/events")
def create_event(
    event: EventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    new_event = Event(
        title=event.title,
        description=event.description,
        date=event.date,
        total_tickets=event.total_tickets,
        available_tickets=event.total_tickets
    )

    db.add(new_event)
    db.commit()
    db.refresh(new_event)

    return {"message": "Event created successfully"}

@app.get("/events")
def get_events(db: Session = Depends(get_db)):
    events = db.query(Event).all()
    return events

@app.get("/events/{event_id}")
def get_event(event_id: int, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == event_id).first()

    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    return event

# Update event
@app.put("/events/{event_id}")
def update_event(
    event_id: int,
    event: EventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    db_event = db.query(Event).filter(Event.id == event_id).first()

    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")

    db_event.title = event.title
    db_event.description = event.description
    db_event.date = event.date
    db_event.total_tickets = event.total_tickets
    db_event.available_tickets = event.total_tickets

    db.commit()

    return {"message": "Event updated successfully"}

# Delete event
@app.delete("/events/{event_id}")
def delete_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    db_event = db.query(Event).filter(Event.id == event_id).first()

    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")

    db.delete(db_event)
    db.commit()

    return {"message": "Event deleted successfully"}

@app.post("/bookings")
def create_booking(
    booking: BookingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # get event
    event = db.query(Event).filter(Event.id == booking.event_id).first()

    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # check tickets available
    if event.available_tickets < booking.tickets:
        raise HTTPException(status_code=400, detail="Not enough tickets available")

    # create booking
    new_booking = Booking(
        user_id=current_user.id,
        event_id=booking.event_id,
        tickets_booked=booking.tickets
    )

    # reduce available tickets
    event.available_tickets -= booking.tickets

    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)

    return {"message": "Booking successful"}

@app.get("/bookings")
def get_bookings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    bookings = db.query(Booking).filter(Booking.user_id == current_user.id).all()
    return bookings

@app.get("/bookings/{booking_id}")
def get_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    # security check
    if booking.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    return booking

@app.post("/payments/create-session")
def create_payment_session(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # simulate session
    return {
        "message": "Payment session created",
        "booking_id": booking.id,
        "payment_url": f"http://fake-payment.com/pay/{booking.id}"
    }

@app.post("/payments/webhook")
def payment_webhook(
    booking_id: int,
    status: str,
    db: Session = Depends(get_db)
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if status == "success":
        booking.status = "confirmed"
    else:
        booking.status = "failed"

    db.commit()
    db.refresh(booking)

    return {
        "message": "Webhook processed",
        "booking_id": booking.id,
        "status": booking.status
    }

@app.get("/my-bookings")
def get_my_bookings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    bookings = db.query(Booking).filter(Booking.user_id == current_user.id).all()
    return bookings

@app.post("/bookings/{booking_id}/cancel")
def cancel_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    if booking.status == "cancelled":
        return {"message": "Already cancelled"}

    # tickets return to event
    event = db.query(Event).filter(Event.id == booking.event_id).first()
    event.available_tickets += booking.tickets_booked

    # update status
    booking.status = "cancelled"

    db.commit()
    db.refresh(booking)

    return {"message": "Booking cancelled successfully"}   

@app.get("/admin/analytics/events")
def event_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    events = db.query(Event).all()
    result = []

    for event in events:
        total_booked = db.query(func.sum(Booking.tickets_booked)).filter(
            Booking.event_id == event.id,
            Booking.status == "confirmed"
        ).scalar()

        result.append({
            "event_id": event.id,
            "event_name": event.title,
            "tickets_booked": total_booked or 0
        })

    return result


@app.get("/admin/analytics/revenue")
def revenue_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    total_tickets = db.query(func.sum(Booking.tickets_booked)).filter(
        Booking.status == "confirmed"
    ).scalar()

    total_revenue = (total_tickets or 0) * 100

    return {
        "total_tickets_sold": total_tickets or 0,
        "total_revenue": total_revenue
    } 

@app.get("/notifications")
def get_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    bookings = db.query(Booking).filter(Booking.user_id == current_user.id).all()

    notifications = []

    for b in bookings:
        if b.status == "confirmed":
            msg = f"Booking {b.id} confirmed"
        elif b.status == "cancelled":
            msg = f"Booking {b.id} cancelled"
        else:
            msg = f"Booking {b.id} pending"

        notifications.append({
            "booking_id": b.id,
            "message": msg
        })

    return notifications