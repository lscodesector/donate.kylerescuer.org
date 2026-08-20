import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import Pixel from "@/components/tracking/20-pixel";
import { withBasePath } from "@/lib/base-path";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "600", "800"],
});

const TITLE = "Doe e Ajude o Caio a Salvar Mais de 400 Animais | Caio Protetor";
const DESCRIPTION =
  "O Caio é protetor e leva ração, remédios e veterinário a cinco abrigos em SP, MG, BA e ES. Mais de 400 animais dependem de cada doação. Doe via Pix, no valor que puder.";

export const metadata: Metadata = {
  /*
   * A base das URLs absolutas de metadata (canonical, og:image, twitter:image).
   *
   * O padrão é o endereço de produção, e não `localhost`, porque o site é
   * estático: o HTML é congelado em build e enviado por FTP (ver
   * `next.config.ts`). Se o build sair com `localhost`, é isso que o
   * WhatsApp e o Google leem - e ninguém percebe até o link já estar no ar.
   *
   * `NEXT_PUBLIC_SITE_URL` continua mandando, para buildar uma prévia em outro
   * endereço sem tocar neste arquivo.
   *
   * ⚠️ Fica só a origem (`https://dominio`, sem caminho): uma URL relativa que
   * começa com `/` **substitui** o caminho da base inteiro quando resolvida -
   * `new URL("/x", "https://a.com/v2")` dá `https://a.com/x`, não
   * `https://a.com/v2/x`. Por isso o `/v2` não entra aqui - ele entra em cada
   * caminho relativo abaixo, via `withBasePath`, que é o único jeito de as
   * duas partes somarem certo.
   */
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://doe.caioprotetor.org",
  ),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Caio Protetor",
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: withBasePath("/caio/historia/caio-1.webp"),
        width: 883,
        height: 947,
        alt: "Caio Protetor com um cão resgatado no colo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [withBasePath("/caio/historia/caio-1.webp")],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full antialiased`}>
      <head>
        {/*
          Sem JavaScript o IntersectionObserver do `Reveal` nunca roda, e todo
          bloco animado ficaria em `opacity: 0` - a página inteira em branco.
          Esta regra devolve o conteúdo; a animação é enfeite, o texto não.
        */}
        <noscript>
          <style>{".reveal{opacity:1!important;transform:none!important}"}</style>
        </noscript>
      </head>
      <body
        className="min-h-full flex flex-col bg-surface text-ink-900"
        suppressHydrationWarning
      >
        {children}

        {/*
          O pixel da Meta, que esta página não tinha. Fica no layout raiz para
          valer em qualquer rota (inclusive `/obrigado`), e é um componente de
          cliente que não renderiza nada - ver `components/tracking/20-pixel.tsx`.
        */}
        <Pixel />

        {/*
          Marca o instante em que a página começou a carregar - o player do
          VTurb (ver `VturbPlayer`) usa isto para medir o tempo até o vídeo
          aparecer. Fica aqui, e não dentro do componente do player, porque
          `beforeInteractive` só é aceito no layout raiz - é a única forma de o
          Next.js garantir que o script rode antes da hidratação em qualquer
          rota da página. Como as duas versões (v1 e v2) tocam o mesmo player,
          um script global não duplica nada.
        */}
        <Script
          id="vturb-plt"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html:
              "!function(i,n){i._plt=i._plt||(n&&n.timeOrigin?n.timeOrigin+n.now():Date.now())}(window,performance);",
          }}
        />
      </body>
    </html>
  );
}
