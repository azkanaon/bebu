package config

import (
	"github.com/cloudinary/cloudinary-go/v2"
)

var CLD *cloudinary.Cloudinary

func InitCloudinary() error {
	cld, err := cloudinary.New()
	if err != nil {
		return err
	}

	cld.Config.URL.Secure = true
	CLD = cld

	return nil
}