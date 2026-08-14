import { impactNumbers } from "@/content/landing";
import { CountUp } from "./CountUp";

/**
 * Os números da rede - vidas, abrigos, ração entregue, castrações.
 *
 * Vive na seção de transparência, embaixo da conta mensal da rede: em cima
 * está o que o dinheiro precisa cobrir todo mês, aqui está o que ele já
 * cobriu. É a mesma pergunta respondida pelos dois lados.
 *
 * ── Por que não no hero ───────────────────────────────────────────────────
 * Já esteve lá, primeiro como barra de meta em reais e depois em card. Saiu
 * porque a primeira dobra tem altura para uma ideia só, e ela é o vídeo -
 * cada pixel gasto com número ali era pixel tirado dele. Aqui embaixo o
 * espaço não é disputado e o card pode ter o tamanho que ele merece.
 *
 * ── Por que card, e não uma fileira solta ─────────────────────────────────
 * Sem moldura, quatro pares de número e rótulo viram oito pedaços de texto
 * soltos: não dá para saber de olho qual rótulo é de qual número, e a linha
 * inteira lê como sobra de layout. A moldura é o que agrupa cada par e diz
 * "isto aqui são quatro coisas, não oito".
 *
 * Cada número conta do zero ao chegar na tela (ver `CountUp`).
 */
export function ImpactStats() {
  // Lista vazia é estado válido: sem número confirmado, o bloco some inteiro
  // em vez de mostrar moldura vazia.
  if (!impactNumbers.length) return null;

  /*
   * As colunas seguem a quantidade de números, em vez de estarem fixas em
   * quatro. Com `sm:grid-cols-4` e três itens, o último ficava sozinho numa
   * célula de largura de card e a fileira lia como grade quebrada - e é
   * exatamente o que aconteceu quando a lista caiu de quatro para três na
   * virada para esta campanha. No celular continuam sendo duas colunas em
   * qualquer caso: três cards lado a lado em 360px não cabem.
   */
  const colunas =
    impactNumbers.length % 4 === 0
      ? "sm:grid-cols-4"
      : impactNumbers.length % 3 === 0
        ? "sm:grid-cols-3"
        : "sm:grid-cols-2";

  return (
    <ul className={`grid grid-cols-2 gap-3 sm:gap-4 ${colunas}`}>
      {impactNumbers.map((stat, i) => (
        <li
          key={stat.label}
          /* No celular são sempre duas colunas, então uma lista ímpar deixaria
             o último card sozinho e com metade da largura dos outros - a
             fileira lê como se faltasse um item. Ele passa a ocupar a linha
             inteira; a partir de `sm` a grade fecha certinha e isso não vale
             mais. */
          className={`flex flex-col items-center gap-1 rounded-md border border-ink-900/10 bg-surface p-4 text-center shadow ${
            impactNumbers.length % 2 === 1 && i === impactNumbers.length - 1
              ? "max-sm:col-span-2"
              : ""
          }`}
        >
          <CountUp
            value={stat.value}
            prefix={stat.prefix}
            suffix={stat.suffix}
            className="text-[clamp(1.625rem,1.3rem+1.2vw,2.25rem)] font-extrabold leading-none text-donate-text"
          />
          <span className="text-[13px] font-extrabold leading-tight text-ink-900">
            {stat.label}
          </span>
          <span className="text-[12px] leading-[1.4] text-ink-600">{stat.note}</span>
        </li>
      ))}
    </ul>
  );
}
