import { Category, CategoryTag, Person, TransactionMetadata } from '../../types';
import { CategoryState } from './storage';

const normalizeName = (value: string): string => value.trim().replace(/\s+/g, ' ');

const normalizeCompare = (value: string): string => normalizeName(value).toLowerCase();

const createId = (prefix: string): string => {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
};

const nowIso = (): string => new Date().toISOString();

const assertNonEmptyName = (name: string): string => {
  const normalized = normalizeName(name);
  if (!normalized) {
    throw new Error('Name is required.');
  }
  if (normalized.length > 60) {
    throw new Error('Name is too long (max 60 characters).');
  }
  return normalized;
};

const getActiveCategoryById = (categories: Category[], categoryId: string): Category | null => {
  return categories.find((category) => category.id === categoryId && !category.isArchived) || null;
};

const hasDuplicateCategoryName = (
  categories: Category[],
  name: string,
  parentId: string | null,
  excludedId?: string
): boolean => {
  const normalized = normalizeCompare(name);
  return categories.some((category) => {
    if (category.isArchived) {
      return false;
    }
    if (excludedId && category.id === excludedId) {
      return false;
    }
    return category.parentId === parentId && normalizeCompare(category.name) === normalized;
  });
};

const willCreateCategoryCycle = (
  categories: Category[],
  categoryId: string,
  nextParentId: string | null
): boolean => {
  if (!nextParentId) {
    return false;
  }
  if (nextParentId === categoryId) {
    return true;
  }

  let cursor: string | null = nextParentId;
  const maxDepth = categories.length + 1;
  let depth = 0;

  while (cursor && depth <= maxDepth) {
    if (cursor === categoryId) {
      return true;
    }
    const parent = categories.find((category) => category.id === cursor);
    cursor = parent?.parentId || null;
    depth += 1;
  }

  return false;
};

const hasDuplicateTagName = (tags: CategoryTag[], name: string, excludedId?: string): boolean => {
  const normalized = normalizeCompare(name);
  return tags.some((tag) => {
    if (excludedId && tag.id === excludedId) {
      return false;
    }
    return normalizeCompare(tag.name) === normalized;
  });
};

const hasDuplicatePersonName = (persons: Person[], name: string, excludedId?: string): boolean => {
  const normalized = normalizeCompare(name);
  return persons.some((person) => {
    if (excludedId && person.id === excludedId) {
      return false;
    }
    return normalizeCompare(person.name) === normalized;
  });
};

export const getParentCategories = (categories: Category[]): Category[] => {
  return categories.filter((category) => !category.isArchived && category.parentId === null);
};

export const getSubCategoriesByParent = (categories: Category[], parentId: string): Category[] => {
  return categories.filter((category) => !category.isArchived && category.parentId === parentId);
};

export const createParentCategory = (state: CategoryState, name: string): CategoryState => {
  const normalized = assertNonEmptyName(name);

  if (hasDuplicateCategoryName(state.categories, normalized, null)) {
    throw new Error('Parent category already exists.');
  }

  const timestamp = nowIso();
  const nextCategory: Category = {
    id: createId('parent'),
    name: normalized,
    parentId: null,
    isArchived: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  return {
    ...state,
    categories: [nextCategory, ...state.categories],
  };
};

export const createSubCategory = (
  state: CategoryState,
  parentId: string,
  name: string
): CategoryState => {
  const normalized = assertNonEmptyName(name);
  const parentCategory = getActiveCategoryById(state.categories, parentId);

  if (!parentCategory) {
    throw new Error('Parent category was not found.');
  }
  if (parentCategory.parentId !== null) {
    throw new Error('Sub-category can only be added under a parent category.');
  }
  if (hasDuplicateCategoryName(state.categories, normalized, parentId)) {
    throw new Error('Sub-category already exists under this parent.');
  }

  const timestamp = nowIso();
  const nextCategory: Category = {
    id: createId('sub'),
    name: normalized,
    parentId,
    isArchived: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  return {
    ...state,
    categories: [nextCategory, ...state.categories],
  };
};

export const renameCategory = (state: CategoryState, categoryId: string, name: string): CategoryState => {
  const normalized = assertNonEmptyName(name);
  const current = state.categories.find((category) => category.id === categoryId);

  if (!current || current.isArchived) {
    throw new Error('Category was not found.');
  }
  if (hasDuplicateCategoryName(state.categories, normalized, current.parentId, current.id)) {
    throw new Error('Another category with this name already exists in the same level.');
  }

  return {
    ...state,
    categories: state.categories.map((category) =>
      category.id === categoryId
        ? {
            ...category,
            name: normalized,
            updatedAt: nowIso(),
          }
        : category
    ),
  };
};

export const moveCategory = (
  state: CategoryState,
  categoryId: string,
  nextParentId: string | null
): CategoryState => {
  const current = state.categories.find((category) => category.id === categoryId);
  if (!current || current.isArchived) {
    throw new Error('Category was not found.');
  }

  if (nextParentId) {
    const nextParent = getActiveCategoryById(state.categories, nextParentId);
    if (!nextParent) {
      throw new Error('Target parent category was not found.');
    }
    if (nextParent.parentId !== null) {
      throw new Error('Sub-categories can only be moved under parent categories.');
    }
  }

  if (hasDuplicateCategoryName(state.categories, current.name, nextParentId, current.id)) {
    throw new Error('Target level already has a category with the same name.');
  }
  if (willCreateCategoryCycle(state.categories, categoryId, nextParentId)) {
    throw new Error('Invalid category hierarchy: cycle detected.');
  }

  return {
    ...state,
    categories: state.categories.map((category) =>
      category.id === categoryId
        ? {
            ...category,
            parentId: nextParentId,
            updatedAt: nowIso(),
          }
        : category
    ),
  };
};

export const archiveCategory = (state: CategoryState, categoryId: string): CategoryState => {
  const target = state.categories.find((category) => category.id === categoryId);
  if (!target || target.isArchived) {
    throw new Error('Category was not found.');
  }

  const markArchived = new Set<string>([categoryId]);
  let didExpand = true;
  while (didExpand) {
    didExpand = false;
    state.categories.forEach((category) => {
      if (category.parentId && markArchived.has(category.parentId) && !markArchived.has(category.id)) {
        markArchived.add(category.id);
        didExpand = true;
      }
    });
  }

  return {
    ...state,
    categories: state.categories.map((category) =>
      markArchived.has(category.id)
        ? {
            ...category,
            isArchived: true,
            updatedAt: nowIso(),
          }
        : category
    ),
  };
};

export const createTag = (state: CategoryState, name: string): CategoryState => {
  const normalized = assertNonEmptyName(name);
  if (hasDuplicateTagName(state.tags, normalized)) {
    throw new Error('Tag already exists.');
  }

  const timestamp = nowIso();
  const nextTag: CategoryTag = {
    id: createId('tag'),
    name: normalized,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  return {
    ...state,
    tags: [nextTag, ...state.tags],
  };
};

export const renameTag = (state: CategoryState, tagId: string, name: string): CategoryState => {
  const normalized = assertNonEmptyName(name);
  const current = state.tags.find((tag) => tag.id === tagId);
  if (!current) {
    throw new Error('Tag was not found.');
  }
  if (hasDuplicateTagName(state.tags, normalized, tagId)) {
    throw new Error('Another tag with this name already exists.');
  }

  return {
    ...state,
    tags: state.tags.map((tag) =>
      tag.id === tagId
        ? {
            ...tag,
            name: normalized,
            updatedAt: nowIso(),
          }
        : tag
    ),
  };
};

export const deleteTag = (state: CategoryState, tagId: string): CategoryState => {
  const exists = state.tags.some((tag) => tag.id === tagId);
  if (!exists) {
    throw new Error('Tag was not found.');
  }
  return {
    ...state,
    tags: state.tags.filter((tag) => tag.id !== tagId),
  };
};

export const createPerson = (state: CategoryState, name: string): CategoryState => {
  const normalized = assertNonEmptyName(name);
  if (hasDuplicatePersonName(state.persons, normalized)) {
    throw new Error('Person already exists.');
  }

  const timestamp = nowIso();
  const nextPerson: Person = {
    id: createId('person'),
    name: normalized,
    isActive: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  return {
    ...state,
    persons: [nextPerson, ...state.persons],
  };
};

export const renamePerson = (state: CategoryState, personId: string, name: string): CategoryState => {
  const normalized = assertNonEmptyName(name);
  const current = state.persons.find((person) => person.id === personId);
  if (!current) {
    throw new Error('Person was not found.');
  }
  if (hasDuplicatePersonName(state.persons, normalized, personId)) {
    throw new Error('Another person with this name already exists.');
  }

  return {
    ...state,
    persons: state.persons.map((person) =>
      person.id === personId
        ? {
            ...person,
            name: normalized,
            updatedAt: nowIso(),
          }
        : person
    ),
  };
};

export const setPersonActive = (
  state: CategoryState,
  personId: string,
  isActive: boolean
): CategoryState => {
  const current = state.persons.find((person) => person.id === personId);
  if (!current) {
    throw new Error('Person was not found.');
  }

  return {
    ...state,
    persons: state.persons.map((person) =>
      person.id === personId
        ? {
            ...person,
            isActive,
            updatedAt: nowIso(),
          }
        : person
    ),
  };
};

export interface TaxonomySelectionValidationResult {
  isValid: boolean;
  issues: string[];
}

export const validateTransactionMetadata = (
  state: CategoryState,
  metadata: TransactionMetadata
): TaxonomySelectionValidationResult => {
  const issues: string[] = [];
  const parentCategory = metadata.parentCategoryId
    ? getActiveCategoryById(state.categories, metadata.parentCategoryId)
    : null;
  const subCategory = metadata.subCategoryId
    ? getActiveCategoryById(state.categories, metadata.subCategoryId)
    : null;
  const validTagIds = new Set(state.tags.map((tag) => tag.id));
  const validPersonIds = new Set(
    state.persons.filter((person) => person.isActive).map((person) => person.id)
  );

  if (metadata.parentCategoryId && !parentCategory) {
    issues.push('Selected parent category is no longer valid.');
  }
  if (parentCategory && parentCategory.parentId !== null) {
    issues.push('Selected parent category is invalid.');
  }

  if (metadata.subCategoryId && !subCategory) {
    issues.push('Selected sub-category is no longer valid.');
  }
  if (subCategory && !metadata.parentCategoryId) {
    issues.push('Sub-category requires a parent category.');
  }
  if (
    parentCategory &&
    subCategory &&
    subCategory.parentId !== parentCategory.id
  ) {
    issues.push('Sub-category does not belong to the selected parent category.');
  }

  if (metadata.tagIds.some((tagId) => !validTagIds.has(tagId))) {
    issues.push('One or more selected tags are invalid.');
  }
  if (metadata.personId && !validPersonIds.has(metadata.personId)) {
    issues.push('Selected person is invalid or inactive.');
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
};
