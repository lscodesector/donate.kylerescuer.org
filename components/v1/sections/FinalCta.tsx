import Image from "next/image";
import { copy } from "@/content/v1/landing";
import { DonateButton } from "../DonateButton";
import { IconHeart, IconShield } from "../ui/Icons";
import { Reveal } from "../ui/Reveal";

/**
 * Fechamento. A pessoa já viu o vídeo, as histórias, os valores e a
 * documentação - aqui só falta o botão, sem nada disputando espaço com ele.
 */
export function FinalCta() {
  return (
    <section className="relative overflow-hidden py-[clamp(3rem,7vh,5rem)]">
      <div className="absolute inset-0">
        <Image
          src="/sos-animal/voluntario-cao-colo.webp"
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-night/80" />
      </div>

      <div className="container-narrow relative flex max-w-[660px] flex-col gap-5">
        <Reveal className="flex flex-col gap-4">
          <h2 className="text-[clamp(1.5rem,1rem+2vw,2.375rem)] font-extrabold leading-[1.15] text-white">
            {copy.final.title}
          </h2>
          <p className="max-w-[58ch] text-[15px] leading-[1.65] text-white/80 sm:text-[16px]">
            {copy.final.text}
          </p>

          <DonateButton className="inline-flex min-h-[56px] w-full items-center justify-center gap-2 rounded-full bg-donate px-8 text-[clamp(1rem,1.8vh,1.125rem)] font-extrabold uppercase tracking-[0.03em] text-donate-ink shadow-[0_10px_30px_-8px_rgba(27,138,75,.6)] transition-colors hover:bg-donate-hover">
            <IconHeart size={20} />
            {copy.final.ctaPrimary}
          </DonateButton>

          {/* Leva ao FAQ da própria página, não ao WhatsApp: a dúvida se
              resolve aqui mesmo, sem tirar a pessoa do fluxo de doação. */}
          <a
            href="#duvidas"
            className="inline-flex min-h-[50px] w-full items-center justify-center gap-2 rounded-full border-2 border-white/25 bg-white/10 px-8 text-[15px] font-extrabold text-white transition-colors hover:bg-white/20"
          >
            {copy.final.ctaSecondary}
          </a>

          <p className="flex flex-wrap items-center justify-center gap-x-1.5 text-center text-[12px] font-semibold text-white/60">
            <IconShield size={15} className="shrink-0" />
            {copy.final.seal}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
