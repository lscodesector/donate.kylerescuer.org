import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "600", "800"],
});

const TITLE = "Doe Ração e Ajude Mais de 400 Animais | SOS Animal Help";
const DESCRIPTION =
  "Ajude a SOS Animal Help a manter cinco abrigos e mais de 400 animais alimentados. Escolha quanto doar e acompanhe com transparência o impacto da sua contribuição.";

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
   */
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://doe.sosanimalhelp.org",
  ),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "SOS Animal Help",
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: "/sos-animal/abrigo-patio-caes.webp",
        width: 1536,
        height: 1024,
        alt: "Cuidadora cercada por dezenas de cães resgatados no pátio do abrigo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/sos-animal/abrigo-patio-caes.webp"],
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
