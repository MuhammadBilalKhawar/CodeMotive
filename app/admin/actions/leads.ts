"use server"

import { revalidatePath } from "next/cache"
import { deleteLead } from "@/lib/leads"
import { isActionError, userForAction } from "@/lib/auth/current"
import { logActivity } from "@/lib/audit"
import type { ActionResult } from "@/app/admin/actions/types"

// Removes a lead and its uploaded logo (e.g. for a deletion request).
export async function deleteLeadAction(id: string): Promise<ActionResult> {
  const user = await userForAction()
  if (isActionError(user)) return user
  try {
    await deleteLead(id)
  } catch (error) {
    console.error("Deleting lead failed", error)
    return { ok: false, error: "Couldn't delete the lead. Please try again." }
  }
  await logActivity(user, { action: "deleted", entity: "lead", entityId: id, summary: `${user.name} deleted a lead` })
  revalidatePath("/admin/leads")
  revalidatePath("/admin")
  return { ok: true }
}
