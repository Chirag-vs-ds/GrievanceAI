
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..database.connection import get_db
from ..database.models import ActivityLog
from ..services.admin_auth import require_admin


router = APIRouter(
    prefix="/api/admin",
    tags=["Admin Activity Logs"]
)


@router.get("/activity-logs")
def get_activity_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    action_type: Optional[str] = None,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    query = db.query(ActivityLog)

    if action_type:
        query = query.filter(
            ActivityLog.action_type == action_type
        )

    total = query.count()

    logs = (
        query
        .order_by(
            ActivityLog.created_at.desc(),
            ActivityLog.id.desc()
        )
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "activity_logs": [
            {
                "id": log.id,
                "admin_username": log.admin_username,
                "action_type": log.action_type,
                "grievance_id": log.grievance_id,
                "previous_status": log.previous_status,
                "new_status": log.new_status,
                "created_at": log.created_at
            }
            for log in logs
        ]
    }
