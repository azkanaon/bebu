package utils

import (
	"context"
	"mime/multipart"

	"backend-bebu/config"

	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
)

func UploadToCloudinary(file multipart.File) (string, error) {
	uploadResult, err := config.CLD.Upload.Upload(
		context.Background(),
		file,
		uploader.UploadParams{
			Folder: "bebu-posts",
		},
	)

	if err != nil {
		return "", err
	}

	return uploadResult.SecureURL, nil
}