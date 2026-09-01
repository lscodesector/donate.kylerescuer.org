import type { Metadata } from "next";
import CampanhaCaio from "@/components/campaign/campanha-caio";
import { withBasePath } from "@/lib/base-path";

/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  /v2 - A CAMPANHA DA RAIZ, COM O PLAYER PRÓPRIO (TESTE A/B)           ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Esta rota serve a **mesma página** de `app/page.tsx` (o componente
 * `@/components/campaign/campanha-caio`) - mesma história, mesmos abrigos,
 * mesmo checkout. A única divergência é o motor de vídeo do Hero:
 * `heroPlayer="new"` troca o VTurb pelo player próprio
 * (`player.lusapayments.com`, ver `implementar-player-substituto-vturb`),
 * seguindo o mesmo padrão de integração aplicado em `hero.html` (campanha
 * Adrielly) - loader via `next/script` com `referrerPolicy="origin"`, ver o
 * comentário completo em `NewPlayer` (`02-hero.tsx`).
 *
 * Se o resto da página também precisar divergir no futuro, troque o
 * `<CampanhaCaio heroPlayer="new" />` abaixo por outra composição de blocos
 * de `@/components/sections` e `@/components/overlays` - só o Hero está
 * acoplado ao teste A/B hoje.
 *
 * Aqui fica só o que é da rota: o `metadata` e o `canonical`.
 */
export const metadata: Metadata = {
  /*
   * A v2 aponta o canonical para a **raiz** (`/`), não para si mesma: é a
   * mesma campanha servida em dois endereços para um teste A/B, e o buscador
   * deve consolidar tudo na página de controle em vez de indexar duas cópias
   * concorrentes. `withBasePath` pelo mesmo motivo do comentário em
   * `app/layout.tsx` - sem ele, publicado em `/v2`, o canonical cairia na raiz
   * do domínio, que é outro site.
   *
   * A raiz não tem prévia própria (título, descrição e og:image vêm do layout
   * raiz), então a v2 também não define uma - herda a mesma do layout.
   */
  alternates: { canonical: withBasePath("/") },
};

export default function DonationPageV2() {
  return <CampanhaCaio heroPlayer="new" />;
}
