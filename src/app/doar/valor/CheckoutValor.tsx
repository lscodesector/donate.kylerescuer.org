"use client";

import { useRouter, useSearchParams } from "next/navigation";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { CheckoutPix } from "./CheckoutPix";
import { org, pix } from "@/lib/config";
import { formatBRLCurto } from "@/lib/format";
import { gerarPixCopiaECola } from "@/lib/pix";

/**
 * O checkout de valor livre, montado no navegador.
 *
 * ── Por que aqui e não no servidor ────────────────────────────────────────
 * O site é estático (ver `next.config.ts`): `next build` gera **um** HTML por
 * rota, e este não pode conhecer o `?cents=` de ninguém. Ler a query no
 * servidor tornaria a rota dinâmica e quebraria o export. Então o BR Code e o
 * QR - que eram feitos em build no arquivo anterior - passaram para cá.
 *
 * A conta é a mesma de `lib/pix.ts` (montagem do payload) e do `qrcode` (o
 * desenho): o Pix gerado é idêntico ao que saía do servidor, com a chave real
 * da organização. O que muda é só quem faz a conta e quando.
 *
 * ── O que isso custa ──────────────────────────────────────────────────────
 * Sem JavaScript esta página fica vazia. Ela nunca foi alcançável sem
 * JavaScript de qualquer forma - quem chega aqui vem do modal de doação
 * mensal, que é um componente cliente; o caminho sem script é `/doar/<faixa>`,
 * que continua sendo montado em build.
 *
 * ⚠️ Como o checkout em página, esta tela **não confirma pagamento**: é Pix
 * estático, fora da conciliação do gateway. O aviso completo está em
 * `app/doar/valor/CheckoutPix.tsx`.
 */

/** Piso e teto de sanidade: a URL é editável por quem quiser. */
const MIN_CENTS = 100;
const MAX_CENTS = 100_000_00;

type Pagamento = { copiaECola: string; qrSvg: string };

export function CheckoutValor() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pagamento, setPagamento] = useState<Pagamento | null>(null);

  const cents = Number(searchParams.get("cents"));
  const mensal = searchParams.get("freq") === "mensal";
  const valorValido =
    Number.isInteger(cents) && cents >= MIN_CENTS && cents <= MAX_CENTS;

  // Valor inválido volta para a seção de doação, em vez de gerar um Pix quebrado.
  useEffect(() => {
    if (!valorValido) router.replace("/#doar");
  }, [valorValido, router]);

  useEffect(() => {
    if (!valorValido) return;

    /*
     * ⚠️ AQUI a mensal continua NÃO sendo recorrente - e não tem como ser.
     *
     * A recorrência de verdade (Pix Automático) existe desde 12/08/2026, no
     * `CheckoutModal`: ver `createRecurringCharge` em `lib/payments/lusa.ts`.
     * Ela depende de JavaScript - CPF validado, chamada ao gateway, `id_rec`
     * amarrado ao lead -, e esta rota é justamente o caminho de quem está
     * **sem** JavaScript: o Pix abaixo é estático, montado na chave da
     * organização, e cobra uma vez só.
     *
     * Por isso o texto da tela continua dizendo que a equipe combina os
     * próximos meses pelo WhatsApp: nesta rota, é o que de fato acontece.
     */
    const copiaECola = gerarPixCopiaECola({
      chave: pix.key,
      nome: pix.receiver,
      cidade: org.address.city.replace(/\s*–.*$/, ""),
      valorCents: cents,
      txid: mensal ? "DOACAOMENSAL" : "DOACAOUNICA",
    });

    let vivo = true;
    QRCode.toString(copiaECola, {
      type: "svg",
      errorCorrectionLevel: "M",
      margin: 0,
      color: { dark: "#14110F", light: "#FFFFFF" },
    }).then((qrSvg) => {
      // A pessoa pode ter trocado o valor (voltar/avançar) antes do QR ficar
      // pronto: sem isto, o código antigo sobrescreveria o novo.
      if (vivo) setPagamento({ copiaECola, qrSvg });
    });

    return () => {
      vivo = false;
    };
  }, [valorValido, cents, mensal]);

  // Enquanto o QR não fica pronto (ou o valor é inválido e estamos saindo), a
  // tela fica vazia - é fração de segundo, e `CheckoutPix` já tem a sua própria
  // encenação de "gerando o código" logo em seguida.
  if (!pagamento) return null;

  return (
    <CheckoutPix
      tier={null}
      titulo={mensal ? "Doação mensal" : "Doação única"}
      price={formatBRLCurto(cents)}
      descricao={
        mensal
          ? "Este Pix cobre o primeiro mês. A equipe combina os próximos com você pelo WhatsApp."
          : "Sua doação vira ração e cuidado nos abrigos que o Caio acompanha."
      }
      copiaECola={pagamento.copiaECola}
      qrSvg={pagamento.qrSvg}
    />
  );
}
