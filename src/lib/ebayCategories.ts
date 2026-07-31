// A curated subset of eBay's top-level category IDs, scoped to categories
// resellers actually flip. Not exhaustive - eBay's full taxonomy has
// thousands of leaf categories; this is a "good enough to filter" list.
export const EBAY_CATEGORIES: { label: string; categoryId?: string }[] = [
  { label: 'All categories' },
  { label: 'Consumer Electronics', categoryId: '293' },
  { label: 'Cameras & Photo', categoryId: '625' },
  { label: 'Video Games & Consoles', categoryId: '1249' },
  { label: 'Clothing, Shoes & Accessories', categoryId: '11450' },
  { label: 'Collectibles', categoryId: '1' },
  { label: 'Sporting Goods', categoryId: '888' },
  { label: 'Tools & Home Improvement', categoryId: '631' },
  { label: 'Musical Instruments & Gear', categoryId: '619' },
  { label: 'Jewelry & Watches', categoryId: '281' },
  { label: 'Toys & Hobbies', categoryId: '220' },
];
