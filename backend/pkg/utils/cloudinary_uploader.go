package utils

import (
	"context"
	"mime/multipart"

	"backend-bebu/config" // Asumsi config Anda ada di sini

	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
)

// UploadToCloudinary adalah fungsi helper yang reusable untuk mengupload file.
// Ia menerima file dan nama folder sebagai input, dan mengembalikan URL atau error.
func UploadToCloudinary(file *multipart.FileHeader, folderName string) (string, error) {
	if file == nil {
		return "", nil // Bukan error, hanya tidak ada file untuk diupload
	}

	// Buka file stream
	src, err := file.Open()
	if err != nil {
		return "", err
	}
	defer src.Close()

	// Inisialisasi instance Cloudinary dari URL yang ada di config
	cld, err := cloudinary.NewFromURL(config.CloudinaryURL)
	if err != nil {
		return "", err
	}

	// Siapkan parameter upload
	uploadParams := uploader.UploadParams{
		UploadPreset: config.CloudinaryUploadPreset,
		Folder:       folderName,
	}
	
	// Lakukan upload
	uploadResult, err := cld.Upload.Upload(context.Background(), src, uploadParams)
	if err != nil {
		return "", err
	}

	// Kembalikan URL yang aman (HTTPS)
	return uploadResult.SecureURL, nil
}