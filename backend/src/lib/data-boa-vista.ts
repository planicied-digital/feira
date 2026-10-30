// Boa Vista-RR fica em UTC-4 o ano todo (Roraima não tem horário de verão). Usar o dia UTC fazia
// o app virar a data às 20h locais: um panfleto válido "até hoje" sumia 4 horas antes da hora.
const FUSO_BOA_VISTA_MS = -4 * 60 * 60 * 1000;

// Data de hoje no calendário de Boa Vista, como meia-noite UTC — o mesmo formato em que o Prisma
// devolve as colunas @db.Date (validade_inicio/validade_fim), então as comparações batem.
export function hojeEmBoaVista(agora: Date = new Date()): Date {
  const hoje = new Date(agora.getTime() + FUSO_BOA_VISTA_MS);
  hoje.setUTCHours(0, 0, 0, 0);
  return hoje;
}
