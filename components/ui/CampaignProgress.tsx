"use client";

import { useSyncExternalStore } from "react";
import {
  getCampaignServerSnapshot,
  getCampaignSnapshot,
  subscribeCampaign,
} from "@/lib/campaign";

/**
 * Barra de meta: arrecadado, meta, progresso, porcentagem e apoiadores.
 *
 * ⚠️ Os números **não vêm do gateway** - são calculados a partir da data da
 * campanha. O porquê, as constantes e a conta estão em `lib/campaign.ts`, e é
 * lá que este aviso está por extenso.
 *
 * ── Por que só calcula depois de montar ───────────────────────────────────
 * O site é estático: o HTML sai congelado do build. Se o valor fosse renderizado
 * no servidor, ele ficaria parado no dia do build - e, pior, o cliente chegaria
 * a outro número e o React acusaria erro de hidratação. Por isso o primeiro
 * render é o esqueleto (mesma altura, valores em `—`) e o número entra logo
 * depois, num efeito.
 *
 * O esqueleto não é enfeite: ele ocupa exatamente a altura do bloco pronto, para
 * a dobra não pular quando o número chega. Sem JavaScript, é ele que fica - e
 * mostrar "—" é melhor do que mostrar um valor que ninguém atualizou.
 *
 * ── Duas passadas ─────────────────────────────────────────────────────────
 * A primeira usa o relógio do aparelho, que é imediato; a segunda corrige pelo
 * `Date` do servidor (ver `serverTimeOffset`). Na prática as duas dão o mesmo
 * número, e quando não dão é porque a data do celular está errada - que é
 * justamente o caso que a segunda passada existe para consertar.
 */
export function CampaignProgress({ className = "" }: { className?: string }) {
  /* `null` no servidor e durante a hidratação, o valor do dia depois dela - a
     troca é o React que faz, sem renderização em cascata. Ver o bloco sobre
     `useSyncExternalStore` em `lib/campaign.ts`. */
  const estado = useSyncExternalStore(
    subscribeCampaign,
    getCampaignSnapshot,
    getCampaignServerSnapshot,
  );

  const brl = (valor: number) =>
    valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <div className={`flex w-full flex-col gap-1.5 ${className}`}>
      {/* Arrecadado à esquerda, meta à direita - a mesma leitura da barra que
          fica logo abaixo, para o olho ligar um ao outro sem esforço. */}
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[clamp(1.046rem,0.93rem+0.651vw,1.395rem)] font-extrabold leading-none text-ink-900 tabular-nums">
          {estado ? brl(estado.raised) : "—"}
        </span>
        <span className="text-[clamp(0.814rem,0.744rem+0.279vw,0.93rem)] font-extrabold leading-none text-ink-600 tabular-nums">
          {estado ? brl(estado.goal) : "—"}
        </span>
      </div>

      <div className="flex items-baseline justify-between gap-3 text-fs12 font-semibold text-ink-600">
        <span>Arrecadados</span>
        <span>Meta</span>
      </div>

      <div
        role="progressbar"
        aria-valuenow={estado?.percent ?? 0}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progresso da meta da campanha"
        className="h-[10px] w-full overflow-hidden rounded-full bg-ink-900/10"
      >
        {/* `transition` para a barra deslizar até a marca em vez de aparecer
            pronta: sem ela, a correção pelo relógio do servidor daria um pulo
            seco. Escala `0` no esqueleto.

            `transform: scaleX`, e não `width`: animar largura obriga o
            navegador a refazer o layout a cada quadro (o Lighthouse chama isso
            de "animação não composta"); a escala roda na GPU. `origin-left`
            para a barra crescer da esquerda, como antes. */}
        <div
          className="h-full w-full origin-left rounded-full bg-donate transition-transform duration-700 ease-out"
          style={{ transform: `scaleX(${(estado?.percent ?? 0) / 100})` }}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-fs12 font-semibold">
        <span className="text-donate-text">
          {estado ? `${estado.percent}% da meta atingida` : " "}
        </span>

        <span className="inline-flex items-center gap-1.5 text-ink-600">
          {/* O pontinho verde é o sinal de "isto está vivo" que a campanha
              original usa ao lado da contagem. */}
          <span
            aria-hidden="true"
            className="h-[6px] w-[6px] shrink-0 rounded-full bg-donate"
          />
          {estado ? `${estado.supporters} apoiadores` : " "}
        </span>
      </div>
    </div>
  );
}
