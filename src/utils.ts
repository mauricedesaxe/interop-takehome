/**
 * Returns the time since a given timestamp in a human-readable format
 * @param timestampUTC - The timestamp to compare against
 * @param currentTime - The current time (I want to pass it in to trigger re-renders)
 * @returns The time since the given timestamp in a human-readable format
 */
export function getTimeSince(
  timestampUTC: string,
  currentTime: number
): string {
  const timeDiff = currentTime - new Date(timestampUTC).getTime();
  const seconds = Math.floor(timeDiff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) {
    return `${hours}h ago`;
  } else if (minutes > 0) {
    return `${minutes}m ago`;
  } else if (seconds > 0) {
    return `${seconds}s ago`;
  } else {
    return "just now";
  }
}
