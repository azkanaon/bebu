import {
  FaTwitter,
  FaGithub,
  FaInstagram,
  FaYoutube,
  FaLinkedin,
  FaFacebook,
  FaTiktok,
  FaGlobe,
} from 'react-icons/fa'
import { IconType } from 'react-icons'
import { RiNetflixFill } from 'react-icons/ri'

export const socialIconMap: Record<string, IconType> = {
  youtube: FaYoutube,
  instagram: FaInstagram,
  github: FaGithub,
  linkedin: FaLinkedin,
  twitter: FaTwitter,
  website: FaGlobe,
  netflix: RiNetflixFill,
  facebook: FaFacebook,
  tiktok: FaTiktok,
}
