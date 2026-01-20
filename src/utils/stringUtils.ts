/**
 * Extracts initials from a name string
 * Takes first letter of each word, up to 2 characters
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
