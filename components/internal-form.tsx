import { FormSubmitButton } from "@/components/ui/form-submit-button";
export function Field({ name, label, type = "number", required = false }: { name: string; label: string; type?: string; required?: boolean }) {
  return <label className="text-sm text-muted">{label}<input name={name} type={type} required={required} step="any" className="mt-2 w-full rounded-xl border border-white/10 bg-surface px-3 py-2 text-paper"/></label>;
}
export function SaveButton({ children = "Save" }: { children?: React.ReactNode }) {
  return <FormSubmitButton className="rounded-full bg-acid px-5 py-3 font-bold text-ink disabled:opacity-50" idleLabel={String(children)}/>;
}
