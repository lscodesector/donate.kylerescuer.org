import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { termosDeUso } from "@/content/legal";

export const metadata: Metadata = {
  title: `${termosDeUso.titulo} | Caio Protetor`,
  description: termosDeUso.resumo,
  alternates: { canonical: `/${termosDeUso.slug}` },
};

export default function Page() {
  return <LegalPage documento={termosDeUso} />;
}
