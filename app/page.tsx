import { redirect } from "next/navigation";

/**
 * A raiz não desenha nada: manda para a versão que está no ar.
 *
 * A landing existe em duas versões — `/v1` (congelada no commit 0d0ecce) e
 * `/v2` (a viva) — e quem chega em `/` precisa cair em uma delas. Trocar qual
 * versão recebe o tráfego é trocar o destino desta linha.
 *
 * `redirect` responde 307 (temporário) de propósito: 308 fica gravado no
 * navegador de quem visitou e continuaria mandando para a v2 mesmo depois de
 * a raiz apontar para outro lugar — o oposto do que um teste entre versões
 * precisa. Para tornar a escolha definitiva, troque por `permanentRedirect`.
 */
export default function Home() {
  redirect("/v2");
}
