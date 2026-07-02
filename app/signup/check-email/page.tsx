import { Logo } from "@/components/ui";
import Link from "next/link";

export const metadata = { title: "Confira seu e-mail" };

export default function Page() {
  return <main className="grid min-h-screen place-items-center p-5"><section className="w-full max-w-md rounded-3xl border border-white/10 bg-[#090c0a] p-7 text-center"><div className="flex justify-center"><Logo /></div><p className="eyebrow mt-10">Só mais uma etapa</p><h1 className="mt-3 text-3xl font-semibold">Confira seu e-mail</h1><p className="mt-3 text-sm leading-6 text-muted">Abra o link de confirmação que enviamos. Depois da autenticação, você escolherá seu apelido no PSFIT.</p><Link href="/login" className="mt-7 inline-block rounded-full border border-white/10 px-5 py-3 text-sm">Voltar para entrar</Link></section></main>;
}
