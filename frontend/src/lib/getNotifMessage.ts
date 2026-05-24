import { AppNotification } from '@/types/notifications'

export const getNotificationMessage = (notif: AppNotification): string => {
  const actor = notif.actorDisplayName || notif.actorUsername
  const count = notif.extraActorsCount
  const suffix = count > 0 ? ` and ${count} others` : ''

  switch (notif.type) {
    case 'POST_LIKE':
      return `${actor}${suffix} liked your post.`
    case 'POST_COMMENT':
      return `${actor}${suffix} commented on your post.`
    case 'FOLLOW_REQUEST':
      return `${actor} wants to follow you.`
    case 'FOLLOW_ACCEPT':
      return `${actor} accepted your follow request.`
    case 'NEW_FOLLOWER':
      return `${actor} started following you.`
    case 'POST_SAVE':
      return `${actor} saved your post.`
    case 'COMMENT_LIKE':
      return `${actor} liked your comment.`
    case 'COMMENT_REPLY':
      return `${actor} replied to your comment.`
    default:
      return 'sent you a notification.'
  }
}
