export const parseDateString = (dateStr: string): Date | null => {
  const cleaned = dateStr.replace(/\./g, '/');
  const mmddyy = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (mmddyy) {
    const year = mmddyy[3].length === 2 ? 2000 + parseInt(mmddyy[3]) : parseInt(mmddyy[3]);
    return new Date(year, parseInt(mmddyy[1]) - 1, parseInt(mmddyy[2]));
  }
  const monthNames: Record<string, number> = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sept: 8, sep: 8, oct: 9, nov: 10, dec: 11 };
  const named = dateStr.match(/([A-Za-z]+)\s+(\d{1,2}),?\s*(\d{4})/);
  if (named) {
    const m = monthNames[named[1].toLowerCase()];
    if (m !== undefined) return new Date(parseInt(named[3]), m, parseInt(named[2]));
  }
  return null;
};

export const getDaysUntilTrip = (dateStr: string): string => {
  const tripDate = parseDateString(dateStr);
  if (tripDate) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    tripDate.setHours(0, 0, 0, 0);
    const diff = Math.ceil((tripDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff > 0) return `${diff} Days Away`;
    if (diff === 0) return "Today!";
    return `${Math.abs(diff)} Days Ago`;
  }
  return '';
};
