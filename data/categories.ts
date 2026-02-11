export interface CategoryDef {
  id: string;
  name: string;
  label: string; // The display name (e.g., "Food & Dining 🍔")
  keywords: string[]; // Keywords for offline matching
  color: string; // Tailwind color class prefix (e.g., 'bg-orange-100 text-orange-600')
  icon: string;
}

export const CATEGORIES: CategoryDef[] = [
  {
    id: 'food',
    name: 'Food',
    label: 'Food & Groceries 🍔',
    keywords: ['mcdonalds', 'kfc', 'bazooka', 'starbucks', 'costa', 'tbsp', 'breadfast', 'koshary', 'supermarket', 'market', 'grocer', 'talabat', 'burger', 'pizza', 'seoudi', 'metro', 'gourmet', 'spinneys', 'carrefour', 'rabbit', 'buffalo', 'el shabrawy', 'gad', 'abu shakra', 'pronto', 'cook door', 'krispy kreme', 'dunkin', 'hyperone', 'kazyon', 'bim', 'oscar'],
    color: 'bg-orange-100 text-orange-600',
    icon: '🍔'
  },
  {
    id: 'transport',
    name: 'Transport',
    label: 'Transport & Gas 🚕',
    keywords: ['uber', 'careem', 'swvl', 'indriver', 'did', 'gas', 'station', 'chillout', 'shell', 'total', 'ola', 'mobil', 'emarat misr', 'circle k', 'master gas', 'gobus', 'blue bus', 'parking'],
    color: 'bg-blue-100 text-blue-600',
    icon: '🚕'
  },
  {
    id: 'bills',
    name: 'Bills',
    label: 'Bills & Utilities 💡',
    keywords: ['vodafone', 'orange', 'etisalat', 'we', 'telecom', 'electricity', 'water', 'gas', 'fawry', 'beem', 'netflix', 'spotify', 'anghami', 'shahid', 'watchit', 'osn', 'bein', 'internet', 'landline', 'maintenance', 'subscription'],
    color: 'bg-yellow-100 text-yellow-600',
    icon: '💡'
  },
  {
    id: 'shopping',
    name: 'Shopping',
    label: 'Shopping & Lifestyle 🛍️',
    keywords: ['zara', 'h&m', 'amazon', 'noon', 'jumia', 'ikea', 'city stars', 'mall', 'clothing', 'shoes', 'de facto', 'lc waikiki', 'pull&bear', 'bershka', 'nas trends', 'activ', 'adidas', 'nike', 'puma', 'homzmart', 'b.tech', '2b', 'tradeline', 'switch plus', 'virgin'],
    color: 'bg-purple-100 text-purple-600',
    icon: '🛍️'
  },
  {
    id: 'health',
    name: 'Health',
    label: 'Health & Wellness 💊',
    keywords: ['pharmacy', '19011', 'el ezaby', 'seif', 'hospital', 'clinic', 'dr.', 'gym', 'gold\'s', 'rosdhy', 'misr pharmacies', 'elezzaby', 'al borg', 'al mokhtabar', 'vezeeta', 'checkup'],
    color: 'bg-red-100 text-red-600',
    icon: '💊'
  },
  {
    id: 'installments',
    name: 'Installment',
    label: 'Aqsat (Installments) 📅',
    keywords: ['valu', 'aman', 'shahry', 'sympl', 'contact', 'premium card', 'forsa', 'souhoola', 'mashroey'],
    color: 'bg-indigo-100 text-indigo-600',
    icon: '📅'
  },
  {
    id: 'transfers',
    name: 'Transfer',
    label: 'Transfers 💸',
    keywords: ['instapay', 'transfer', 'wallet', 'vodafone cash', 'telda', 'klivvr', 'nexta', 'my fawry', 'orange cash', 'etisalat cash', 'we pay', 'smart wallet', 'bm wallet'],
    color: 'bg-emerald-100 text-emerald-600',
    icon: '💸'
  },
  {
    id: 'uncategorized',
    name: 'Uncategorized',
    label: 'Other / Uncategorized',
    keywords: [],
    color: 'bg-gray-100 text-gray-600',
    icon: '❓'
  }
];

export const getCategoryByName = (name: string): CategoryDef => {
  return CATEGORIES.find(c => c.name.toLowerCase() === name.toLowerCase()) || CATEGORIES[CATEGORIES.length - 1];
};