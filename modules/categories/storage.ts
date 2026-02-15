import { Category, CategoryTag, Person } from '../../types';
import { PERSISTENCE_KEYS, loadPersistedState, savePersistedState } from '../persistence';

export interface CategoryState {
  categories: Category[];
  tags: CategoryTag[];
  persons: Person[];
}

const BASELINE_CREATED_AT = '2026-01-01T00:00:00.000Z';

export const DEFAULT_CATEGORY_STATE: CategoryState = {
  categories: [
    { id: 'parent-food', name: 'Food', parentId: null, isArchived: false, createdAt: BASELINE_CREATED_AT, updatedAt: BASELINE_CREATED_AT },
    { id: 'parent-transport', name: 'Transport', parentId: null, isArchived: false, createdAt: BASELINE_CREATED_AT, updatedAt: BASELINE_CREATED_AT },
    { id: 'parent-bills', name: 'Bills', parentId: null, isArchived: false, createdAt: BASELINE_CREATED_AT, updatedAt: BASELINE_CREATED_AT },
    { id: 'parent-shopping', name: 'Shopping', parentId: null, isArchived: false, createdAt: BASELINE_CREATED_AT, updatedAt: BASELINE_CREATED_AT },
    { id: 'parent-health', name: 'Health', parentId: null, isArchived: false, createdAt: BASELINE_CREATED_AT, updatedAt: BASELINE_CREATED_AT },
    { id: 'parent-installment', name: 'Installments', parentId: null, isArchived: false, createdAt: BASELINE_CREATED_AT, updatedAt: BASELINE_CREATED_AT },
    { id: 'parent-transfer', name: 'Transfers', parentId: null, isArchived: false, createdAt: BASELINE_CREATED_AT, updatedAt: BASELINE_CREATED_AT },
    { id: 'parent-income', name: 'Income', parentId: null, isArchived: false, createdAt: BASELINE_CREATED_AT, updatedAt: BASELINE_CREATED_AT },
    { id: 'parent-other', name: 'Other', parentId: null, isArchived: false, createdAt: BASELINE_CREATED_AT, updatedAt: BASELINE_CREATED_AT },
    { id: 'sub-groceries', name: 'Groceries', parentId: 'parent-food', isArchived: false, createdAt: BASELINE_CREATED_AT, updatedAt: BASELINE_CREATED_AT },
    { id: 'sub-dining', name: 'Dining Out', parentId: 'parent-food', isArchived: false, createdAt: BASELINE_CREATED_AT, updatedAt: BASELINE_CREATED_AT },
    { id: 'sub-rides', name: 'Rides', parentId: 'parent-transport', isArchived: false, createdAt: BASELINE_CREATED_AT, updatedAt: BASELINE_CREATED_AT },
    { id: 'sub-fuel', name: 'Fuel', parentId: 'parent-transport', isArchived: false, createdAt: BASELINE_CREATED_AT, updatedAt: BASELINE_CREATED_AT },
    { id: 'sub-utilities', name: 'Utilities', parentId: 'parent-bills', isArchived: false, createdAt: BASELINE_CREATED_AT, updatedAt: BASELINE_CREATED_AT },
    { id: 'sub-subscriptions', name: 'Subscriptions', parentId: 'parent-bills', isArchived: false, createdAt: BASELINE_CREATED_AT, updatedAt: BASELINE_CREATED_AT },
    { id: 'sub-ecommerce', name: 'Online Shopping', parentId: 'parent-shopping', isArchived: false, createdAt: BASELINE_CREATED_AT, updatedAt: BASELINE_CREATED_AT },
    { id: 'sub-pharmacy', name: 'Pharmacy', parentId: 'parent-health', isArchived: false, createdAt: BASELINE_CREATED_AT, updatedAt: BASELINE_CREATED_AT },
    { id: 'sub-installment', name: 'Installment Payment', parentId: 'parent-installment', isArchived: false, createdAt: BASELINE_CREATED_AT, updatedAt: BASELINE_CREATED_AT },
    { id: 'sub-transfer', name: 'Bank Transfer', parentId: 'parent-transfer', isArchived: false, createdAt: BASELINE_CREATED_AT, updatedAt: BASELINE_CREATED_AT },
    { id: 'sub-salary', name: 'Salary', parentId: 'parent-income', isArchived: false, createdAt: BASELINE_CREATED_AT, updatedAt: BASELINE_CREATED_AT },
    { id: 'sub-other', name: 'Uncategorized', parentId: 'parent-other', isArchived: false, createdAt: BASELINE_CREATED_AT, updatedAt: BASELINE_CREATED_AT },
  ],
  tags: [
    { id: 'tag-essential', name: 'Essential', createdAt: BASELINE_CREATED_AT, updatedAt: BASELINE_CREATED_AT },
    { id: 'tag-recurring', name: 'Recurring', createdAt: BASELINE_CREATED_AT, updatedAt: BASELINE_CREATED_AT },
    { id: 'tag-family', name: 'Family', createdAt: BASELINE_CREATED_AT, updatedAt: BASELINE_CREATED_AT },
  ],
  persons: [
    { id: 'person-self', name: 'Myself', isActive: true, createdAt: BASELINE_CREATED_AT, updatedAt: BASELINE_CREATED_AT },
  ],
};

const sanitizeCategory = (value: Partial<Category>): Category | null => {
  if (!value.id || !value.name) {
    return null;
  }

  return {
    id: value.id,
    name: value.name,
    parentId: value.parentId === null ? null : value.parentId || null,
    isArchived: value.isArchived === true,
    createdAt: value.createdAt || new Date().toISOString(),
    updatedAt: value.updatedAt || new Date().toISOString(),
  };
};

const sanitizeTag = (value: Partial<CategoryTag>): CategoryTag | null => {
  if (!value.id || !value.name) {
    return null;
  }

  return {
    id: value.id,
    name: value.name,
    createdAt: value.createdAt || new Date().toISOString(),
    updatedAt: value.updatedAt || new Date().toISOString(),
  };
};

const sanitizePerson = (value: Partial<Person>): Person | null => {
  if (!value.id || !value.name) {
    return null;
  }

  return {
    id: value.id,
    name: value.name,
    isActive: value.isActive !== false,
    createdAt: value.createdAt || new Date().toISOString(),
    updatedAt: value.updatedAt || new Date().toISOString(),
  };
};

const sanitizeCategoryState = (value: unknown): CategoryState | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const parsed = value as {
    categories?: Partial<Category>[];
    tags?: Partial<CategoryTag>[];
    persons?: Partial<Person>[];
  };

  if (!Array.isArray(parsed.categories) || !Array.isArray(parsed.tags) || !Array.isArray(parsed.persons)) {
    return null;
  }

  const categories = parsed.categories
    .map(sanitizeCategory)
    .filter((category): category is Category => category !== null);
  const tags = parsed.tags.map(sanitizeTag).filter((tag): tag is CategoryTag => tag !== null);
  const persons = parsed.persons.map(sanitizePerson).filter((person): person is Person => person !== null);

  if (!categories.length) {
    return null;
  }

  return {
    categories,
    tags,
    persons,
  };
};

export const loadCategoryState = async (): Promise<CategoryState> => {
  const stored = await loadPersistedState<unknown>(PERSISTENCE_KEYS.categoryState);
  return sanitizeCategoryState(stored) || DEFAULT_CATEGORY_STATE;
};

export const saveCategoryState = async (state: CategoryState): Promise<void> => {
  await savePersistedState(PERSISTENCE_KEYS.categoryState, state);
};
