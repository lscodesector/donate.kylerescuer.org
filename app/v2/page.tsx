import type { Metadata } from "next";
import DonationPage from "../page";

/**
 * `/v2` é apelido da raiz - a landing v2 mudou-se para `app/page.tsx`.
 *
 * A página não redireciona porque o site é estático (ver `next.config.ts`):
 * não há servidor para responder um 3xx, e resolver isso no navegador daria
 * uma tela em branco antes do conteúdo. Então esta rota **renderiza a mesma
 * página**, e a canônica manda a busca para `/`.
 *
 * Existe só para não quebrar link já compartilhado ou anúncio já no ar.
 * Quando esses links tiverem sido trocados, este arquivo pode sumir.
 */
export const metadata: Metadata = {
  alternates: { canonical: "/" },
  robots: { index: false, follow: true },
};

export default DonationPage;
