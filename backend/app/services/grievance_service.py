
from datetime import datetime
from sqlalchemy.orm import Session

from backend.app.database.models import Grievance
from .priority_service import recommend_priority


def generate_grievance_id(db: Session):
    year = datetime.now().year
    prefix = f"GRV-{year}-"

    latest = (
        db.query(Grievance)
        .filter(Grievance.grievance_id.like(f"{prefix}%"))
        .order_by(Grievance.id.desc())
        .first()
    )

    if latest:
        last_number = int(latest.grievance_id.split("-")[-1])
        next_number = last_number + 1
    else:
        next_number = 1

    return f"{prefix}{next_number:04d}"


def save_grievance(db: Session, complaint: str, prediction: dict):

    grievance = Grievance(
        grievance_id=generate_grievance_id(db),
        complaint_text=complaint,
        category=prediction["predicted_category"],
        department=prediction["suggested_department"],
        priority=recommend_priority(
    complaint,
    prediction["predicted_category"]
),
        status="Pending"
    )

    db.add(grievance)
    db.commit()
    db.refresh(grievance)

    return grievance
