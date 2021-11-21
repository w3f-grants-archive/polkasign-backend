package storage

import (
	"github.com/polkasign/polkasign-backend/graph/model"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var gormDB *gorm.DB

func InitGormDB() {
	var err error
	gormDB, err = gorm.Open(sqlite.Open("data.sqlite"), &gorm.Config{})
	if err != nil {
		panic("failed to connect database")
	}

	// Migrate the schema
	gormDB.AutoMigrate(&model.AgreementInfo{})
}

func GetGormDB() *gorm.DB {
	return gormDB
}
