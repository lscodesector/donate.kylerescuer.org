import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { politicaPrivacidade } from "@/content/legal";

export const metadata: Metadata = {
  title: `${politicaPrivacidade.titulo} | Caio Protetor`,
  description: politicaPrivacidade.resumo,
  alternates: { canonical: `/${politicaPrivacidade.slug}` },
};

export default function Page() {
  return <LegalPage documento={politicaPrivacidade} />;
}
