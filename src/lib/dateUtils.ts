/**
 * Utility to format blog post display dates.
 * If a post was edited/updated significantly after publication (> 2 minutes),
 * it returns "Updated on <Date>", otherwise returns the original publication date.
 */
export function getPostDisplayDate(
  publishedAt?: string | null,
  updatedAt?: string | null,
  options?: { format?: 'long' | 'short'; prefix?: string }
): {
  displayDate: string;
  isUpdated: boolean;
  publishedFormatted: string;
  updatedFormatted: string;
} {
  const pubDate = publishedAt ? new Date(publishedAt) : null;
  const updDate = updatedAt ? new Date(updatedAt) : null;

  const isValidPub = pubDate !== null && !isNaN(pubDate.getTime());
  const isValidUpd = updDate !== null && !isNaN(updDate.getTime());

  const formatStyle = options?.format || 'long';
  const dateOptions: Intl.DateTimeFormatOptions = formatStyle === 'short'
    ? { month: 'short', day: 'numeric', year: 'numeric' }
    : { month: 'long', day: 'numeric', year: 'numeric' };

  const publishedFormatted = isValidPub ? pubDate!.toLocaleDateString('en-US', dateOptions) : '';
  const updatedFormatted = isValidUpd ? updDate!.toLocaleDateString('en-US', dateOptions) : '';

  // Considered updated if updated_at is more than 2 minutes after published_at
  const isUpdated = Boolean(
    isValidPub &&
    isValidUpd &&
    updDate!.getTime() - pubDate!.getTime() > 120 * 1000
  );

  const prefix = options?.prefix !== undefined ? options.prefix : 'Updated on ';
  const displayDate = isUpdated && updatedFormatted
    ? `${prefix}${updatedFormatted}`
    : publishedFormatted;

  return {
    displayDate,
    isUpdated,
    publishedFormatted,
    updatedFormatted
  };
}
