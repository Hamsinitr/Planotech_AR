from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.config import settings
from app.database import engine, Base, SessionLocal
from app.models.user import User
from app.models.scoring_config import ScoringConfig
from app.utils.security import hash_password

# Routers
from app.routers import auth, upload, attendance, reports, productivity, employees, analytics, export, settings as settings_router, history

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Enterprise Employee Attendance, Report Submission, Report Quality & Productivity Analytics Platform",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Production-ready: can be restricted via settings.BACKEND_CORS_ORIGINS
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers under API prefix
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(upload.router, prefix=settings.API_V1_STR)
app.include_router(attendance.router, prefix=settings.API_V1_STR)
app.include_router(reports.router, prefix=settings.API_V1_STR)
app.include_router(productivity.router, prefix=settings.API_V1_STR)
app.include_router(employees.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)
app.include_router(export.router, prefix=settings.API_V1_STR)
app.include_router(settings_router.router, prefix=settings.API_V1_STR)
app.include_router(history.router, prefix=settings.API_V1_STR)

@app.on_event("startup")
def init_db_defaults():
    """Initializes default admin and viewer accounts and initial scoring weights."""
    db = SessionLocal()
    try:
        # Default Admin
        admin_user = db.query(User).filter(User.email == "admin@planotech.com").first()
        if not admin_user:
            admin_user = User(
                email="admin@planotech.com",
                hashed_password=hash_password("admin123"),
                full_name="Planotech Administrator",
                role="admin",
                is_active=True
            )
            db.add(admin_user)

        # Default Viewer
        viewer_user = db.query(User).filter(User.email == "viewer@planotech.com").first()
        if not viewer_user:
            viewer_user = User(
                email="viewer@planotech.com",
                hashed_password=hash_password("viewer123"),
                full_name="Planotech HR Analyst",
                role="viewer",
                is_active=True
            )
            db.add(viewer_user)

        # Default Scoring Configuration
        cfg = db.query(ScoringConfig).first()
        if not cfg:
            cfg = ScoringConfig(
                report_submission_weight=0.50,
                report_quality_weight=0.30,
                attendance_weight=0.20,
                excellent_score=100.0,
                good_score=75.0,
                average_score=50.0,
                poor_score=25.0,
                before_930_score=100.0,
                grace_score=80.0,
                after_945_score=40.0
            )
            db.add(cfg)

        db.commit()
    finally:
        db.close()

from fastapi.responses import FileResponse
from app.config import settings, BASE_DIR

frontend_dist = BASE_DIR.parent / "frontend" / "dist"
if (frontend_dist / "assets").exists():
    app.mount("/assets", StaticFiles(directory=str(frontend_dist / "assets")), name="assets")

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": settings.PROJECT_NAME}

@app.get("/favicon.svg")
def favicon():
    fav_path = frontend_dist / "favicon.svg"
    if fav_path.exists():
        return FileResponse(str(fav_path))
    return {"status": "ok"}

@app.get("/")
def root():
    index_file = frontend_dist / "index.html"
    if index_file.exists():
        return FileResponse(str(index_file))
    return {
        "message": "Welcome to Planotech HR Analytics API",
        "documentation": "/api/docs",
        "health": "/health"
    }

@app.get("/{full_path:path}")
def serve_spa(full_path: str):
    if full_path.startswith("api") or full_path.startswith("health"):
        return {"detail": "Not Found"}
    index_file = frontend_dist / "index.html"
    if index_file.exists():
        file_candidate = frontend_dist / full_path
        if file_candidate.is_file():
            return FileResponse(str(file_candidate))
        return FileResponse(str(index_file))
    return {"detail": "Not Found"}

