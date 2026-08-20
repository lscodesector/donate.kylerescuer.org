"use client";

import { useEffect, useState, type SVGProps } from "react";
import { pix } from "@/lib/config";

/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  08 · PIX DIRETO - a chave da campanha                                ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Bloco isolado: o texto e os ícones moram aqui.
 *
 * ⚠️ A **chave** não: ela vem de `lib/config`, e é o único dado desta página
 * que não dá para corrigir depois de alguém pagar. O checkout e a página
 * `/doar/valor` leem a mesma constante - uma cópia aqui dentro é uma cópia que
 * um dia diverge.
 */

/* ─────────────────────────────────────────────────── conteúdo do bloco ──── */

const copyPix = {
  eyebrow: "Pix direto",
  title: "Prefere doar direto pelo Pix?",
  text: "Você pode contribuir diretamente pelo aplicativo do seu banco, no valor que quiser.",
  steps: [
    "Copie a chave acima.",
    "Abra o aplicativo do seu banco e escolha Pix.",
    "Cole a chave, confira o recebedor e conclua a doação.",
  ],
};

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

const IconCheck = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m5 13 4 4L19 7" />
  </svg>
);

const IconCopy = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="9" y="9" width="12" height="12" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

/**
 * A marca do Pix como ela é distribuída - os quatro braços do losango, em
 * traçado cheio, transcrita do SVG oficial (SVG Repo) para componente: inline
 * ela herda a cor do texto (`currentColor`) e não custa uma requisição.
 *
 * O `.svg` de origem morava em `public/` e saiu de lá: servido, ele era um
 * arquivo publicado que nenhuma tela pedia - os dois `path` abaixo são o
 * arquivo inteiro, caractere por caractere.
 *
 * ⚠️ **É a única marca do Pix da página.** Havia um segundo desenho aqui, o
 * `IconPix` - um losango simplificado, redesenhado à mão, que as listas e os
 * selos usavam enquanto o checkout usava este. Dois desenhos diferentes para a
 * mesma marca, na mesma página, e o antigo não era o arquivo oficial. Ele saiu;
 * todo lugar que mostra o Pix aponta para cá.
 */
const IconPixMark = ({ size = 20, ...rest }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="currentColor"
    aria-hidden="true"
    focusable={false}
    {...rest}
  >
    <path d="M11.917 11.71a2.046 2.046 0 0 1-1.454-.602l-2.1-2.1a.4.4 0 0 0-.551 0l-2.108 2.108a2.044 2.044 0 0 1-1.454.602h-.414l2.66 2.66c.83.83 2.177.83 3.007 0l2.667-2.668h-.253zM4.25 4.282c.55 0 1.066.214 1.454.602l2.108 2.108a.39.39 0 0 0 .552 0l2.1-2.1a2.044 2.044 0 0 1 1.453-.602h.253L9.503 1.623a2.127 2.127 0 0 0-3.007 0l-2.66 2.66h.414z" />
    <path d="m14.377 6.496-1.612-1.612a.307.307 0 0 1-.114.023h-.733c-.379 0-.75.154-1.017.422l-2.1 2.1a1.005 1.005 0 0 1-1.425 0L5.268 5.32a1.448 1.448 0 0 0-1.018-.422h-.9a.306.306 0 0 1-.109-.021L1.623 6.496c-.83.83-.83 2.177 0 3.008l1.618 1.618a.305.305 0 0 1 .108-.022h.901c.38 0 .75-.153 1.018-.421L7.375 8.57a1.034 1.034 0 0 1 1.426 0l2.1 2.1c.267.268.638.421 1.017.421h.733c.04 0 .079.01.114.024l1.612-1.612c.83-.83.83-2.178 0-3.008z" />
  </svg>
);

/* ──────────────────────────────────────────────────────────── o bloco ──── */

/**
 * Pix direto: a chave, o botão de copiar e os três passos.
 *
 * É o caminho de menor atrito da página - quem já decidiu doar não precisa
 * passar por formulário nenhum. Fica em verde, a cor de doação do site, e
 * ocupa a faixa inteira para não ser confundido com um card comum.
 */
export default function PixDireto() {
  const [copied, setCopied] = useState(false);

  // Devolve o botão ao estado normal depois do aviso de "copiado".
  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 2500);
    return () => clearTimeout(id);
  }, [copied]);

  async function copiarChave() {
    try {
      await navigator.clipboard.writeText(pix.key);
      setCopied(true);
    } catch {
      // Navegador sem permissão de área de transferência (ou http sem TLS):
      // seleciona o texto para a pessoa copiar na mão em vez de não fazer nada.
      const node = document.getElementById("pix-key");
      if (node) {
        const range = document.createRange();
        range.selectNodeContents(node);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }
  }

  return (
    <section id="pix" className="bg-donate py-[clamp(2.5rem,6vh,4.5rem)] text-white">
      {/* #ui:pix-direto */}
      <div className="container-narrow flex max-w-[660px] flex-col gap-5">
        {/* Cabeça própria (esta seção é escura e o `SectionHead` é claro), mas
            centralizada igual às outras. O losango do Pix fica: é a marca do
            meio de pagamento, e não um ícone decorativo de título. */}
        <div className="flex flex-col items-center gap-1 text-center">
          <p className="flex items-center gap-2 text-fs13 font-extrabold uppercase tracking-[0.12em] text-white/80">
            <IconPixMark size={18} />
            {copyPix.eyebrow}
          </p>
          <h2 className="text-[clamp(1.279rem,0.977rem+1.209vw,1.976rem)] font-extrabold leading-[1.15] text-white">
            {copyPix.title}
          </h2>
          <p className="mx-auto max-w-[54ch] text-fs15 leading-[1.6] text-white/85">
            {copyPix.text}
          </p>
        </div>

        <div className="flex flex-col gap-3 rounded-md bg-white p-4 shadow sm:p-5">
          <div className="flex flex-col items-center gap-1 text-center sm:items-start sm:text-left">
            <span className="text-fs12 font-extrabold uppercase tracking-[0.06em] text-ink-600">
              Chave {pix.keyType}
            </span>
            <span
              id="pix-key"
              className="break-all text-[clamp(0.93rem,0.837rem+0.465vw,1.163rem)] font-extrabold text-ink-900"
            >
              {pix.key}
            </span>
            <span className="text-fs13 text-ink-600">
              Recebedor: <strong className="font-semibold text-ink-900">{pix.receiver}</strong>
            </span>
          </div>

          <button
            type="button"
            onClick={copiarChave}
            className={`inline-flex min-h-[52px] w-full items-center justify-center gap-2 whitespace-nowrap rounded-full px-6 text-fs15 font-extrabold uppercase tracking-[0.03em] transition-colors ${
              copied
                ? "bg-donate-hover text-donate-ink"
                : "bg-donate text-donate-ink hover:bg-donate-hover"
            }`}
          >
            {copied ? <IconCheck size={18} /> : <IconCopy size={18} />}
            {copied ? "Chave copiada!" : "Copiar chave Pix"}
          </button>
        </div>

        <ol className="flex flex-col gap-3">
          {copyPix.steps.map((step, i) => (
            /* Número à esquerda, frase ao lado, em qualquer largura - igual
               aos passos do Pix dentro do checkout. Já foi centralizado e
               empilhado no celular (bolinha em cima, texto embaixo), e ficava
               parecendo três blocos soltos em vez de uma lista de passos. */
            <li key={step} className="flex items-start gap-3 text-left">
              <span className="flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-full bg-white/20 text-fs13 font-extrabold text-white">
                {i + 1}
              </span>
              <p className="pt-0.5 text-fs14 leading-[1.5] text-white/90 sm:text-fs15">
                {step}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
