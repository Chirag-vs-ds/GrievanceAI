
import logging

from sqlalchemy.orm import Session

from ..database.models import ActivityLog


def log_activity(
    db: Session,
    admin_username: str,
    action_type: str,
    grievance_id: str = None,
    previous_status: str = None,
    new_status: str = None
):
    """
    Store an administrator action in the activity_logs table.
    """

    activity = ActivityLog(
        admin_username=admin_username,
        action_type=action_type,
        grievance_id=grievance_id,
        previous_status=previous_status,
        new_status=new_status
    )

    db.add(activity)
    db.commit()
    db.refresh(activity)

    return activity


def log_auth_activity(db: Session, username: str, action_type: str):
    """Best-effort audit write after the authentication transaction has committed."""
    # Never include request bodies, cookies, or exception details in diagnostics.
    attempted_name = username[:100] if isinstance(username, str) and username else "<missing>"
    try:
        log_activity(db, attempted_name, action_type)
    except Exception:
        db.rollback()
        logging.getLogger(__name__).warning("Authentication audit record could not be saved.")
