import type { BlogPost } from "@/data/blog/types"
import { websiteCostPakistan } from "@/data/blog/website-cost-pakistan"
import { shopifyVsWoocommerce } from "@/data/blog/shopify-vs-woocommerce"
import { websiteVsInstagram } from "@/data/blog/website-vs-instagram"
import { websiteBuildTime } from "@/data/blog/website-build-time"

export type { BlogPost }

// Newest first. To add a guide: create a file like the others and list it here.
export const posts: BlogPost[] = [websiteCostPakistan, shopifyVsWoocommerce, websiteVsInstagram, websiteBuildTime]

export const publishedPosts = () =>
  posts.filter((p) => p.published).sort((a, b) => b.dateUpdated.localeCompare(a.dateUpdated))

export const getPost = (slug: string) => posts.find((p) => p.slug === slug)
