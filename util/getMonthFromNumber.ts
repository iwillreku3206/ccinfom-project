export function getMonthFromNumber(month: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Return the month name corresponding to the 1-indexed month number
  return months[month - 1];
}
