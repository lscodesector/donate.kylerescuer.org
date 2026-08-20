import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { politicaDoacao } from "@/content/legal";

export const metadata: Metadata = {
  title: `${politicaDoacao.titulo} | Caio Protetor`,
  description: politicaDoacao.resumo,
  alternates: { canonical: `/${politicaDoacao.slug}` },
};

export default function Page() {
  return <LegalPage documento={politicaDoacao} />;
}
