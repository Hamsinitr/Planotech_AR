from datetime import datetime
from sqlalchemy import Column, Integer, Float, DateTime
from app.database import Base

class ScoringConfig(Base):
    __tablename__ = "scoring_config"

    id = Column(Integer, primary_key=True, index=True)
    report_submission_weight = Column(Float, default=0.50)  # 50%
    report_quality_weight = Column(Float, default=0.30)     # 30%
    attendance_weight = Column(Float, default=0.20)         # 20%
    
    # Quality sub-scores
    excellent_score = Column(Float, default=100.0)
    good_score = Column(Float, default=75.0)
    average_score = Column(Float, default=50.0)
    poor_score = Column(Float, default=25.0)
    
    # Attendance sub-scores
    before_930_score = Column(Float, default=100.0)
    grace_score = Column(Float, default=80.0)
    after_945_score = Column(Float, default=40.0)
    
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
