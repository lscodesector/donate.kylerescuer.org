import type { ComponentType, SVGProps } from "react";
import { trustStrip } from "@/content/v1/landing";
import { IconBowl, IconCheck, IconFile, IconPix, IconShield, IconWhatsApp } from "../ui/Icons";
import { Reveal } from "../ui/Reveal";

type IconComponent = ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;

const ICONS: Record<string, IconComponent> = {
  shield: IconShield,
  file: IconFile,
  whatsapp: IconWhatsApp,
  pix: IconPix,
  bowl: IconBowl,
};

/**
 * Faixa curta de confiança, logo depois da barra de arrecadação.
 *
 * Vem cedo de propósito: a objeção "posso confiar nisso?" aparece no mesmo
 * instante em que a pessoa vê um pedido de dinheiro. São itens escaneáveis,
 * sem parágrafo — cada um é verificável em outro ponto da própria página.
 */
export function TrustStrip() {
  return (
    <section className="border-y border-ink-900/10 bg-surface py-6">
      <div className="container-narrow flex max-w-[660px] flex-col gap-3">
        <Reveal className="text-[15px] font-extrabold text-ink-900">{trustStrip.title}</Reveal>

        <ul className="flex flex-wrap gap-x-4 gap-y-2">
          {trustStrip.items.map((item) => {
            const Icon = ICONS[item.icon] ?? IconCheck;
            return (
              <li
                key={item.label}
                className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-600"
              >
                <Icon size={15} className="shrink-0 text-donate" />
                {item.label}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
