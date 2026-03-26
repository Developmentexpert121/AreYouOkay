from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
import models
from routers import users, twilio, stripe_payments
from scheduler import start_scheduler
from contextlib import asynccontextmanager
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
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
    title="r u good? SMS Check-In API", 
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
    secret_key=os.environ.get("SESSION_SECRET", "rugood-super-secret-key"),
    same_site="lax",
    https_only=False  # Keep False if behind a proxy that terminates SSL, but allow for state to persist
)

# Group routers (prefix removed because DigitalOcean handles /api routing)
api_router = APIRouter()
api_router.include_router(users.router)
api_router.include_router(twilio.router)
api_router.include_router(stripe_payments.router)

@api_router.get("/")
def read_root():
    return {"status": "ok", "message": "r u good? API Backend Running"}

app.include_router(api_router)

# Mount React static files
# Assume react/dist is at the same level as the python folder
frontend_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "react", "dist")

if os.path.exists(frontend_dir):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dir, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_react_app(full_path: str):
        # If the path looks like a static file (e.g. has an extension), 
        # let standard mounting handle it or return 404 if not found.
        # Otherwise, return index.html for React Router to handle.
        file_path = os.path.join(frontend_dir, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dir, "index.html"))
else:
    print(f"Warning: Frontend directory {frontend_dir} not found. Static serving disabled.")

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
