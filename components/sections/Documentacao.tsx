import { copy, googleReviews, org, whatsappHref } from "@/content/landing";
import { DocumentoCard } from "../DocumentoCard";
import { IconMail, IconPin, IconStar, IconWhatsApp } from "../ui/Icons";
import { Reveal } from "../ui/Reveal";
import { SectionHead } from "../ui/SectionHead";

/**
 * Documentação e canais oficiais.
 *
 * O card de avaliação do Google só aparece quando `googleReviews.enabled` for
 * `true` - enquanto não houver nota e número confirmados, ele fica fora da
 * interface. Publicar avaliação inventada numa página de doação é enganar quem
 * doa, e não é algo que se conserta depois.
 */
export function Documentacao() {
  return (
    <section id="documentacao" className="surface-alt py-[clamp(2.5rem,6vh,4.5rem)]">
      <div className="container-narrow flex max-w-[660px] flex-col gap-5">
        <SectionHead
          eyebrow={copy.documentacao.eyebrow}
          title={copy.documentacao.title}
          lead={copy.documentacao.lead}
        />

        {/* Cartão CNPJ: o documento em si, não só o número.
            O arquivo é a página A4 inteira (1600×2264) e mais de um terço dela
            embaixo é papel em branco - a moldura recorta a faixa útil e ancora
            no topo, onde estão o brasão, o número e a razão social. Abre num
            popup por cima da página (`DocumentoModal`), não numa aba nova -
            ver `DocumentoCard`. */}
        <Reveal>
          <DocumentoCard />
        </Reveal>

        <div className="grid gap-3 sm:grid-cols-2">
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-full flex-col items-center gap-1 rounded-md border border-ink-900/10 bg-surface p-4 text-center shadow transition-colors hover:border-donate/50 sm:items-start sm:text-left"
          >
            <span className="flex items-center gap-2 text-fs12 font-extrabold uppercase tracking-[0.06em] text-accent">
              <IconWhatsApp size={16} />
              WhatsApp
            </span>
            <span className="text-fs14 font-semibold text-ink-900">{org.whatsappDisplay}</span>
            <span className="text-fs12 leading-[1.4] text-ink-600">
              Fale diretamente com nossa equipe.
            </span>
            <span className="mt-auto pt-2 text-fs13 font-extrabold text-donate-text">
              Falar no WhatsApp
            </span>
          </a>

          <a
            href={`mailto:${org.email}`}
            className="flex h-full flex-col items-center gap-1 rounded-md border border-ink-900/10 bg-surface p-4 text-center shadow transition-colors hover:border-donate/50 sm:items-start sm:text-left"
          >
            <span className="flex items-center gap-2 text-fs12 font-extrabold uppercase tracking-[0.06em] text-accent">
              <IconMail size={16} />
              E-mail
            </span>
            {/* `break-words` e não `break-all`: só quebra quando não cabe, e no
                lugar certo. */}
            <span className="break-words text-fs13 font-semibold leading-[1.35] text-ink-900">
              {org.email}
            </span>
            <span className="text-fs12 leading-[1.4] text-ink-600">
              Dúvidas, informações e prestação de contas.
            </span>
            {/* O card inteiro já é o `mailto:`, mas sem esta linha ele era o
                único dos três sem chamada visível - só o endereço escrito,
                que se lê como informação e não como "clique aqui". `span`, e
                não `button`: um botão de verdade dentro do link seria
                interativo dentro de interativo. */}
            <span className="mt-auto flex items-center gap-1.5 pt-2 text-fs13 font-extrabold text-donate-text">
              <IconMail size={15} className="shrink-0" />
              Enviar e-mail
            </span>
          </a>

          <a
            href={org.mapsHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-full flex-col items-center gap-1 rounded-md border border-ink-900/10 bg-surface p-4 text-center shadow transition-colors hover:border-donate/50 sm:items-start sm:text-left sm:col-span-2"
          >
            <span className="flex items-center gap-2 text-fs12 font-extrabold uppercase tracking-[0.06em] text-accent">
              <IconPin size={16} />
              Endereço
            </span>
            <address className="text-fs14 not-italic leading-[1.5] text-ink-900">
              {org.address.line1}
              <br />
              {org.address.line2}, {org.address.city} · {org.address.zip}
            </address>
            <span className="mt-auto pt-2 text-fs13 font-extrabold text-donate-text">
              Ver localização
            </span>
          </a>

          {/* Só entra quando houver dado real - ver `googleReviews`. */}
          {googleReviews.enabled && (
            <a
              href={googleReviews.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-full flex-col items-center gap-1 rounded-md border border-ink-900/10 bg-surface p-4 text-center shadow transition-colors hover:border-donate/50 sm:items-start sm:text-left sm:col-span-2"
            >
              <span className="flex items-center gap-2 text-fs12 font-extrabold uppercase tracking-[0.06em] text-accent">
                <IconStar size={16} />
                Avaliação no Google
              </span>
              <span className="text-fs14 font-semibold text-ink-900">
                {googleReviews.rating.toFixed(1)} · {googleReviews.reviewCount} avaliações
              </span>
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
