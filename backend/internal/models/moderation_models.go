// moderation_models.go
package models

import "time"

type Report struct {
	ReportID         uint       `gorm:"column:report_id;primaryKey;autoIncrement"`
	UserID           uint       `gorm:"column:user_id;not null"`
	EntityID         int        `gorm:"column:entity_id;not null"`
	EntityType       string     `gorm:"column:entity_type;size:100;not null"`
	ReviewByAdminID  *uint      `gorm:"column:review_by_admin_id"`
	ReasonText       *string    `gorm:"column:reason_text;type:text"`
	ReviewAt         *time.Time `gorm:"column:review_at"`
	CreatedAt        time.Time  `gorm:"column:created_at;autoCreateTime"`
	UpdatedAt        time.Time  `gorm:"column:updated_at;autoUpdateTime"`

	User          User  `gorm:"foreignKey:UserID;references:UserID"`
	ReviewedAdmin *User `gorm:"foreignKey:ReviewByAdminID;references:UserID"`
}

type AdminAction struct {
	AdminActionID uint      `gorm:"column:admin_action_id;primaryKey;autoIncrement"`
	AdminID       uint      `gorm:"column:admin_id;not null"`
	ActionType    string    `gorm:"column:action_type;size:100;not null"`
	EntityType    *string   `gorm:"column:entity_type;size:100"`
	EntityID      *int      `gorm:"column:entity_id"`
	Reason        *string   `gorm:"column:reason;type:text"`
	DurationDays  *int      `gorm:"column:duration_days"`
	CreatedAt     time.Time `gorm:"column:created_at;autoCreateTime"`

	Admin User `gorm:"foreignKey:AdminID;references:UserID"`
}