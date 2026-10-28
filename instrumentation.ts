// Runs once when the server starts: report which optional integrations are off.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { logFeatureStatus } = await import("@/lib/env")
    logFeatureStatus()
  }
}
