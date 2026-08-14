/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  Modo de teste - só na máquina de quem desenvolve                     ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Liga o degrau de **R$ 0,01** na grade de doação (`testAmount`, em
 * `content/landing.ts`), para conferir o fluxo inteiro - Pix, webhook,
 * planilha, mandato da recorrência - sem gastar R$ 20 a cada tentativa.
 *
 * ── Por que hostname, e não `NODE_ENV` ────────────────────────────────────
 * O site é exportado estático (`output: "export"`) e enviado por FTP: o mesmo
 * pacote que roda aqui é o que vai para o ar. Se o gatilho fosse de build,
 * bastaria alguém exportar com a variável errada - ou publicar um `next dev`
 * congelado - para o centavo aparecer na grade de quem doa de verdade. Pelo
 * endereço de quem serve a página, isso não é possível: em
 * `doe.caioprotetor.org` a checagem é falsa, ponto.
 *
 * ── Só no cliente ─────────────────────────────────────────────────────────
 * No servidor (e na exportação do HTML) devolve `false`. Quem chama é o modal
 * de valores, que só renderiza depois de um clique - então não existe HTML
 * pré-gerado com o centavo dentro, nem divergência de hidratação.
 */
export function isLocalhost() {
  if (typeof window === "undefined") return false;

  const host = window.location.hostname;
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "::1" ||
    host === "[::1]" ||
    // `next dev` acessado pelo IP da máquina na rede local (celular no Wi-Fi).
    host.endsWith(".local")
  );
}
