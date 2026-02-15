import React, { useMemo, useState } from 'react';
import { Category, CategoryTag, Person } from '../types';

interface CategoryManagerProps {
  categories: Category[];
  tags: CategoryTag[];
  persons: Person[];
  onCreateParentCategory: (name: string) => void;
  onCreateSubCategory: (parentId: string, name: string) => void;
  onRenameCategory: (categoryId: string, name: string) => void;
  onArchiveCategory: (categoryId: string) => void;
  onCreateTag: (name: string) => void;
  onRenameTag: (tagId: string, name: string) => void;
  onDeleteTag: (tagId: string) => void;
  onCreatePerson: (name: string) => void;
  onRenamePerson: (personId: string, name: string) => void;
  onSetPersonActive: (personId: string, isActive: boolean) => void;
}

const formatError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Could not complete the action.';
};

const CategoryManager: React.FC<CategoryManagerProps> = ({
  categories,
  tags,
  persons,
  onCreateParentCategory,
  onCreateSubCategory,
  onRenameCategory,
  onArchiveCategory,
  onCreateTag,
  onRenameTag,
  onDeleteTag,
  onCreatePerson,
  onRenamePerson,
  onSetPersonActive,
}) => {
  const [parentName, setParentName] = useState('');
  const [subName, setSubName] = useState('');
  const [subParentId, setSubParentId] = useState('');
  const [tagName, setTagName] = useState('');
  const [personName, setPersonName] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const parentCategories = useMemo(
    () => categories.filter((category) => !category.isArchived && category.parentId === null),
    [categories]
  );
  const subCategories = useMemo(
    () => categories.filter((category) => !category.isArchived && category.parentId !== null),
    [categories]
  );

  const groupedSubCategories = useMemo(() => {
    const groups: Record<string, Category[]> = {};
    subCategories.forEach((category) => {
      if (!category.parentId) {
        return;
      }
      if (!groups[category.parentId]) {
        groups[category.parentId] = [];
      }
      groups[category.parentId].push(category);
    });
    return groups;
  }, [subCategories]);

  const runAction = (action: () => void, successText: string) => {
    setMessage('');
    setError('');
    try {
      action();
      setMessage(successText);
    } catch (actionError) {
      setError(formatError(actionError));
    }
  };

  const handleAddParent = (e: React.FormEvent) => {
    e.preventDefault();
    runAction(() => onCreateParentCategory(parentName), 'Parent category added.');
    setParentName('');
  };

  const handleAddSub = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subParentId) {
      setError('Please choose a parent category.');
      return;
    }
    runAction(() => onCreateSubCategory(subParentId, subName), 'Sub-category added.');
    setSubName('');
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    runAction(() => onCreateTag(tagName), 'Tag added.');
    setTagName('');
  };

  const handleAddPerson = (e: React.FormEvent) => {
    e.preventDefault();
    runAction(() => onCreatePerson(personName), 'Person added.');
    setPersonName('');
  };

  const handleRenameCategory = (categoryId: string, oldName: string) => {
    const nextName = window.prompt('Rename category', oldName);
    if (!nextName) {
      return;
    }
    runAction(() => onRenameCategory(categoryId, nextName), 'Category renamed.');
  };

  const handleRenameTag = (tagId: string, oldName: string) => {
    const nextName = window.prompt('Rename tag', oldName);
    if (!nextName) {
      return;
    }
    runAction(() => onRenameTag(tagId, nextName), 'Tag renamed.');
  };

  const handleRenamePerson = (personId: string, oldName: string) => {
    const nextName = window.prompt('Rename person', oldName);
    if (!nextName) {
      return;
    }
    runAction(() => onRenamePerson(personId, nextName), 'Person renamed.');
  };

  const handleArchiveCategory = (categoryId: string) => {
    if (!window.confirm('Archive this category? It will be hidden from new transactions.')) {
      return;
    }
    runAction(() => onArchiveCategory(categoryId), 'Category archived.');
  };

  const handleDeleteTag = (tagId: string) => {
    if (!window.confirm('Delete this tag?')) {
      return;
    }
    runAction(() => onDeleteTag(tagId), 'Tag deleted.');
  };

  return (
    <div className="p-4 pb-28 space-y-6 min-h-screen bg-gray-50">
      <h2 className="text-2xl font-bold text-gray-900">Categories & Classification</h2>

      {message && (
        <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
          {message}
        </div>
      )}
      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <section className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm space-y-4">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Parent Categories</h3>
          <p className="text-xs text-gray-500">Top-level expense and income buckets.</p>
        </div>
        <form onSubmit={handleAddParent} className="flex gap-2">
          <input
            type="text"
            value={parentName}
            onChange={(e) => setParentName(e.target.value)}
            className="flex-1 p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-cib-blue"
            placeholder="Add parent category"
            required
          />
          <button type="submit" className="px-4 rounded-lg bg-cib-blue text-white text-sm font-semibold">
            Add
          </button>
        </form>
        <div className="space-y-2">
          {parentCategories.map((parent) => (
            <div key={parent.id} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-gray-900">{parent.name}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRenameCategory(parent.id, parent.name)}
                    className="text-xs px-2 py-1 rounded border border-gray-200 text-gray-600"
                  >
                    Rename
                  </button>
                  <button
                    onClick={() => handleArchiveCategory(parent.id)}
                    className="text-xs px-2 py-1 rounded border border-red-200 text-red-600"
                  >
                    Archive
                  </button>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {(groupedSubCategories[parent.id] || []).map((sub) => (
                  <span
                    key={sub.id}
                    className="inline-flex items-center gap-1 text-xs bg-white border border-gray-200 rounded-full px-2.5 py-1"
                  >
                    {sub.name}
                    <button
                      onClick={() => handleRenameCategory(sub.id, sub.name)}
                      className="text-cib-blue"
                      aria-label={`Rename ${sub.name}`}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleArchiveCategory(sub.id)}
                      className="text-red-600"
                      aria-label={`Archive ${sub.name}`}
                    >
                      X
                    </button>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm space-y-4">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Sub-Categories</h3>
          <p className="text-xs text-gray-500">Attach detailed categories under a parent category.</p>
        </div>
        <form onSubmit={handleAddSub} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2">
          <select
            value={subParentId}
            onChange={(e) => setSubParentId(e.target.value)}
            className="p-2.5 rounded-lg border border-gray-300 bg-white"
            required
          >
            <option value="">Select parent category</option>
            {parentCategories.map((parent) => (
              <option key={parent.id} value={parent.id}>
                {parent.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={subName}
            onChange={(e) => setSubName(e.target.value)}
            className="p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-cib-blue"
            placeholder="Add sub-category"
            required
          />
          <button type="submit" className="px-4 rounded-lg bg-cib-blue text-white text-sm font-semibold">
            Add
          </button>
        </form>
      </section>

      <section className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm space-y-4">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Tags</h3>
        <form onSubmit={handleAddTag} className="flex gap-2">
          <input
            type="text"
            value={tagName}
            onChange={(e) => setTagName(e.target.value)}
            className="flex-1 p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-cib-blue"
            placeholder="Add tag"
            required
          />
          <button type="submit" className="px-4 rounded-lg bg-cib-blue text-white text-sm font-semibold">
            Add
          </button>
        </form>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1 text-xs bg-blue-50 text-cib-blue border border-blue-100 rounded-full px-3 py-1"
            >
              {tag.name}
              <button onClick={() => handleRenameTag(tag.id, tag.name)} className="text-cib-blue">
                Edit
              </button>
              <button onClick={() => handleDeleteTag(tag.id)} className="text-red-600">
                X
              </button>
            </span>
          ))}
        </div>
      </section>

      <section className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm space-y-4">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Persons</h3>
        <form onSubmit={handleAddPerson} className="flex gap-2">
          <input
            type="text"
            value={personName}
            onChange={(e) => setPersonName(e.target.value)}
            className="flex-1 p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-cib-blue"
            placeholder="Add person (e.g. Son)"
            required
          />
          <button type="submit" className="px-4 rounded-lg bg-cib-blue text-white text-sm font-semibold">
            Add
          </button>
        </form>
        <div className="space-y-2">
          {persons.map((person) => (
            <div
              key={person.id}
              className={`flex items-center justify-between rounded-lg border px-3 py-2 ${
                person.isActive ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50 opacity-70'
              }`}
            >
              <div>
                <p className="text-sm font-medium text-gray-900">{person.name}</p>
                <p className="text-xs text-gray-500">{person.isActive ? 'Active' : 'Inactive'}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleRenamePerson(person.id, person.name)}
                  className="text-xs px-2 py-1 rounded border border-gray-200 text-gray-600"
                >
                  Rename
                </button>
                <button
                  onClick={() => onSetPersonActive(person.id, !person.isActive)}
                  className={`text-xs px-2 py-1 rounded border ${
                    person.isActive
                      ? 'border-amber-200 text-amber-700'
                      : 'border-emerald-200 text-emerald-700'
                  }`}
                >
                  {person.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default CategoryManager;
