export { matchCategoryFromMerchant } from './matchCategoryFromMerchant';
export { DEFAULT_CATEGORY_STATE, loadCategoryState, saveCategoryState } from './storage';
export type { CategoryState } from './storage';
export { deleteTagWithCleanup, setPersonActiveWithCleanup } from './workflow';
export type { PersonActivationResult, TagDeletionResult } from './workflow';
export {
  archiveCategory,
  createParentCategory,
  createPerson,
  createSubCategory,
  createTag,
  deleteTag,
  getParentCategories,
  getSubCategoriesByParent,
  moveCategory,
  renameCategory,
  renamePerson,
  renameTag,
  setPersonActive,
  validateTransactionMetadata,
} from './service';
export type { TaxonomySelectionValidationResult } from './service';
