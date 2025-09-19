/**
 * Generate a URL-friendly slug from a title
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, '') // Remove special characters
    .replace(/ +/g, '-') // Replace spaces with hyphens
    .trim();
}

/**
 * Generate a unique slug by appending a number if needed
 */
export function generateUniqueSlug(title: string, existingSlugs: string[]): string {
  const baseSlug = slugify(title);
  let counter = 1;
  let uniqueSlug = baseSlug;

  while (existingSlugs.includes(uniqueSlug)) {
    uniqueSlug = `${baseSlug}-${counter}`;
    counter++;
  }

  return uniqueSlug;
}

/**
 * Format timestamp to human-readable date
 */
export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Capitalize first letter of a string
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Generate a random color for tags/categories
 */
export function getRandomColor(): string {
  const colors = [
    'bg-blue-100 text-blue-800',
    'bg-green-100 text-green-800',
    'bg-yellow-100 text-yellow-800',
    'bg-red-100 text-red-800',
    'bg-purple-100 text-purple-800',
    'bg-pink-100 text-pink-800',
    'bg-indigo-100 text-indigo-800',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}