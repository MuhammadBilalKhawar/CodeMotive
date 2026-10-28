export type Testimonial = {
  name: string
  business: string
  country: string
  quote: string
  // Where the review can be verified, e.g. an Upwork or Google review link.
  sourceUrl: string
}

// Real, verifiable client reviews only. Never add invented testimonials.
// While this list is empty, the testimonials section stays hidden.
export const testimonials: Testimonial[] = []
