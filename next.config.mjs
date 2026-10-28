/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Tailwind's CSS is small (~12 KB gzipped), so ship it inside the HTML
    // instead of a render-blocking stylesheet request. Faster first paint.
    inlineCss: true,
  },
  // Quote and invoice PDFs: render with the package as-is (not bundled), and
  // ship the logo they read from /public with every server function.
  serverExternalPackages: ["@react-pdf/renderer"],
  outputFileTracingIncludes: {
    "/**": ["./public/brand/email-signature-logo-600x150-white-bg.png"],
  },
  images: {
    // Serve resized AVIF/WebP instead of the original PNG/JPG files.
    // SVGs (logos) are passed through untouched.
    formats: ["image/avif", "image/webp"],
  },
  async redirects() {
    return [
      // Short link for outreach emails; the query (e.g. ?ref=batch-3) is kept.
      { source: "/mockup", destination: "/free-mockup", permanent: true },
      // One canonical host: www -> non-www (http -> https is handled by Vercel).
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.code-motive.dev" }],
        destination: "https://code-motive.dev/:path*",
        permanent: true,
      },
    ]
  },
}

export default nextConfig
