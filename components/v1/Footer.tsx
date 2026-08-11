import Image from "next/image";
import Link from "next/link";
import { copy, org, recurringHref } from "@/content/v1/landing";
import { IconMail, IconPin, IconShield } from "./ui/Icons";

const COLUMNS = [
  {
    label: "Ajude",
    links: [
      { label: "Doe ração", href: "#racao" },
      { label: "Doar via Pix", href: "#pix" },
      { label: "Doação recorrente", href: recurringHref },
    ],
  },
  {
    label: "SOS Animal Help",
    links: [
      { label: "Transparência", href: "#transparencia" },
      { label: "Contato", href: "#documentacao" },
    ],
  },
  {
    label: "Legal",
    links: [
      { label: "Termos de Uso", href: "/termos" },
      { label: "Política de Privacidade", href: "/privacidade" },
      { label: "Política de Doação", href: "/politica-de-doacao" },
    ],
  },
];

export function Footer() {
  return (
    /* `pb` generoso: a barra fixa de doação e o botão do WhatsApp ficam
       ancorados no rodapé da janela e cobririam as últimas linhas daqui. */
    <footer id="contato" className="bg-graphite pb-[112px] text-white md:pb-[96px]">
      <div aria-hidden="true" className="h-[3px] w-full bg-action" />

      <div className="container-narrow flex flex-col gap-12 pt-16">
        <div className="grid gap-12 md:grid-cols-[minmax(0,320px)_1fr]">
          <div className="flex flex-col items-center gap-6 text-center md:items-start md:text-left">
            <Image
              src="/logo/logo-footer.webp"
              alt={org.name}
              width={1024}
              height={765}
              className="h-[48px] w-auto object-contain"
            />

            <p className="max-w-[42ch] text-[15px] leading-[1.65] text-white/60">
              {copy.footerAbout}
            </p>

            {/* Bloco de redes sociais removido: tinha um ícone só, o do
                WhatsApp, e barra de redes com um item lê como barra quebrada.
                Melhor nenhum ícone do que um isolado — o canal continua na
                seção de documentação, com o número escrito. */}

            <div className="flex flex-col gap-2 text-[14px] text-white/60">
              <p className="flex items-center gap-2">
                <IconShield size={16} />
                <span className="tabular-nums">CNPJ {org.cnpj}</span>
              </p>

              <a
                href={`mailto:${org.email}`}
                className="flex min-h-[44px] w-fit items-center gap-2 transition-colors hover:text-white"
              >
                <IconMail size={16} />
                {org.email}
              </a>

              <address className="flex items-start gap-2 not-italic leading-[1.5]">
                <IconPin size={16} className="mt-0.5 shrink-0" />
                <span>
                  {org.address.line1} — {org.address.line2}, {org.address.city}
                </span>
              </address>
            </div>
          </div>

          <div className="grid gap-8 text-center sm:grid-cols-3 sm:text-left">
            {COLUMNS.map((column) => (
              <nav key={column.label} aria-label={column.label}>
                <p className="mb-4 text-[12px] font-extrabold uppercase tracking-[0.14em] text-white">
                  {column.label}
                </p>
                <ul className="flex flex-col gap-2">
                  {column.links.map((link) => (
                    <li key={link.href + link.label}>
                      <Link
                        href={link.href}
                        className="block py-1 text-[15px] text-white/65 transition-colors hover:text-white"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 text-center text-[13px] leading-[1.6] text-white/50 md:text-left">
          {/* Os links legais já estão na coluna "Legal" — repetir aqui só
              duplicaria o mesmo destino duas vezes na mesma tela. */}
          <p>
            © {new Date().getFullYear()} {org.name}. Todos os direitos reservados.
          </p>
        </div>

      </div>
    </footer>
  );
}
