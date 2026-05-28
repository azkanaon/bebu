package models

import "time"

type ReportSummary struct {
	ReportSummaryID uint       `gorm:"column:report_summary_id;primaryKey;autoIncrement"`
	EntityID        int        `gorm:"column:entity_id;not null"`
	EntityType      string     `gorm:"column:entity_type;size:50;not null"`
	TotalReports    int        `gorm:"column:total_reports;default:1;not null"`
	UniqueReports   int        `gorm:"column:unique_reports;default:1;not null"`
	Status          string     `gorm:"column:status;type:varchar(20);default:'Not reviewed';not null"`
	FirstReport     time.Time  `gorm:"column:first_report;not null;default:NOW()"`
	LastReport      time.Time  `gorm:"column:last_report;not null;default:NOW()"`
	ReviewByAdminID *uint      `gorm:"column:review_by_admin_id"`
	ReviewAt        *time.Time `gorm:"column:review_at"`
	AdminNotes      *string    `gorm:"column:admin_notes;type:text"`
	CreatedAt       time.Time  `gorm:"column:created_at;autoCreateTime"`
	UpdatedAt       time.Time  `gorm:"column:updated_at;autoUpdateTime"`

	// Relations
	ReviewedAdmin *User    `gorm:"foreignKey:ReviewByAdminID;references:UserID"`
	Reports       []Report `gorm:"foreignKey:ReportSummaryID"`
}

// TableName menentukan nama tabel plural secara eksplisit agar sesuai dengan migrasi SQL
func (ReportSummary) TableName() string {
	return "report_summaries"
}

type Report struct {
	ReportID        uint      `gorm:"column:report_id;primaryKey;autoIncrement"`
	ReportSummaryID uint      `gorm:"column:report_summary_id;not null"` // Foreign Key ke Summary
	UserID          uint      `gorm:"column:user_id;not null"`          // Pelapor
	EntityID        int       `gorm:"column:entity_id;not null"`
	EntityType      string    `gorm:"column:entity_type;size:100;not null"`
	ReasonText      *string   `gorm:"column:reason_text;type:text"`
	CreatedAt       time.Time `gorm:"column:created_at;autoCreateTime"` // Hanya butuh CreatedAt karena data bersifat log (Read-Only)

	// Relations
	User          User           `gorm:"foreignKey:UserID;references:UserID"`
	ReportSummary *ReportSummary `gorm:"foreignKey:ReportSummaryID;references:ReportSummaryID"`
}

type AdminAction struct {
	AdminActionID uint      `gorm:"column:admin_action_id;primaryKey;autoIncrement"`

	ReportSummaryID *uint   `gorm:"column:report_summary_id"`

	AdminID       uint      `gorm:"column:admin_id;not null"`
	ActionType    string    `gorm:"column:action_type;size:100;not null"`
	EntityType    *string   `gorm:"column:entity_type;size:100"`
	EntityID      *int      `gorm:"column:entity_id"`
	Reason        *string   `gorm:"column:reason;type:text"`
	DurationDays  *int      `gorm:"column:duration_days"`
	CreatedAt     time.Time `gorm:"column:created_at;autoCreateTime"`

	Admin User `gorm:"foreignKey:AdminID;references:UserID"`

	ReportSummary ReportSummary `gorm:"foreignKey:ReportSummaryID;references:ReportSummaryID"`
}