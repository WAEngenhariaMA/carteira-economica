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
