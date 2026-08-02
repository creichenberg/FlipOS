import type { Business } from '@/lib/types/database';

// Rendered once per business and placed first in every generation call's
// system prompt, with a cache_control breakpoint right after it (stable
// content first, variable content last - prompt caching is a strict prefix
// match). Repeated calls for the same business - e.g. generating detail for
// several cards in a row - reuse the cached block at ~10% of input cost.
export function buildBrandContextBlock(business: Business): string {
  const lines = [
    `Business name: ${business.name}`,
    `Industry: ${business.industry}`,
    `Products/services: ${business.products_services}`,
    `Target audience: ${business.target_audience}`,
    `Location: ${business.location}`,
  ];
  if (business.brand_personality.length > 0) {
    lines.push(`Brand personality: ${business.brand_personality.join(', ')}`);
  }
  if (business.goals.length > 0) {
    lines.push(`Social media goals: ${business.goals.join(', ')}`);
  }
  if (business.website) lines.push(`Website: ${business.website}`);

  return lines.join('\n');
}
