from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
import models
from routers import users, twilio, stripe_payments
from scheduler import start_scheduler
from contextlib import asynccontextmanager
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware
import os

if not os.path.exists("uploads"):
    os.makedirs("uploads")

@asynccontextmanager
async def lifespan(app: FastAPI):
    start_scheduler()
    yield

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AreYouOkay SMS Check-In API", 
    lifespan=lifespan,
    docs_url="/docs",
    openapi_url="/openapi.json"
)

allowed_origins = os.getenv("ALLOWED_ORIGINS", "").split(",")
origins = [
    "http://localhost:8080",
    "http://localhost:5173",
    "http://127.0.0.1:8080",
    "http://127.0.0.1:5173",
]
if allowed_origins:
    origins.extend([o.strip() for o in allowed_origins if o.strip()])

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    SessionMiddleware, 
    secret_key=os.environ.get("SESSION_SECRET", "areyouokay-super-secret-session-key"),
    same_site="lax",
    https_only=False
)

# Group routers (prefix removed because DigitalOcean handles /api routing)
api_router = APIRouter()
api_router.include_router(users.router)
api_router.include_router(twilio.router)
api_router.include_router(stripe_payments.router)

@api_router.get("/")
def read_root():
    return {"status": "ok", "message": "AreYouOkay API Backend Running"}

app.include_router(api_router)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
