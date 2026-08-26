// French dates and age from YYYY-MM-DD. Used only for display.

export function formatDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function ageYears(iso: string, on = new Date()): number {
  const born = new Date(iso + "T00:00:00");
  let age = on.getFullYear() - born.getFullYear();
  const m = on.getMonth() - born.getMonth();
  if (m < 0 || (m === 0 && on.getDate() < born.getDate())) age -= 1;
  return age;
}
