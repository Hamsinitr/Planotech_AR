from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.scoring_config import ScoringConfig
from app.schemas.scoring import ScoringConfigSchema, ScoringConfigUpdate
from app.routers.auth import require_admin, get_current_user

router = APIRouter(prefix="/settings", tags=["Settings"])

@router.get("/scoring-weights", response_model=ScoringConfigSchema)
def get_scoring_weights(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
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
        db.refresh(cfg)
    return cfg

@router.post("/scoring-weights", response_model=ScoringConfigSchema)
def update_scoring_weights(
    payload: ScoringConfigUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    cfg = db.query(ScoringConfig).first()
    if not cfg:
        cfg = ScoringConfig()
        db.add(cfg)

    cfg.report_submission_weight = payload.report_submission_weight
    cfg.report_quality_weight = payload.report_quality_weight
    cfg.attendance_weight = payload.attendance_weight
    cfg.excellent_score = payload.excellent_score
    cfg.good_score = payload.good_score
    cfg.average_score = payload.average_score
    cfg.poor_score = payload.poor_score
    cfg.before_930_score = payload.before_930_score
    cfg.grace_score = payload.grace_score
    cfg.after_945_score = payload.after_945_score

    db.commit()
    db.refresh(cfg)
    return cfg
