const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** Format an ISO date string (YYYY-MM-DD) as "Month Day" e.g. "May 5". Passes through non-ISO values unchanged. */
export const formatDisplayDate = (val: string): string => {
  if (!val) return val;
  const iso = val.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    return `${MONTH_NAMES[parseInt(iso[2], 10) - 1]} ${parseInt(iso[3], 10)}`;
  }
  return val;
};

/** Format a time string (HH:mm 24h, or already 12h) as short 12h with no leading zero and no AM/PM e.g. "7:30". */
export const formatDisplayTime = (val: string): string => {
  if (!val) return val;
  // Strip AM/PM if present and fix leading zero
  const withSuffix = val.match(/^(\d{1,2}):(\d{2})\s*(?:am|pm)/i);
  if (withSuffix) return `${parseInt(withSuffix[1], 10)}:${withSuffix[2]}`;
  // 24h HH:mm
  const h24 = val.match(/^(\d{1,2}):(\d{2})$/);
  if (h24) {
    let h = parseInt(h24[1], 10);
    const m = h24[2];
    if (h === 0) h = 12;
    else if (h > 12) h -= 12;
    return `${h}:${m}`;
  }
  return val;
};

export const parseDateString = (dateStr: string, fallbackYear?: number): Date | null => {
  const cleaned = dateStr.replace(/\./g, '/');
  const iso = cleaned.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) {
    return new Date(parseInt(iso[1]), parseInt(iso[2]) - 1, parseInt(iso[3]));
  }
  const mmddyy = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (mmddyy) {
    const year = mmddyy[3].length === 2 ? 2000 + parseInt(mmddyy[3]) : parseInt(mmddyy[3]);
    return new Date(year, parseInt(mmddyy[1]) - 1, parseInt(mmddyy[2]));
  }
  const monthNames: Record<string, number> = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sept: 8, sep: 8, oct: 9, nov: 10, dec: 11, january: 0, february: 1, march: 2, april: 3, june: 5, july: 6, august: 7, september: 8, october: 9, november: 10, december: 11 };

  // Try with year: "Sept 14, 2025" or "September 14 2025"
  const named = dateStr.match(/([A-Za-z]+)\s+(\d{1,2}),?\s*(\d{4})/);
  if (named) {
    const m = monthNames[named[1].toLowerCase()];
    if (m !== undefined) return new Date(parseInt(named[3]), m, parseInt(named[2]));
  }

  // Try without year: "Sept 14" or "Sept 14," — use fallbackYear
  if (fallbackYear) {
    const noYear = dateStr.match(/([A-Za-z]+)\s+(\d{1,2})/);
    if (noYear) {
      const m = monthNames[noYear[1].toLowerCase()];
      if (m !== undefined) return new Date(fallbackYear, m, parseInt(noYear[2]));
    }
  }

  return null;
};

export const getFormattedDate = (dateStr: string): string => {
  const tripDate = parseDateString(dateStr);
  if (!tripDate) return dateStr;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[tripDate.getMonth()]} ${tripDate.getDate()}, ${tripDate.getFullYear()}`;
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
