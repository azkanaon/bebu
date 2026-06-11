package utils

import (
	"context"
	"regexp"
	"errors"
	"mime/multipart"

	"backend-bebu/config"

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

func ExtractPublicID(secureURL string) string {
	if secureURL == "" {
		return ""
	}

	// Mencari bagian setelah '/upload/vxxxxxxxxx/' atau setelah '/upload/'
	// Regex ini menangkap semua teks setelah segmen 'upload/' (dan mengabaikan versi 'v12345' jika ada) sampai sebelum ekstensi file
	re := regexp.MustCompile(`(?:image|video|raw)/upload/(?:v\d+/)?(.+)\.[a-zA-Z0-9]+$`)
	matches := re.FindStringSubmatch(secureURL)

	if len(matches) > 1 {
		return matches[1]
	}

	return ""
}

func DeleteFromCloudinary(secureURL string) error {
	if secureURL == "" {
		return nil // Tidak ada gambar untuk dihapus, skip tanpa error
	}

	publicID := ExtractPublicID(secureURL)
	if publicID == "" {
		return errors.New("gagal mengekstrak public id dari url cloudinary")
	}

	// Inisialisasi instance Cloudinary
	cld, err := cloudinary.NewFromURL(config.CloudinaryURL)
	if err != nil {
		return err
	}

	// Lakukan penghapusan menggunakan Destroy
	_, err = cld.Upload.Destroy(context.Background(), uploader.DestroyParams{
		PublicID: publicID,
	})
	if err != nil {
		return err
	}

	return nil
}