package post_interaction

import "gorm.io/gorm"

func Run(db *gorm.DB) {
    SeedPostLikes(db)
    SeedPostSaves(db)
    SeedPostShares(db)
    SeedPostComments(db)
    SeedPostCommentLikes(db)
}