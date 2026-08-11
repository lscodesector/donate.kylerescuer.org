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

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      {impactNumbers.map((stat) => (
        <li
          key={stat.label}
          className="flex flex-col items-center gap-1 rounded-md border border-ink-900/10 bg-surface p-4 text-center shadow"
        >
          <CountUp
            value={stat.value}
            prefix={stat.prefix}
            suffix={stat.suffix}
            className="text-[clamp(1.625rem,1.3rem+1.2vw,2.25rem)] font-extrabold leading-none text-donate"
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
