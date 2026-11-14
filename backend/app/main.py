
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes.prediction import router as prediction_router
from .routes.analytics import router as analytics_router
from .routes.admin_auth import router as admin_auth_router
from .routes.activity import router as activity_router

app = FastAPI(
    title="GrievanceAI API",
    description="AI-powered citizen grievance classification and routing system",
    version="1.0.0"
)

# Allow the local Next.js app to call the API from a browser.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["GET", "POST", "PATCH"],
    allow_headers=["Content-Type"],
    allow_credentials=True,
)


@app.get("/")
def home():
    return {
        "message": "Welcome to GrievanceAI API",
        "status": "Running"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }


app.include_router(prediction_router)
app.include_router(analytics_router)
app.include_router(admin_auth_router)
app.include_router(activity_router)
