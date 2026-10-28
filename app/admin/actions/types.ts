// Result shapes shared by admin server actions and their forms.
// `values` echoes back what was typed (never passwords), so fields refill after an error:
// React resets forms that submit through a server action.
export type FormState = { error?: string; ok?: boolean; message?: string; values?: Record<string, string> }
export type SaveResult = { ok: true; savedAt: string } | { ok: false; error: string }
export type ActionResult<T = undefined> = ({ ok: true } & (T extends undefined ? object : { data: T })) | { ok: false; error: string }
