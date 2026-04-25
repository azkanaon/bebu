package utils

import (
	"fmt"
	"log"
	"os"
	"strconv"
	"gopkg.in/gomail.v2"
)

// SendResetPasswordEmail menggunakan gomail untuk pengiriman yang lebih andal.
func SendResetPasswordEmail(toEmail, code string) error {
	// Ambil konfigurasi dari environment variables
	smtpHost := os.Getenv("SMTP_HOST")
	smtpPortStr := os.Getenv("SMTP_PORT")
	senderEmail := os.Getenv("SMTP_SENDER_EMAIL")
	senderPassword := os.Getenv("SMTP_SENDER_PASSWORD")

	if smtpHost == "" || smtpPortStr == "" || senderEmail == "" || senderPassword == "" {
		log.Println("SMTP configuration is incomplete. Email not sent.")
		// Kita log error tapi return nil agar tidak menghentikan flow utama jika email gagal
		return nil 
	}

	// Konversi port dari string ke integer
	smtpPort, err := strconv.Atoi(smtpPortStr)
	if err != nil {
		log.Printf("Invalid SMTP port: %v. Email not sent.", err)
		return nil
	}

	// Buat pesan email baru
	m := gomail.NewMessage()
	m.SetHeader("From", senderEmail)
	m.SetHeader("To", toEmail)
	m.SetHeader("Subject", "Your Password Reset Code")
	m.SetBody("text/html", fmt.Sprintf("Your password reset code is: <b>%s</b><br>This code will expire in 15 minutes.", code))

	// Konfigurasi dialer SMTP
	d := gomail.NewDialer(smtpHost, smtpPort, senderEmail, senderPassword)

	// Kirim email
	if err := d.DialAndSend(m); err != nil {
		log.Printf("Failed to send email to %s: %v", toEmail, err)
		// Return nil di sini agar kegagalan pengiriman email (misal: server down)
		// tidak menyebabkan seluruh request reset password gagal.
		// Pengguna tetap akan melihat pesan sukses.
		return nil
	}

	log.Printf("Password reset email sent to %s", toEmail)
	return nil
}