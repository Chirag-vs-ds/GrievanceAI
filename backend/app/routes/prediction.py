
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..services.ml_service import predict_grievance
from ..services.grievance_service import save_grievance
from ..database.connection import get_db
from ..services.admin_auth import require_admin
from ..services.activity_service import log_activity
from ..services.admin_auth import settings
from ..database.models import ActivityLog

router = APIRouter(
    prefix="/api/grievances",
    tags=["Grievance Management"]
)


class GrievanceRequest(BaseModel):
    complaint: str = Field(
        ...,
        min_length=5,
        max_length=2000
    )


@router.post("/predict")
def predict(
    request: GrievanceRequest,
    db: Session = Depends(get_db)
):

    try:
        # Generate ML prediction
        prediction = predict_grievance(request.complaint)

        # Save complaint in MySQL
        grievance = save_grievance(
            db,
            request.complaint,
            prediction
        )

        return {
            "message": "Grievance submitted successfully",
            "grievance_id": grievance.grievance_id,
            "complaint": grievance.complaint_text,
            "predicted_category": grievance.category,
            "suggested_department": grievance.department,
            "priority": grievance.priority,
            "status": grievance.status,
            "manual_review_required": prediction["manual_review_required"],
            "top_predictions": prediction["top_predictions"],
            "created_at": grievance.created_at
        }

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        )

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to process grievance."
        )

from ..database.models import Grievance


@router.get("/{grievance_id}")
def track_grievance(
    grievance_id: str,
    db: Session = Depends(get_db)
):
    grievance = (
        db.query(Grievance)
        .filter(
            Grievance.grievance_id == grievance_id
        )
        .first()
    )

    if not grievance:
        raise HTTPException(
            status_code=404,
            detail="Grievance not found. Please check your grievance ID."
        )

    return {
        "message": "Grievance found successfully",
        "grievance_id": grievance.grievance_id,
        "complaint": grievance.complaint_text,
        "category": grievance.category,
        "department": grievance.department,
        "priority": grievance.priority,
        "status": grievance.status,
        "created_at": grievance.created_at,
        "updated_at": grievance.updated_at
    }

from typing import Optional
from pydantic import BaseModel
from fastapi import Query


# Request schema for updating grievance status
class StatusUpdateRequest(BaseModel):
    status: str


# GET: View all grievances with optional filters
@router.get("/", dependencies=[Depends(require_admin)])
def get_all_grievances(
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Grievance)

    if category:
        query = query.filter(Grievance.category == category)

    if status:
        query = query.filter(Grievance.status == status)

    grievances = query.order_by(
        Grievance.id.desc()
    ).all()

    return {
        "total": len(grievances),
        "grievances": [
            {
                "grievance_id": g.grievance_id,
                "complaint": g.complaint_text,
                "category": g.category,
                "department": g.department,
                "priority": g.priority,
                "status": g.status,
                "created_at": g.created_at
            }
            for g in grievances
        ]
    }


# PATCH: Update grievance status


@router.patch("/{grievance_id}/status", dependencies=[Depends(require_admin)])
def update_grievance_status(
    grievance_id: str,
    request: StatusUpdateRequest,
    db: Session = Depends(get_db)
):
    allowed_statuses = [
        "Pending",
        "In Progress",
        "Resolved"
    ]

    if request.status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail="Invalid status. Choose Pending, In Progress, or Resolved."
        )

    grievance = (
        db.query(Grievance)
        .filter(Grievance.grievance_id == grievance_id)
        .first()
    )

    if not grievance:
        raise HTTPException(
            status_code=404,
            detail="Grievance not found."
        )

    previous_status = grievance.status
    new_status = request.status

    try:
        grievance.status = new_status

        # Add the activity record using the same transaction.
        activity = ActivityLog(
            admin_username=settings()["username"],
            action_type="STATUS_UPDATE",
            grievance_id=grievance.grievance_id,
            previous_status=previous_status,
            new_status=new_status
        )

        db.add(activity)
        db.commit()
        db.refresh(grievance)

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Failed to update grievance and activity log."
        )

    return {
        "message": "Grievance status updated successfully",
        "grievance_id": grievance.grievance_id,
        "previous_status": previous_status,
        "new_status": grievance.status
    }
