import type { Metadata } from "next";
import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { CheckoutPix } from "@/components/checkout/CheckoutPix";
import { formatBRL, org, pix } from "@/content/landing";
import { gerarPixCopiaECola } from "@/lib/pix";

export const metadata: Metadata = {
  title: "Finalizar doação | SOS Animal Help",
  robots: { index: false, follow: false },
};

/** Piso e teto de sanidade: a URL é editável por quem quiser. */
const MIN_CENTS = 100;
const MAX_CENTS = 100_000_00;

export default async function CheckoutValorPage({
  searchParams,
}: {
  searchParams: Promise<{ cents?: string; freq?: string }>;
}) {
  const { cents: centsParam, freq } = await searchParams;

  const cents = Number(centsParam);
  // Valor inválido volta para a página em vez de gerar um Pix quebrado.
  if (!Number.isInteger(cents) || cents < MIN_CENTS || cents > MAX_CENTS) {
    redirect("/#racao");
  }

  const mensal = freq === "mensal";
  const price = formatBRL(cents);

  /*
   * ⚠️ MENSAL AINDA NÃO É RECORRENTE.
   *
   * O Pix estático abaixo cobra UMA vez — não existe gateway de assinatura
   * ligado nesta página. Enquanto for assim, o texto na tela diz que a equipe
   * combina os próximos meses; quando entrar o provedor de pagamento, é aqui
   * que a cobrança recorrente deve ser criada, no lugar deste Pix.
   */
  const copiaECola = gerarPixCopiaECola({
    chave: pix.key,
    nome: pix.receiver,
    cidade: org.address.city.replace(/\s*–.*$/, ""),
    valorCents: cents,
    txid: mensal ? "DOACAOMENSAL" : "DOACAOUNICA",
  });

  const qrSvg = await QRCode.toString(copiaECola, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 0,
    color: { dark: "#14110F", light: "#FFFFFF" },
  });

  return (
    <CheckoutPix
      tier={null}
      titulo={mensal ? "Doação mensal" : "Doação única"}
      price={price}
      descricao={
        mensal
          ? "Este Pix cobre o primeiro mês. A equipe combina os próximos com você pelo WhatsApp."
          : "Sua doação vira ração e cuidado para os animais da rede."
      }
      copiaECola={copiaECola}
      qrSvg={qrSvg}
    />
  );
}
