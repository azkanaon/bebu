package user

import (
    "backend-bebu/internal/models"
    "gorm.io/gorm"
    "golang.org/x/crypto/bcrypt"
)

func hashPassword(pw string) string {
    hashed, _ := bcrypt.GenerateFromPassword([]byte(pw), bcrypt.DefaultCost)
    return string(hashed)
}

func SeedUsers(db *gorm.DB) {
    users := []models.User{
        {
            Email: "andika.pratama@gmail.com",
            Username: "andikap",
            PasswordHash: hashPassword("password123"),
            Role: "admin",
            Status: "active",
            IsActive: true,
            EmailVerified: true,
        },
        {
            Email: "siti.nurhaliza@mail.com",
            Username: "sitinur",
            PasswordHash: hashPassword("password123"),
            Role: "user",
            Status: "active",
            IsActive: true,
            EmailVerified: true,
        },
        {
            Email: "rizky.febrianto@yahoo.com",
            Username: "rizkyf",
            PasswordHash: hashPassword("password123"),
            Role: "user",
            Status: "inactive",
            IsActive: false,
            EmailVerified: false,
        },
        {
            Email: "dewi.lestari@mail.com",
            Username: "dewil",
            PasswordHash: hashPassword("password123"),
            EmailVerified: true,
        },
        {
            Email: "bagas.saputra@gmail.com",
            Username: "bagass",
            PasswordHash: hashPassword("password123"),
        },
        {
            Email: "fajar.hidayat@mail.com",
            Username: "fajarh",
            PasswordHash: hashPassword("password123"),
        },
        {
            Email: "putri.ayu@gmail.com",
            Username: "putriayu",
            PasswordHash: hashPassword("password123"),
            EmailVerified: true,
        },
        {
            Email: "yoga.pratama@mail.com",
            Username: "yogap",
            PasswordHash: hashPassword("password123"),
        },
        {
            Email: "intan.permata@mail.com",
            Username: "intanp",
            PasswordHash: hashPassword("password123"),
        },
        {
            Email: "rahmat.hidayat@gmail.com",
            Username: "rahmath",
            PasswordHash: hashPassword("password123"),
            Role: "admin",
        },
        {
            Email: "dian.sari@mail.com",
            Username: "dians",
            PasswordHash: hashPassword("password123"),
        },
        {
            Email: "eko.prasetyo@mail.com",
            Username: "ekop",
            PasswordHash: hashPassword("password123"),
        },
        {
            Email: "nina.kartika@gmail.com",
            Username: "ninak",
            PasswordHash: hashPassword("password123"),
        },
        {
            Email: "agus.salim@mail.com",
            Username: "aguss",
            PasswordHash: hashPassword("password123"),
        },
        {
            Email: "lina.marlina@mail.com",
            Username: "linam",
            PasswordHash: hashPassword("password123"),
        },
        {
            Email: "taufik.hidayat@gmail.com",
            Username: "taufikh",
            PasswordHash: hashPassword("password123"),
        },
        {
            Email: "citra.dewi@mail.com",
            Username: "citrad",
            PasswordHash: hashPassword("password123"),
        },
        {
            Email: "rudi.hermawan@mail.com",
            Username: "rudih",
            PasswordHash: hashPassword("password123"),
        },
        {
            Email: "maya.sari@gmail.com",
            Username: "mayas",
            PasswordHash: hashPassword("password123"),
        },
        {
            Email: "ferdiansyah@mail.com",
            Username: "ferdian",
            PasswordHash: hashPassword("password123"),
        },
    }

    for _, user := range users {
        db.FirstOrCreate(&user, models.User{Email: user.Email})
    }
}