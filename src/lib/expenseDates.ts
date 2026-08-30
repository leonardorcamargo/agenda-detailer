export function localDate(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function monthlyDueDate(month: string, day: number): string {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month) || !Number.isInteger(day) || day < 1 || day > 31) {
    throw new Error('Informe um mês válido e um dia entre 1 e 31.');
  }
  const [year, monthNumber] = month.split('-').map(Number);
  const lastDay = new Date(year, monthNumber, 0).getDate();
  return `${month}-${String(Math.min(day, lastDay)).padStart(2, '0')}`;
}
