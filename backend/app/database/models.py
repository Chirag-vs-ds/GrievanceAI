
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    text
)

from .connection import Base


class Grievance(Base):

    __tablename__ = "grievances"

    id = Column(
        Integer,
        primary_key=True,
        autoincrement=True
    )

    grievance_id = Column(
        String(30),
        unique=True,
        nullable=False
    )

    complaint_text = Column(
        Text,
        nullable=False
    )

    category = Column(
        String(100),
        nullable=False
    )

    department = Column(
        String(150),
        nullable=False
    )

    priority = Column(
        String(20),
        nullable=True,
        server_default=text("'Medium'")
    )

    status = Column(
        String(30),
        nullable=True,
        server_default=text("'Pending'")
    )

    created_at = Column(
        DateTime,
        nullable=True,
        server_default=text("CURRENT_TIMESTAMP")
    )

    updated_at = Column(
        DateTime,
        nullable=True,
        server_default=text("CURRENT_TIMESTAMP"),
        server_onupdate=text("CURRENT_TIMESTAMP")
    )

class ActivityLog(Base):

    __tablename__ = "activity_logs"

    id = Column(
        Integer,
        primary_key=True,
        autoincrement=True
    )

    admin_username = Column(
        String(100),
        nullable=False
    )

    action_type = Column(
        String(50),
        nullable=False
    )

    grievance_id = Column(
        String(30),
        nullable=True
    )

    previous_status = Column(
        String(30),
        nullable=True
    )

    new_status = Column(
        String(30),
        nullable=True
    )

    created_at = Column(
        DateTime,
        nullable=True,
        server_default=text("CURRENT_TIMESTAMP")
    )
