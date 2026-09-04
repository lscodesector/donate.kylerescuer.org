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

const TITLE = "Donate and Help Kyle Save More Than 400 Animals | Kyle Rescuer";
const DESCRIPTION =
  "Kyle is an animal rescuer who brings food, medicine and vet care to five shelters in SP, MG, BA and ES. More than 400 animals depend on every donation. Give by card or PayPal, whatever you can.";

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
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://donate.kylerescuer.org",
  ),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Kyle Rescuer",
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: withBasePath("/caio/historia/caio-1.webp"),
        width: 883,
        height: 947,
        alt: "Kyle Rescuer holding a rescued dog",
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
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body
        className="min-h-full flex flex-col bg-surface text-ink-900"
        suppressHydrationWarning
      >
        {/*
          Sem JavaScript o IntersectionObserver do `Reveal` nunca roda, e todo
          bloco animado ficaria em `opacity: 0` - a página inteira em branco.
          Esta regra devolve o conteúdo; a animação é enfeite, o texto não.

          ⚠️ Mora no `<body>`, e não num `<head>` escrito à mão: o root layout
          não pode declarar `<head>` (é o que a doc do Next manda em
          `file-conventions/layout`, e o que a regra de lint
          `@next/next/no-head-element` cobra). Com o `<head>` manual, o espaço
          em branco do JSX virava um nó de texto onde o Next insere o wrapper
          de metadata, e a hidratação falhava na raiz da árvore - o React
          descartava o HTML do servidor e reconstruía tudo no cliente, o que
          arrancava o `<vturb-smartplayer>` de baixo do player já montado
          (`Cannot set properties of null` + `Player already mounted`).

          `<style>` dentro de `<noscript>` no corpo é aceito por todos os
          navegadores - e sem JavaScript é a única forma de a regra chegar.
        */}
        <noscript>
          <style>{".reveal{opacity:1!important;transform:none!important}"}</style>
        </noscript>

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
          rota da página.

          Desde que a `/v2` passou a usar o player próprio em vez do VTurb
          (`heroPlayer="new"`, ver `v2/page.tsx`), essa marca só é consumida
          na `/`. Continua global e não movida pro `VturbPlayer`: rodar em
          toda rota é inofensivo (é só um timestamp que ninguém lê na `/v2`),
          e o motivo de ficar aqui - `beforeInteractive` só no layout raiz -
          continua valendo.
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
