package chat

import (
    "math/rand"
    "time"

    "backend-bebu/internal/models"
    "gorm.io/gorm"
)

func SeedConversations(db *gorm.DB) {
    var users []models.User
    db.Find(&users)

    rand.Seed(time.Now().UnixNano())

    for i := 0; i < 20; i++ {
        isGroup := rand.Intn(4) == 0 // 25% group

        creator := users[rand.Intn(len(users))]

        convo := models.Conversation{
            CreatedByUserID:  creator.UserID,
            ConversationType: pickConversationType(isGroup),
            CreatedAt:        randomPastTime(),
        }

        db.Create(&convo)

        members := pickMembers(users, creator, isGroup)

        for _, m := range members {
            member := models.ConversationMember{
                ConversationID: convo.ConversationID,
                UserID:         m.UserID,
                Role:           "member",
            }

            db.Create(&member)
        }
    }
}

func pickConversationType(isGroup bool) string {
    if isGroup {
        return "group"
    }
    return "direct"
}

func pickMembers(users []models.User, creator models.User, isGroup bool) []models.User {
    members := []models.User{creator}

    if isGroup {
        count := rand.Intn(3) + 2 // 2–4 tambahan
        for i := 0; i < count; i++ {
            members = append(members, users[rand.Intn(len(users))])
        }
    } else {
        // direct → 1 lawan bicara
        for {
            u := users[rand.Intn(len(users))]
            if u.UserID != creator.UserID {
                members = append(members, u)
                break
            }
        }
    }

    return uniqueUsers(members)
}

func uniqueUsers(input []models.User) []models.User {
    m := make(map[uint]models.User)
    for _, u := range input {
        m[u.UserID] = u
    }

    var result []models.User
    for _, v := range m {
        result = append(result, v)
    }

    return result
}