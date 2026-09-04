"use client";

import {
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
  type ReactNode,
  type SVGProps,
} from "react";
import { useShelterEmail } from "@/lib/hooks/use-shelter-phone";

/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  13 · FAQ - as cinco dúvidas                                          ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Bloco isolado: as cinco perguntas, a cabeça de seção e os ícones moram
 * aqui. De fora entra só o link do WhatsApp, que é o mesmo do rodapé e da
 * ficha de abrigo.
 */

/* ─────────────────────────────────────────────────── conteúdo do bloco ──── */

const copyFaq = {
  eyebrow: "Frequently asked questions",
  title: "Questions and answers",
  lead: "Clear up your doubts about the campaign and about the donations.",
  help: "Did not find what you were looking for?",
  ctaEmail: "Email us",
};

/**
 * As dúvidas - **cinco, e só cinco**.
 *
 * São as cinco perguntas da campanha do Kyle, com as mesmas respostas.
 *
 * ⚠️ Se for acrescentar uma pergunta, tire outra. Cinco é o limite acordado.
 */
const faq = [
  {
    q: "Is the donation safe?",
    a: "Yes. Payments are processed by PayPal on their own encrypted screen - with a credit or debit card, or with your PayPal balance. No card details are typed on this site or stored by us.",
  },
  {
    q: "Is there a minimum amount?",
    a: "No. Any amount is welcome: a vet visit or a test gets paid for by small donations added up. All help keeps alive the more than 500 lives that depend on Kyle.",
  },
  {
    q: "Where exactly does the money go?",
    a: "Straight into treating the animals: vet visits, tests, medicine, vaccines and emergency surgeries at the shelters Kyle follows. He posts monthly receipts on Instagram.",
  },
  {
    q: "Can I donate medicine instead of money?",
    a: "You can. Email the team: they will tell you what is missing right now and which shelter to send it to. In cash, the vet visit gets booked and the medicine bought straight from the veterinary supplier, with an invoice, and it reaches whoever needs to start treatment today faster.",
  },
  {
    q: "Who is SOS Animal Help?",
    a: "A Brazilian animal protection organization that supports independent rescuers like Kyle. It is the one that receives the donations and passes them on with full traceability, under EIN 41-4770760.",
  },
  {
    q: "Will I get a receipt for my donation?",
    a: "Yes. PayPal emails you a receipt as soon as the payment goes through, and it stays in your PayPal activity.",
  },
] as const;

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

const IconChevron = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const IconMail = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="2.8" y="5" width="18.4" height="14" rx="2" />
    <path d="m3.4 6.6 8.6 6 8.6-6" />
  </svg>
);

/* ────────────────────────────────────────────── utilitários do bloco ──── */

/**
 * Revelação ao entrar na viewport. Sem biblioteca: IntersectionObserver +
 * uma classe CSS. Dispara uma vez e desconecta.
 *
 * O estado começa em `false` nos dois lados - servidor e cliente. Já esteve
 * começando em `typeof IntersectionObserver === 'undefined'`, que no servidor
 * dá `true` e no navegador dá `false`: o HTML saía com `data-visible="true"` e
 * a hidratação reclamava do atributo que não batia. Como o React não corrige
 * atributo divergente, o elemento ficava preso no estado "já revelado" e a
 * animação inteira não acontecia.
 *
 * Quem cobre o caso de JavaScript desligado é o `<noscript>` do layout, que
 * força `.reveal` a ficar visível - a lógica de exibir sem JS é do CSS, não
 * deste componente.
 */
function Reveal({
  children,
  delay = 0,
  as: Tag = "div",
  className = "",
  id,
  style,
}: {
  children: ReactNode;
  delay?: 0 | 1 | 2 | 3;
  as?: "div" | "section" | "li" | "article";
  className?: string;
  id?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Navegador sem IntersectionObserver: mostra tudo. A escrita é direta no
    // DOM, e não `setVisible`, porque chamar setState no corpo do efeito
    // dispara uma renderização em cascata (e a regra de lint que a proíbe).
    if (typeof IntersectionObserver === "undefined") {
      node.dataset.visible = "true";
      return;
    }

    /*
     * Já dentro da primeira tela quando a página carrega: revela na hora, sem
     * passar pelo observer.
     *
     * O `rootMargin` abaixo tira 12% da borda de baixo da área de detecção
     * para o bloco só acender quando já entrou de verdade na tela - o que é o
     * comportamento certo para quem está rolando, e o errado para quem acabou
     * de chegar. Numa janela de 800px, esses 12% viram uma faixa morta de
     * 96px: o botão de doar do hero caía dentro dela, nunca intersectava, e
     * ficava em `opacity: 0` até a pessoa rolar - numa dobra em que ele já
     * estava visível o tempo todo, só que transparente.
     *
     * A comparação é com `window.innerHeight` puro, sem a margem, porque a
     * pergunta aqui é outra: não é "já entrou o bastante ao rolar?", é "está
     * na tela agora?".
     */
    if (node.getBoundingClientRect().top < window.innerHeight) {
      node.dataset.visible = "true";
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.05 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const delayClass = delay ? `reveal-delay-${delay}` : "";

  return (
    <Tag
      // @ts-expect-error: ref polimórfico entre div/section/li/article
      ref={ref}
      id={id}
      style={style}
      data-visible={visible}
      className={`reveal ${delayClass} ${className}`}
    >
      {children}
    </Tag>
  );
}

type IconComponent = ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;

/**
 * Cabeça de seção: eyebrow, título e linha de apoio.
 *
 * ── O padrão da página é sem ícone e centralizado ─────────────────────────
 * O ícone em quadrado colorido e o alinhamento à esquerda saíram de todas as
 * seções: o ícone não dizia nada que o título já não dissesse e, alinhado à
 * esquerda, empurrava o texto criando uma margem diferente da do conteúdo logo
 * abaixo. Uma página com dez seções alinhadas do mesmo jeito lê como uma coisa
 * só. Por isso os defaults são estes - quem não passa nada recebe o padrão.
 *
 * `icon` e `align` existem para a exceção: hoje só a seção de transparência,
 * que reproduz o layout da v1 (ícone de barras + título à esquerda, sobre a
 * tabela de custos). Antes de usar em outra seção, vale lembrar que cada uso
 * é uma cabeça a menos alinhada com o resto da página.
 *
 * O conteúdo *abaixo* da cabeça continua livre para alinhar como fizer
 * sentido - e a maioria alinha à esquerda a partir de `sm`.
 */
function SectionHead({
  icon: Icon,
  eyebrow,
  title,
  lead,
  align = "center",
  className = "",
}: {
  icon?: IconComponent;
  eyebrow?: string;
  title: ReactNode;
  lead?: string;
  align?: "left" | "center";
  className?: string;
}) {
  const centered = align === "center";

  return (
    <Reveal
      className={`flex flex-col gap-3 ${centered ? "items-center text-center" : ""} ${className}`}
    >
      {/* Centralizado, o ícone fica acima do título (coluna); à esquerda, ele
          fica ao lado (linha) - é o que o layout da v1 desenha. */}
      <div className={`flex gap-3 ${centered ? "flex-col items-center" : "items-center"}`}>
        {Icon && (
          <span className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-sm bg-accent-soft text-accent">
            <Icon size={22} />
          </span>
        )}

        <div className={`flex flex-col gap-1 ${centered ? "items-center" : ""}`}>
          {eyebrow && (
            <p className="text-fs13 font-extrabold uppercase tracking-[0.12em] text-accent">
              {eyebrow}
            </p>
          )}
          <h2 className="text-[clamp(1.279rem,0.977rem+1.209vw,1.976rem)] font-extrabold leading-[1.15] text-ink-900">
            {title}
          </h2>
        </div>
      </div>

      {lead && (
        <p
          className={`max-w-[62ch] text-fs16 leading-[1.6] text-ink-600 ${centered ? "mx-auto" : ""}`}
        >
          {lead}
        </p>
      )}
    </Reveal>
  );
}

/* ──────────────────────────────────────────────────────────── o bloco ──── */

/**
 * As dúvidas, em `<details>`/`<summary>` nativos: acordeão sem JavaScript,
 * acessível por teclado de graça e sem custo de bundle.
 *
 * São cinco perguntas, e o corte está documentado em `faq`, no
 * `content/landing.ts` - não em quantas cabem na tela.
 *
 * ── Alinhamento no celular ────────────────────────────────────────────────
 * Pergunta e resposta ficavam centralizadas abaixo de `sm`, e havia um vão
 * fantasma (`w-[17px]`) do lado esquerdo do `<summary>` só para compensar a
 * largura da seta e o texto cair no centro exato. Texto centralizado numa
 * lista de perguntas é o que mais custa a ler no celular: cada linha começa
 * num ponto diferente, e a resposta, com três ou quatro linhas, vira um
 * losango. Agora as duas alinham à esquerda em qualquer largura, o vão
 * fantasma saiu e a seta é o único elemento à direita.
 */
export default function Faq() {
  const email = useShelterEmail();

  return (
    <section id="duvidas" className="py-[clamp(2.5rem,6vh,4.5rem)]">
      {/* #ui:faq */}
      <div className="container-narrow flex max-w-[660px] flex-col gap-5">
        <SectionHead
          eyebrow={copyFaq.eyebrow}
          title={copyFaq.title}
          lead={copyFaq.lead}
        />

        <Reveal className="flex flex-col gap-2">
          {faq.map((item) => (
            <details
              key={item.q}
              className="group rounded-md border border-ink-900/10 bg-surface open:shadow"
            >
              <summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 text-left text-fs15 font-extrabold leading-[1.35] text-ink-900">
                <span className="flex-1">{item.q}</span>
                <IconChevron
                  size={18}
                  className="mt-0.5 shrink-0 self-start text-ink-600 transition-transform group-open:rotate-180"
                />
              </summary>
              {/* `pt-0` com o respiro vindo do `pb` do `<summary>`: sem isso a
                  resposta abria colada na pergunta no celular. */}
              <p className="px-4 pb-4 text-left text-fs14 leading-[1.6] text-ink-600">
                {item.a}
              </p>
            </details>
          ))}
        </Reveal>

        {/* Quem chega ao fim da lista sem achar a resposta não fica num beco
            sem saída. É o único link para fora desta seção, e ele vai para o
            mesmo e-mail que a última pergunta cita - o botão flutuante saiu
            da página, então este é o caminho de contato no meio dela. */}
        <Reveal delay={1} className="flex flex-col items-center gap-3 pt-2 text-center">
          <p className="text-fs15 text-ink-600">{copyFaq.help}</p>
          <a
            href={`mailto:${email}`}
            className="inline-flex min-h-[52px] items-center gap-2 whitespace-nowrap rounded-full bg-donate px-8 text-fs15 font-extrabold text-donate-ink shadow transition-colors hover:bg-donate-hover"
          >
            <IconMail size={21} />
            {copyFaq.ctaEmail}
          </a>
        </Reveal>
      </div>
    </section>
  );
}
