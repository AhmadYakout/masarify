import { CATEGORIES } from '../../data/categories';

export const matchCategoryFromMerchant = (merchantName: string): string => {
  const lowerMerchant = merchantName.toLowerCase();
  const foundCategory = CATEGORIES.find((category) =>
    category.keywords.some((keyword) => lowerMerchant.includes(keyword))
  );
  return foundCategory?.name ?? 'Uncategorized';
};
