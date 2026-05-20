export function currentCompetence() {
  return new Date().toISOString().slice(0, 7);
}

export function shiftCompetence(competence: string, months: number) {
  const [year, month] = competence.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + months, 1));
  return date.toISOString().slice(0, 7);
}

export function nextCompetences(competence: string, count: number) {
  return Array.from({ length: count }, (_, index) => shiftCompetence(competence, index));
}

export function previousCompetence(competence: string) {
  return shiftCompetence(competence, -1);
}

export function sameDayInCompetence(date: string, competence: string) {
  const originalDay = Number(date.slice(8, 10)) || 1;
  const [year, month] = competence.split("-").map(Number);
  const lastDayOfMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const day = Math.min(originalDay, lastDayOfMonth);

  return `${competence}-${String(day).padStart(2, "0")}`;
}
