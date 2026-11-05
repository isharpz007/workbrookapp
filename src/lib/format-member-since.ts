const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function formatMemberSince(timestamp: string) {
  const match = /^(\d{4})-(\d{2})/.exec(timestamp);
  if (!match) return "Unknown";
  const year = match[1];
  const month = Number(match[2]);
  if (month < 1 || month > 12) return "Unknown";
  return `${MONTHS[month - 1]} ${year}`;
}
