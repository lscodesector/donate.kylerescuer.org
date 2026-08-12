"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  DOAR_HREF,
  copy,
  shelters,
  whatsappWith,
  type Shelter,
} from "@/content/landing";
import {
  IconArrowRight,
  IconClock,
  IconClose,
  IconFile,
  IconInstagram,
  IconPaw,
  IconPin,
  IconUsers,
  IconWhatsApp,
} from "../ui/Icons";
import { PhotoSlideshow } from "../ui/PhotoSlideshow";
import { Reveal } from "../ui/Reveal";

/**
 * A lista de abrigos e a ficha que abre no clique.
 *
 * Está separada de `Abrigos` porque só ela precisa de estado: a seção continua
 * sendo Server Component e manda para o cliente apenas a lista e o modal.
 *
 * ── O card tem um botão só ────────────────────────────────────────────────
 * "Saiba mais", e mais nada. O Instagram e o "Doar agora" que ficavam aqui
 * foram para dentro da ficha: o Instagram tirava a pessoa da página antes de
 * ela saber quem era o abrigo, e dois botões lado a lado num card de quatro
 * linhas disputavam o mesmo clique. Com um controle só, o card inteiro é
 * clicável sem nenhum truque de `z-index` - não há mais link por baixo do
 * botão que cobre o card.
 *
 * O botão visível é um `<span>`, não um `<button>`: quem recebe o clique e o
 * foco é o botão que cobre o card inteiro, e dois controles para a mesma ação
 * dariam duas paradas de teclado por abrigo.
 */
export function AbrigosLista({
  /**
   * Rótulo do botão de cada card, por `id` de abrigo. Sem isso, todos usam o
   * "Saiba mais" de `copy.abrigos.ctaProfile`, que é o da página principal.
   *
   * Existe por causa da `/alternativa`, cuja régua de copy pede que cada card
   * convide pelo nome ("Conhecer a Siulsan"). É um objeto, e não uma função,
   * porque quem passa a prop é um Server Component - função não atravessa a
   * fronteira do servidor para o cliente.
   */
  ctaLabels,
}: {
  ctaLabels?: Record<string, string>;
} = {}) {
  const [aberto, setAberto] = useState<Shelter | null>(null);

  // Quem abriu a ficha recebe o foco de volta quando ela fecha - sem isso, o
  // teclado volta para o começo da página e a pessoa perde o lugar na lista.
  const gatilho = useRef<HTMLButtonElement | null>(null);

  const fechar = useCallback(() => {
    setAberto(null);
    gatilho.current?.focus();
  }, []);

  return (
    <>
      <ul className="flex flex-col gap-4">
        {shelters.map((shelter, i) => {
          const ctaProfile = ctaLabels?.[shelter.id] ?? copy.abrigos.ctaProfile;
          return (
          <Reveal
            as="li"
            key={shelter.id}
            delay={(i % 3) as 0 | 1 | 2}
            className="relative flex flex-col overflow-hidden rounded-md border border-ink-900/10 bg-surface shadow transition-colors hover:border-accent/50 sm:flex-row"
          >
            {/* Sem `controls`: quem recebe o clique no card é o botão que cobre
                tudo e abre a ficha, e seta dentro dele disputaria esse clique.
                Aqui as fotos só passam; a ficha é que dá o comando.

                `4/3` no celular, e não a faixa larga de antes: as fotos vêm
                todas em 742×642 (quase quadradas) e num 16/10 o `object-cover`
                comia 13% em cima - que é justo onde estão os rostos de quem
                segura o animal. A partir de `sm` a altura é a da coluna de
                texto ao lado, que dá mais ou menos a mesma proporção da foto. */}
            <PhotoSlideshow
              photos={shelter.photos}
              label={shelter.name}
              focus="top"
              sizes="(min-width: 640px) 210px, 92vw"
              className="aspect-[4/3] w-full shrink-0 sm:aspect-auto sm:w-[210px] sm:self-stretch"
            />

            {/* No celular o card é uma coluna só e tudo fica centralizado;
                a partir de `sm` a foto entra ao lado e o texto volta a
                alinhar à esquerda, que é onde a leitura começa. */}
            <div className="flex flex-1 flex-col items-center gap-3 p-4 text-center sm:items-start sm:p-5 sm:text-left">
              <div className="flex flex-col gap-1">
                <h3 className="text-[17px] font-extrabold leading-[1.25] text-ink-900 sm:text-[18px]">
                  {shelter.name}
                </h3>

                <p className="flex items-center justify-center gap-1.5 text-[13px] font-semibold text-accent sm:justify-start">
                  <IconPin size={14} className="shrink-0" />
                  {shelter.location}
                </p>

                <p className="text-[14px] leading-[1.5] text-ink-600">
                  {shelter.description}
                </p>
              </div>

              {/* `mt-auto`: as descrições têm alturas diferentes e o botão
                  precisa alinhar na mesma base em toda a lista. */}
              <span
                aria-hidden="true"
                className="mt-auto inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-full bg-action px-5 text-center text-[13px] font-extrabold uppercase tracking-[0.02em] text-action-ink"
              >
                {ctaProfile}
                <IconArrowRight size={15} className="shrink-0" />
              </span>
            </div>

            <button
              type="button"
              aria-haspopup="dialog"
              aria-label={`${ctaProfile}: ${shelter.name}`}
              onClick={(e) => {
                gatilho.current = e.currentTarget;
                setAberto(shelter);
              }}
              /*
                O contorno entra para dentro (`-outline-offset`) porque o card
                tem `overflow-hidden` e cortaria um anel desenhado por fora.

                `z-40` porque as fotos do slide empilham em `z-10`/`z-20` para a
                troca não piscar (ver `PhotoSlideshow`). Sem z-index nenhum,
                este botão ficava **debaixo** da foto: o card se dizia todo
                clicável, mas o terço de cima - justamente a foto, que é o que a
                pessoa mira - não abria a ficha. `elementFromPoint` no meio da
                foto devolvia o `<img>`, não este botão.
              */
              className="absolute inset-0 z-40 cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
            />
          </Reveal>
          );
        })}
      </ul>

      {aberto && <FichaAbrigo shelter={aberto} onClose={fechar} />}
    </>
  );
}

/**
 * A ficha do abrigo.
 *
 * Mostra **apenas** o que estiver preenchido em `profile` (ver
 * `ShelterProfile`): linha vazia não vira campo em branco na tela. O endereço
 * cai para a cidade do card e o texto cai para a descrição, então a ficha nunca
 * abre vazia, mesmo em abrigo recém-cadastrado.
 *
 * Os três botões do rodapé, na ordem em que respondem à dúvida de quem chegou
 * até aqui: conferir por fora (Instagram), perguntar para alguém (WhatsApp da
 * equipe, já com o nome do abrigo na mensagem) e doar.
 */
function FichaAbrigo({
  shelter,
  onClose,
}: {
  shelter: Shelter;
  onClose: () => void;
}) {
  const fecharRef = useRef<HTMLButtonElement>(null);

  // Esc fecha e o scroll do fundo trava - sem isso a página rola atrás da ficha.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    fecharRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const { profile } = shelter;

  // Cada linha do endereço é opcional: monta com o que existir e, sem nada,
  // cai para a cidade do card - que é sempre melhor do que campo em branco.
  const endereco = [
    profile.address?.line1,
    profile.address?.line2,
    [profile.address?.city, profile.address?.zip].filter(Boolean).join(" · "),
  ].filter(Boolean) as string[];

  const dados = [
    { icon: IconUsers, label: "Responsável", value: profile.responsible },
    { icon: IconFile, label: "CNPJ", value: profile.cnpj },
    { icon: IconPaw, label: "Animais acolhidos", value: profile.animals },
    { icon: IconClock, label: "Atuando desde", value: profile.since },
  ].filter((linha) => linha.value);

  // Sem CNPJ e sem endereço, a ficha não tem o que a pessoa veio conferir:
  // avisa em vez de deixar parecer omissão. O botão do WhatsApp fica de todo
  // jeito, logo abaixo.
  const semCadastro = !profile.cnpj && !endereco.length;

  /*
   * O CTA de doar não é um `<a href="#doar">` simples: com a ficha ainda
   * aberta, o `body` está com `overflow: hidden` e o salto do navegador não
   * rola nada. Fecha primeiro e rola no quadro seguinte, quando a limpeza do
   * efeito já devolveu a rolagem. O `scroll-margin-top` das seções (globals)
   * cuida do cabeçalho fixo, e o `scroll-behavior: smooth` do documento cuida
   * da animação - inclusive de desligá-la em `prefers-reduced-motion`.
   */
  const doar = () => {
    onClose();
    requestAnimationFrame(() => {
      document.querySelector(DOAR_HREF)?.scrollIntoView();
    });
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-night/70 p-0 anim-fade-in sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ficha-abrigo-titulo"
        className="max-h-[92svh] w-full max-w-[520px] overflow-y-auto rounded-t-lg bg-surface shadow-xl sm:rounded-lg"
      >
        <div className="relative">
          {/* Na ficha o slide ganha seta e pontinho clicável: aqui não há botão
              por cima, e é este o lugar de olhar o abrigo com calma - inclusive
              voltando numa foto que já passou.

              `7/6` é a proporção em que as fotos chegam (742×642), então aqui
              elas aparecem inteiras, sem recorte nenhum. Na ficha isso importa
              mais do que no card: é a foto que a pessoa abriu para ver.

              O slide também anda mais devagar do que no card - quem abriu a
              ficha está olhando, não passando o olho. */}
          <PhotoSlideshow
            photos={shelter.photos}
            label={shelter.name}
            controls
            focus="top"
            interval={4000}
            sizes="(min-width: 640px) 520px, 100vw"
            className="aspect-[7/6] w-full"
          />

          {/* Fundo sólido atrás do X: sobre foto clara, ícone claro some. */}
          <button
            ref={fecharRef}
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="absolute right-3 top-3 flex h-[40px] w-[40px] items-center justify-center rounded-full bg-surface/90 text-ink-900 shadow backdrop-blur transition-colors hover:bg-surface"
          >
            <IconClose size={20} />
          </button>
        </div>

        <div className="flex flex-col gap-4 p-5 sm:p-6">
          <div className="flex flex-col gap-1">
            <span className="text-[12px] font-extrabold uppercase tracking-[0.08em] text-accent">
              {copy.abrigos.eyebrow}
            </span>
            <h2
              id="ficha-abrigo-titulo"
              className="text-[21px] font-extrabold leading-[1.2] text-ink-900"
            >
              {shelter.name}
            </h2>
            <p className="text-[14px] leading-[1.55] text-ink-600">
              {profile.about || shelter.description}
            </p>
          </div>

          <dl className="flex flex-col divide-y divide-ink-900/[.07] overflow-hidden rounded-md border border-ink-900/10">
            {dados.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-3 p-3.5">
                <Icon size={17} className="mt-0.5 shrink-0 text-accent" />
                <div className="flex min-w-0 flex-col">
                  <dt className="text-[12px] font-extrabold uppercase tracking-[0.06em] text-ink-600">
                    {label}
                  </dt>
                  {/* `break-words`: CNPJ e nome comprido não podem estourar a
                      largura da ficha no celular. */}
                  <dd className="break-words text-[14px] leading-[1.45] text-ink-900">
                    {value}
                  </dd>
                </div>
              </div>
            ))}

            {/* O endereço é a última linha e tem tratamento próprio: são várias
                linhas (rua com número, complemento, cidade e CEP) e pode levar
                o link do mapa junto. */}
            <div className="flex items-start gap-3 p-3.5">
              <IconPin size={17} className="mt-0.5 shrink-0 text-accent" />
              <div className="flex min-w-0 flex-col">
                <dt className="text-[12px] font-extrabold uppercase tracking-[0.06em] text-ink-600">
                  Endereço
                </dt>
                <dd className="break-words text-[14px] leading-[1.45] text-ink-900">
                  {endereco.length ? (
                    <address className="not-italic">
                      {endereco.map((linha) => (
                        <span key={linha} className="block">
                          {linha}
                        </span>
                      ))}
                    </address>
                  ) : (
                    shelter.location
                  )}

                  {profile.mapsHref && (
                    <a
                      href={profile.mapsHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 flex items-center gap-1 text-[13px] font-extrabold text-action transition-colors hover:text-accent"
                    >
                      Ver no mapa
                      <IconArrowRight size={14} className="shrink-0" />
                    </a>
                  )}
                </dd>
              </div>
            </div>
          </dl>

          {semCadastro && (
            <p className="rounded-md bg-surface-alt p-3.5 text-[13px] leading-[1.5] text-ink-600">
              {copy.abrigos.profileEmpty}
            </p>
          )}

          <div className="flex flex-col gap-2">
            {/* Some inteiro quando o abrigo não tem perfil publicado - é o caso
                do Abrigo Dona Rose. Um botão de Instagram com `href=""`
                recarrega a própria página, que é pior do que não ter botão. */}
            {shelter.instagramHref && (
              <a
                href={shelter.instagramHref}
                target="_blank"
                rel="noopener noreferrer"
                /* `flex-wrap` + `py-3`: o rótulo mais o arroba passa da largura
                   num celular estreito, e é melhor quebrar em duas linhas do
                   que espremer o texto. */
                className="inline-flex min-h-[48px] flex-wrap items-center justify-center gap-x-2 gap-y-0.5 rounded-md border border-ink-900/10 px-4 py-3 text-center text-[14px] font-extrabold text-ink-900 transition-colors hover:border-accent/50 hover:text-accent"
              >
                <IconInstagram size={17} className="shrink-0" />
                {copy.abrigos.ctaInstagram}
                <span className="font-semibold text-ink-600">
                  {shelter.instagram}
                </span>
              </a>
            )}

            {/* A mensagem já vai com o nome do abrigo: do outro lado, a equipe
                sabe de qual deles a pessoa está falando sem ter que perguntar. */}
            <a
              href={whatsappWith(
                `Olá! Queria saber mais sobre o abrigo ${shelter.name}, que aparece na campanha do Caio Protetor.`,
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-md border border-donate/30 px-4 text-[14px] font-extrabold text-donate transition-colors hover:bg-donate/[.06]"
            >
              <IconWhatsApp size={17} className="shrink-0" />
              {copy.abrigos.ctaWhatsapp}
            </a>

            <button
              type="button"
              onClick={doar}
              className="mt-1 inline-flex min-h-[56px] w-full items-center justify-center gap-2 rounded-full bg-donate px-6 text-[15px] font-extrabold uppercase tracking-[0.03em] text-donate-ink shadow transition-colors hover:bg-donate-hover"
            >
              {copy.abrigos.ctaShelter}
              <IconArrowRight size={17} />
            </button>

            {/* A doação é para a campanha, não para este abrigo - dizer isso
                aqui, onde a pessoa acabou de se afeiçoar a um nome, evita a
                promessa que a página não cumpre. */}
            <p className="text-center text-[12px] leading-[1.5] text-ink-600">
              A doação entra na campanha e o Caio direciona a ajuda conforme a
              necessidade de cada abrigo no mês.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
