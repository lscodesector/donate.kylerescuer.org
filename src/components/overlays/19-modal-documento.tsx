"use client";

import NextImage, { type ImageProps } from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type SVGProps,
} from "react";
import { withBasePath } from "@/lib/base-path";
import { cnpjDocument, type Documento } from "@/lib/config";
import { DOCUMENTO_MODAL_EVENT } from "@/lib/modais";
import { useScrollLock } from "@/lib/scroll-lock";

/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  19 · MODAL DE DOCUMENTO                                              ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Bloco isolado: a moldura, o envelope de imagem e o ícone moram aqui. Quem
 * **abre** é `openDocumentoModal`, em `lib/modais` - assim a seção de
 * documentação e a ficha de abrigo mandam um documento para cá sem importar
 * este arquivo.
 */

/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  Um documento, num popup por cima da página                           ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Antes "Ver documento" era um `target="_blank"`: abria uma aba nova com só a
 * imagem, e quem doa saía do fluxo da campanha para conferir um documento.
 * Agora o clique abre este popup por cima da própria página - a pessoa nunca
 * sai daqui, e o botão no cabeçalho volta para onde ela estava.
 *
 * ── Um popup só, para todos os documentos ─────────────────────────────────
 * Ele começou servindo apenas o cartão CNPJ de quem recebe, e hoje serve também
 * o de cada abrigo (`Shelter.cnpjDoc`). Quem manda **qual** documento mostrar é
 * quem abre: `openDocumentoModal(documento)` leva a ficha junto no evento. Sem
 * argumento, continua abrindo o cartão da SOS Animal Help, que é o que os
 * chamadores antigos esperam.
 *
 * A instância é única e mora em `app/page.tsx`, fora do `<main>` - inclusive
 * porque ela abre **por cima da ficha do abrigo** (`z-65` contra `z-60`), que
 * já é um modal aberto quando o botão do CNPJ é clicado.
 */

/* ─────────────────────────────────────────────────────────── ícones ──── */

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 20, ...rest }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    focusable: false,
    ...rest,
  };
}

const IconArrowLeft = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M19 12H5" />
    <path d="m12 19-7-7 7-7" />
  </svg>
);

/* ────────────────────────────────────────────── utilitários do bloco ──── */

/**
 * `next/image` com o `basePath` do build prefixado no `src`.
 *
 * ⚠️ Com `images.unoptimized: true` (obrigatório num export estático - ver
 * `next.config.ts`), o `next/image` passa o `src` adiante sem tocar nele. É
 * comportamento documentado: o prefixo de `basePath` só acontece na URL do
 * otimizador (`/_next/image?url=…`), e sem otimizador não há essa URL para
 * prefixar. Sem este envelope, publicado em `doe.caioprotetor.org/v2`, toda
 * imagem apontaria para a raiz do domínio - que é outro site (WordPress) - e
 * simplesmente não carregaria.
 *
 * Só cobre `src` em string, que é o único formato usado aqui.
 */
function Image({ src, ...props }: ImageProps) {
  const prefixado = typeof src === "string" ? withBasePath(src) : src;
  return <NextImage src={prefixado} {...props} />;
}

/* ──────────────────────────────────────────────────────────── o bloco ──── */

/** Cartão da Receita em A4 em pé - o formato de quase todo documento daqui. */
const ASPECTO_PADRAO = "1600 / 2264";

export default function ModalDocumento() {
  /* O documento aberto *é* o estado de "está aberto": `null` é fechado. Um
     booleano separado abriria espaço para a combinação impossível - aberto sem
     documento -, que renderizaria uma moldura vazia numa página que pede
     dinheiro. */
  const [documento, setDocumento] = useState<Documento | null>(null);
  const fecharRef = useRef<HTMLButtonElement>(null);
  const gatilhoRef = useRef<HTMLElement | null>(null);

  useScrollLock(documento !== null);

  const fechar = useCallback(() => {
    setDocumento(null);
    gatilhoRef.current?.focus();
  }, []);

  useEffect(() => {
    const onAbrir = (e: Event) => {
      gatilhoRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setDocumento((e as CustomEvent<Documento>).detail ?? cnpjDocument);
    };
    window.addEventListener(DOCUMENTO_MODAL_EVENT, onAbrir);
    return () => window.removeEventListener(DOCUMENTO_MODAL_EVENT, onAbrir);
  }, []);

  useEffect(() => {
    if (!documento) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      /*
        Este popup pode estar aberto **por cima da ficha de um abrigo**, que
        também fecha no Esc. Sem as duas linhas abaixo, um Esc só fecharia os
        dois de uma vez: quem foi conferir o CNPJ voltaria para a lista, e não
        para a ficha de onde saiu.

        `capture: true` coloca este handler antes do da ficha (que escuta na
        subida); `stopPropagation` corta o caminho até lá e `preventDefault`
        marca o evento para a guarda `e.defaultPrevented` do outro lado, caso
        algum navegador entregue o evento assim mesmo.
      */
      e.preventDefault();
      e.stopPropagation();
      fechar();
    };

    window.addEventListener("keydown", onKey, true);
    fecharRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey, true);
  }, [documento, fechar]);

  if (!documento) return null;

  return (
    <div
      className="fixed inset-0 z-[65] flex items-end justify-center bg-night/80 p-0 anim-fade-in sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) fechar();
      }}
    >
      {/* #ui:modal-documento */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="documento-titulo"
        className="anim-fade-up flex max-h-[92dvh] w-full max-w-[520px] flex-col overflow-hidden rounded-t-lg bg-surface shadow-xl sm:rounded-lg"
      >
        <header className="flex shrink-0 items-center gap-2 border-b border-ink-900/10 px-3 py-2.5 sm:px-4">
          <button
            ref={fecharRef}
            type="button"
            onClick={fechar}
            aria-label="Voltar"
            className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full text-ink-600 transition-colors hover:bg-surface-alt hover:text-ink-900"
          >
            <IconArrowLeft size={20} />
          </button>
          <h2
            id="documento-titulo"
            className="flex-1 truncate text-center text-fs15 font-extrabold leading-tight text-ink-900"
          >
            {documento.title}
          </h2>
          <span aria-hidden="true" className="h-[40px] w-[40px] shrink-0" />
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-surface-alt p-3 sm:p-4">
          {/* `object-contain` e não `cover`: aqui a pessoa veio **ler** o
              documento, e recortar a borda de um cartão CNPJ é cortar
              justamente o que ela veio conferir. A proporção vem da ficha do
              documento (ver `Documento.aspect`) só para a moldura já nascer do
              tamanho certo - errar nela custa tarja em volta, nunca recorte. */}
          <div
            className="relative mx-auto w-full max-w-[420px] overflow-hidden rounded-md border border-ink-900/10 bg-white shadow"
            style={{ aspectRatio: documento.aspect ?? ASPECTO_PADRAO }}
          >
            <Image
              src={documento.src}
              alt={documento.alt}
              fill
              sizes="(min-width: 640px) 420px, 90vw"
              className="object-contain"
            />
          </div>

          {/* Só quando o número é público: o cartão de quem recebe tem, os dos
              abrigos ainda não. Legenda vazia viraria uma linha em branco. */}
          {documento.caption && (
            <p className="mt-3 text-center text-fs13 font-semibold tabular-nums text-ink-600">
              {documento.caption}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
