
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database.connection import get_db
from ..services.analytics_service import get_dashboard_analytics
from ..services.admin_auth import require_admin

router = APIRouter(
    prefix="/api/admin/analytics",
    tags=["Admin Analytics"],
    dependencies=[Depends(require_admin)],
)


@router.get("/summary")
def dashboard_summary(db: Session = Depends(get_db)):
    return get_dashboard_analytics(db)
