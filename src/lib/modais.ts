/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  O CANAL ENTRE OS BLOCOS E OS MODAIS                                  ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Cada seção da página é um bloco isolado: ela não importa outro bloco. Mas
 * quase toda seção precisa **abrir** um modal - o de doação, o de documento -
 * e o modal é outro bloco (`overlays/17`, `overlays/19`).
 *
 * Este arquivo é o que sustenta as duas coisas ao mesmo tempo: o gatilho mora
 * aqui, no meio, e não dentro do modal. Um botão do rodapé chama
 * `openDonationModal()` sem saber que existe um arquivo `17-modal-doacao.tsx`;
 * o modal escuta o evento sem saber quem o disparou.
 *
 * ── Por que evento de janela, e não contexto React ────────────────────────
 * Quem dispara é um botão dentro de seções que são Server Components, e elas
 * não podem receber um callback por prop sem virar cliente inteiras. Com o
 * evento, só o botão vira cliente.
 */

import { cnpjDocument, type Documento } from "./config";

/**
 * Evento que abre o modal. É um evento de janela, e não um contexto React,
 * porque quem dispara é um botão dentro de uma seção que é Server Component -
 * ela não pode receber um callback por prop sem virar cliente inteira.
 */
export const DONATION_MODAL_EVENT = "sos:abrir-doacao";

/** Com que frequência a doação se repete. */
export type Freq = "mensal" | "unica";

export type DonationIntent = {
  /** `id` de uma frente (`causes`). Sem ele, a doação é para a rede toda. */
  causeId?: string;
  /** Com que frequência a tela abre. Única é o padrão - ver abaixo. */
  freq?: Freq;
  /**
   * Trava a tela na **mensal**: sem as abas de frequência, sem a escada da
   * única, sem caminho para o checkout avulso.
   *
   * É o que todo CTA de doação mensal manda (barra fixa, menu, rodapé,
   * fechamento - ver `MonthlyDonateButton`). Um botão que diz "doar todo mês" e
   * abre uma tela com a doação única a um toque de distância está oferecendo
   * outra coisa no lugar do que prometeu; quem quer a única tem os botões de
   * "doar agora" espalhados pela página inteira.
   *
   * Sem esta marca a tela continua com as duas abas: é o caminho genérico, em
   * que a pessoa ainda não escolheu a frequência.
   */
  somenteMensal?: boolean;
};

export function openDonationModal(intent: DonationIntent = {}) {
  window.dispatchEvent(
    new CustomEvent<DonationIntent>(DONATION_MODAL_EVENT, { detail: intent }),
  );
}

/**
 * O popup de documento (`overlays/19-modal-documento.tsx`).
 *
 * Quem manda **qual** documento mostrar é quem abre: `openDocumentoModal(doc)`
 * leva a ficha junto no evento. Sem argumento, abre o cartão CNPJ da SOS
 * Animal Help, que é o que os chamadores antigos esperam.
 */
export const DOCUMENTO_MODAL_EVENT = "sos:abrir-documento";

export function openDocumentoModal(documento: Documento = cnpjDocument) {
  window.dispatchEvent(
    new CustomEvent<Documento>(DOCUMENTO_MODAL_EVENT, { detail: documento }),
  );
}
