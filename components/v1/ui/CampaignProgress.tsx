import { campaign, formatBRL } from "@/content/v1/landing";
import { IconUsers } from "./Icons";

/**
 * Barra de meta: arrecadado, meta, porcentagem e número de apoiadores.
 *
 * É o elemento de prova social mais forte da dobra — mostra que outras pessoas
 * já doaram e que falta pouco. Some por inteiro quando `campaign` é `null`,
 * porque barra de meta sem número real é pior do que barra nenhuma.
 *
 * `compact` enxuga a altura pela metade juntando tudo em duas linhas. É o que
 * a primeira dobra usa: lá, cada pixel gasto aqui sai do vídeo.
 */
export function CampaignProgress({ compact = false }: { compact?: boolean }) {
  if (!campaign) return null;

  const { raisedCents, goalCents, supporters } = campaign;
  // `min(100)` para a barra não vazar se a campanha passar da meta.
  const pct = goalCents > 0 ? Math.min(100, (raisedCents / goalCents) * 100) : 0;

  const bar = (
    <div
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Progresso da meta da campanha"
      className={`w-full overflow-hidden rounded-full bg-ink-900/10 ${compact ? "h-[6px]" : "h-[10px]"}`}
    >
      <div className="h-full rounded-full bg-donate" style={{ width: `${pct}%` }} />
    </div>
  );

  if (compact) {
    return (
      <div className="flex w-full flex-col gap-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-2">
          <p className="text-[clamp(0.875rem,0.8rem+0.4vw,1.0625rem)] font-extrabold leading-tight text-ink-900">
            {formatBRL(raisedCents)}{" "}
            <span className="text-[11px] font-semibold text-ink-600">
              de {formatBRL(goalCents)}
            </span>
          </p>
          <p className="text-[11px] font-extrabold text-donate">
            {Math.round(pct)}% da meta
          </p>
        </div>

        {bar}

        {/* Apoiadores some em tela baixa: é a linha menos decisiva do bloco, e
            a altura dela vale mais no vídeo. */}
        <p className="hidden items-center gap-1 text-[11px] font-semibold text-ink-600 [@media(min-height:700px)]:inline-flex">
          <IconUsers size={12} />
          {supporters} pessoas já ajudaram
        </p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col">
          <span className="text-[clamp(1.125rem,0.95rem+0.7vw,1.5rem)] font-extrabold leading-tight text-ink-900">
            {formatBRL(raisedCents)}
          </span>
          <span className="text-[12px] font-semibold text-ink-600">Arrecadados</span>
        </div>

        <div className="flex flex-col text-right">
          <span className="text-[clamp(1.125rem,0.95rem+0.7vw,1.5rem)] font-extrabold leading-tight text-ink-900">
            {formatBRL(goalCents)}
          </span>
          <span className="text-[12px] font-semibold text-ink-600">Meta</span>
        </div>
      </div>

      {bar}

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[12px] font-semibold">
        <span className="text-donate">{Math.round(pct)}% da meta atingida</span>
        <span className="inline-flex items-center gap-1 text-ink-600">
          <IconUsers size={14} />
          {supporters} pessoas já ajudaram
        </span>
      </div>
    </div>
  );
}
