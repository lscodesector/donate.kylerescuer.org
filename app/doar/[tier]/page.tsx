import type { Metadata } from "next";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { CheckoutPix } from "@/components/checkout/CheckoutPix";
import { formatBRL, org, pix, rationTiers } from "@/content/landing";
import { gerarPixCopiaECola } from "@/lib/pix";

export const metadata: Metadata = {
  title: "Finalizar doação | SOS Animal Help",
  // Página de meio de fluxo: não deve aparecer em busca.
  robots: { index: false, follow: false },
};

/** Uma rota estática por faixa — as faixas são conhecidas em build. */
export function generateStaticParams() {
  return rationTiers.map((tier) => ({ tier: tier.id }));
}

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ tier: string }>;
}) {
  const { tier: tierId } = await params;
  const tier = rationTiers.find((t) => t.id === tierId);
  if (!tier) notFound();

  const price = formatBRL(tier.priceCents);

  /*
   * O BR Code é montado no servidor e o QR sai como SVG — nada disso custa
   * JavaScript no cliente, e o SVG fica nítido em qualquer densidade de tela.
   *
   * É um Pix estático de verdade, com a chave real da organização: quem ler o
   * código paga para a SOS Animal Help. O que a página NÃO tem é confirmação
   * de pagamento — ver o aviso em `CheckoutPix`.
   */
  const copiaECola = gerarPixCopiaECola({
    chave: pix.key,
    nome: pix.receiver,
    cidade: org.address.city.replace(/\s*–.*$/, ""),
    valorCents: tier.priceCents,
    txid: `RACAO${tier.kg}KG`,
  });

  const qrSvg = await QRCode.toString(copiaECola, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 0,
    color: { dark: "#14110F", light: "#FFFFFF" },
  });

  return (
    <CheckoutPix
      tier={{
        kg: tier.kg,
        price,
        animals: tier.animals,
        days: tier.days,
        image: tier.image,
      }}
      copiaECola={copiaECola}
      qrSvg={qrSvg}
    />
  );
}
