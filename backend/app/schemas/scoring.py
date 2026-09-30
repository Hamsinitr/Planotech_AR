from pydantic import BaseModel

class ScoringConfigSchema(BaseModel):
    id: int
    report_submission_weight: float
    report_quality_weight: float
    attendance_weight: float
    excellent_score: float
    good_score: float
    average_score: float
    poor_score: float
    before_930_score: float
    grace_score: float
    after_945_score: float

    class Config:
        from_attributes = True

class ScoringConfigUpdate(BaseModel):
    report_submission_weight: float
    report_quality_weight: float
    attendance_weight: float
    excellent_score: float
    good_score: float
    average_score: float
    poor_score: float
    before_930_score: float
    grace_score: float
    after_945_score: float
