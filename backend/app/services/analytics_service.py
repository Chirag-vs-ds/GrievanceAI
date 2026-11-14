
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database.models import Grievance


def get_dashboard_analytics(db: Session):

    total = db.query(Grievance).count()

    pending = db.query(Grievance).filter(
        Grievance.status == "Pending"
    ).count()

    in_progress = db.query(Grievance).filter(
        Grievance.status == "In Progress"
    ).count()

    resolved = db.query(Grievance).filter(
        Grievance.status == "Resolved"
    ).count()

    # Category-wise distribution
    category_data = (
        db.query(
            Grievance.category,
            func.count(Grievance.id)
        )
        .group_by(Grievance.category)
        .all()
    )

    # Department-wise distribution
    department_data = (
        db.query(
            Grievance.department,
            func.count(Grievance.id)
        )
        .group_by(Grievance.department)
        .all()
    )

    # Priority-wise distribution
    priority_data = (
        db.query(
            Grievance.priority,
            func.count(Grievance.id)
        )
        .group_by(Grievance.priority)
        .all()
    )

    return {
        "total_grievances": total,
        "status_summary": {
            "pending": pending,
            "in_progress": in_progress,
            "resolved": resolved
        },
        "category_distribution": [
            {"category": name, "count": count}
            for name, count in category_data
        ],
        "department_distribution": [
            {"department": name, "count": count}
            for name, count in department_data
        ],
        "priority_distribution": [
            {"priority": name, "count": count}
            for name, count in priority_data
        ]
    }
