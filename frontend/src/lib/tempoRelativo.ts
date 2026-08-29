import { formatDistanceToNow, differenceInDays, format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export function tempoRelativo(dataIso: string): string {
  return formatDistanceToNow(parseISO(dataIso), { addSuffix: true, locale: ptBR });
}

export function diasDesde(dataIso: string): number {
  return differenceInDays(new Date(), parseISO(dataIso));
}

export function formatarDataCurta(dataIso: string): string {
  return format(parseISO(dataIso), "dd/MM", { locale: ptBR });
}
