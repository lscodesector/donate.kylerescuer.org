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
import { org, whatsappWith } from "@/lib/config";
import { useShelterPhone } from "@/lib/hooks/use-shelter-phone";

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
  eyebrow: "Dúvidas frequentes",
  title: "Perguntas e respostas",
  lead: "Tire suas dúvidas sobre a campanha e sobre as doações.",
  help: "Não achou o que procurava?",
  ctaWhatsapp: "Falar no WhatsApp",
};

/**
 * As dúvidas - **cinco, e só cinco**.
 *
 * São as cinco perguntas da campanha do Caio, com as mesmas respostas.
 *
 * ⚠️ Se for acrescentar uma pergunta, tire outra. Cinco é o limite acordado.
 */
const faq = [
  {
    q: "A doação é segura?",
    a: "Sim. Os pagamentos são processados com segurança via Pix, um dos métodos de pagamento mais confiáveis do Brasil, com criptografia de ponta a ponta. Nenhum dado bancário é armazenado neste site.",
  },
  {
    q: "Existe valor mínimo?",
    a: "Não. Qualquer valor é bem-vindo: uma consulta ou um exame é pago com a soma de doações pequenas. Toda ajuda mantém vivas as mais de 500 vidas que dependem do Caio.",
  },
  {
    q: "Para onde vai o dinheiro exatamente?",
    a: "Direto para o tratamento dos animais: consultas, exames, medicamentos, vacinas e cirurgias de urgência nos abrigos que o Caio acompanha. Ele publica comprovantes mensais no Instagram.",
  },
  {
    q: "Posso doar o remédio em vez de dinheiro?",
    a: "Pode. Fale com a equipe no WhatsApp: ela diz o que está em falta no momento e para qual abrigo enviar. Em dinheiro, a consulta é marcada e o remédio comprado direto no fornecedor veterinário, com nota, e chega mais rápido a quem precisa começar o tratamento hoje.",
  },
  {
    q: "Quem é a SOS Animal Help?",
    a: "Organização brasileira de proteção animal que apoia protetores independentes como o Caio. É ela quem recebe as doações e faz o repasse com rastreabilidade, sob o CNPJ 63.153.881/0001-09.",
  },
  {
    q: "Vou receber um comprovante da minha doação?",
    a: "Sim. Assim que o Pix é confirmado, o comprovante fica disponível automaticamente no aplicativo do seu banco.",
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

const IconWhatsApp = ({ size = 28, ...rest }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    focusable={false}
    {...rest}
  >
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.2 8.2 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.79.97-.14.16-.29.18-.54.06-.25-.13-1.05-.39-1.99-1.23-.74-.65-1.24-1.46-1.38-1.71-.15-.25-.02-.38.11-.5.11-.11.25-.29.37-.44.13-.14.17-.24.25-.41.09-.16.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.47c-.16 0-.43.06-.65.31-.23.24-.86.84-.86 2.05s.88 2.38 1 2.54c.13.17 1.74 2.66 4.21 3.73.59.25 1.05.4 1.4.52.59.19 1.13.16 1.55.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.11-.22-.17-.47-.29Z" />
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
  const phone = useShelterPhone();
  const whatsappHref = whatsappWith(org.whatsappMessage, phone);

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
            mesmo WhatsApp que a última pergunta cita - o botão flutuante saiu
            da página, então este é o caminho de contato no meio dela. */}
        <Reveal delay={1} className="flex flex-col items-center gap-3 pt-2 text-center">
          <p className="text-fs15 text-ink-600">{copyFaq.help}</p>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[52px] items-center gap-2 whitespace-nowrap rounded-full bg-[#25D366] px-8 text-fs15 font-extrabold text-white shadow transition-[filter] hover:brightness-95"
          >
            <IconWhatsApp size={21} />
            {copyFaq.ctaWhatsapp}
          </a>
        </Reveal>
      </div>
    </section>
  );
}
