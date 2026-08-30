import type { TipoValidade } from "../lib/api";
import { diasDesde, formatarDataCurta, tempoRelativo } from "../lib/tempoRelativo";

// Some da listagem sozinho com 3 dias sem confirmação (ver DIAS_LIMITE_ENQUANTO_ESTOQUE no
// backend) — o alerta acende 1 dia antes disso, como aviso de que está prestes a sumir.
const DIAS_PARA_ALERTA_ENVELHECIMENTO = 1;

interface SeloValidadeProps {
  tipoValidade: TipoValidade;
  validadeFim: string | null;
  extraidoEm: string;
}

function IconeCalendario() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
      <path d="M6 2a1 1 0 0 1 1 1v1h6V3a1 1 0 1 1 2 0v1h1a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1V3a1 1 0 0 1 1-1Zm10 6H4v8h12V8Z" />
    </svg>
  );
}

function IconeEstoque() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
      <path d="M10 2 2 5.5v9L10 18l8-3.5v-9L10 2Zm0 2.2 5.3 2.3L10 8.8 4.7 6.5 10 4.2ZM4 8.2l5 2.2v5.4l-5-2.2V8.2Zm7 7.6v-5.4l5-2.2v5.4l-5 2.2Z" />
    </svg>
  );
}

function IconeAlerta() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
      <path d="M10 2 1 18h18L10 2Zm0 5a1 1 0 0 1 1 1v4a1 1 0 1 1-2 0V8a1 1 0 0 1 1-1Zm0 8a1.1 1.1 0 1 1 0-2.2 1.1 1.1 0 0 1 0 2.2Z" />
    </svg>
  );
}

export function SeloValidade({ tipoValidade, validadeFim, extraidoEm }: SeloValidadeProps) {
  if (tipoValidade === "DATA_DEFINIDA") {
    const dataFormatada = validadeFim ? formatarDataCurta(validadeFim) : "?";
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800"
        aria-label={`Promoção válida até ${dataFormatada}`}
      >
        <IconeCalendario />
        Válido até {dataFormatada}
      </span>
    );
  }

  const dias = diasDesde(extraidoEm);
  const envelhecido = dias > DIAS_PARA_ALERTA_ENVELHECIMENTO;

  return (
    <div className="inline-flex flex-col items-end gap-0.5">
      <span
        className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800"
        aria-label={`Promoção enquanto durar o estoque, atualizada ${tempoRelativo(extraidoEm)}`}
      >
        <IconeEstoque />
        Enquanto durar o estoque
      </span>
      <span className="text-[11px] text-gray-500">atualizado {tempoRelativo(extraidoEm)}</span>
      {envelhecido && (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700">
          <IconeAlerta />
          confirme antes de ir ao mercado
        </span>
      )}
    </div>
  );
}

export function precoEstaEnvelhecido(tipoValidade: TipoValidade, extraidoEm: string): boolean {
  return tipoValidade === "ENQUANTO_DURAR_ESTOQUE" && diasDesde(extraidoEm) > DIAS_PARA_ALERTA_ENVELHECIMENTO;
}
