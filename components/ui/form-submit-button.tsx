"use client";
import { useFormStatus } from "react-dom";
import { PsfitLoader } from "./psfit-loader";

export function FormSubmitButton({idleLabel,className}:{idleLabel:string;className:string}){
  const {pending}=useFormStatus();
  return <button type="submit" disabled={pending} className={className}>
    {pending?<PsfitLoader size="sm" label=""/>:idleLabel}
  </button>;
}
