const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** "12 March 2019" / "March 2019" / "2019" — only parts that were given. */
export function formatMemoryDate(
  year: number,
  month: number | null,
  day: number | null
) {
  if (day && month) return `${day} ${MONTHS[month - 1]} ${year}`;
  if (month) return `${MONTHS[month - 1]} ${year}`;
  return String(year);
}
