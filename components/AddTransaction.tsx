import React, { useEffect, useMemo, useState } from 'react';
import {
  Category,
  CategoryTag,
  Person,
  SmsDetectionSource,
  TransactionMetadata,
  TransactionType,
} from '../types';
import {
  attachIngestionPermissionsBridge,
  getCurrentIngestionPermissions,
  IngestionPermissionSnapshot,
  openNotificationListenerSettings,
  parseEgyptianFinanceSms,
  requestNotificationPermission,
  requestSmsPermission,
} from '../modules/sms';

interface AddTransactionProps {
  categories: Category[];
  tags: CategoryTag[];
  persons: Person[];
  onAdd: (
    amount: number,
    merchant: string,
    category: string,
    type: TransactionType,
    metadata: TransactionMetadata
  ) => void;
  onCancel: () => void;
  onDetectedPayment: (rawMessage: string, source: SmsDetectionSource) => boolean;
  onOpenCategoryManager: () => void;
}

const AddTransaction: React.FC<AddTransactionProps> = ({
  categories,
  tags,
  persons,
  onAdd,
  onCancel,
  onDetectedPayment,
  onOpenCategoryManager,
}) => {
  const [activeTab, setActiveTab] = useState<'manual' | 'sms'>('sms');
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [parentCategoryId, setParentCategoryId] = useState('');
  const [subCategoryId, setSubCategoryId] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [personId, setPersonId] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [smsText, setSmsText] = useState('');
  const [detectionMessage, setDetectionMessage] = useState('');
  const [formError, setFormError] = useState('');
  const [permissionSnapshot, setPermissionSnapshot] = useState<IngestionPermissionSnapshot>(() =>
    getCurrentIngestionPermissions()
  );

  const parentCategories = useMemo(
    () => categories.filter((category) => !category.isArchived && category.parentId === null),
    [categories]
  );

  const availableSubCategories = useMemo(
    () =>
      categories.filter(
        (category) => !category.isArchived && category.parentId !== null && category.parentId === parentCategoryId
      ),
    [categories, parentCategoryId]
  );

  const activePersons = useMemo(() => persons.filter((person) => person.isActive), [persons]);

  useEffect(() => {
    if (!parentCategoryId && parentCategories.length) {
      const fallbackParent = parentCategories.find((category) => category.name === 'Other') || parentCategories[0];
      setParentCategoryId(fallbackParent.id);
    }
  }, [parentCategories, parentCategoryId]);

  useEffect(() => {
    if (!availableSubCategories.length) {
      setSubCategoryId('');
      return;
    }

    const hasSelectedSubCategory = availableSubCategories.some((category) => category.id === subCategoryId);
    if (!hasSelectedSubCategory) {
      setSubCategoryId(availableSubCategories[0].id);
    }
  }, [availableSubCategories, subCategoryId]);

  useEffect(() => {
    const validTagIds = new Set(tags.map((tag) => tag.id));
    setSelectedTagIds((previousTagIds) =>
      previousTagIds.filter((tagId) => validTagIds.has(tagId))
    );
  }, [tags]);

  useEffect(() => {
    if (!personId) {
      return;
    }
    const hasPerson = activePersons.some((person) => person.id === personId);
    if (!hasPerson) {
      setPersonId('');
    }
  }, [activePersons, personId]);

  useEffect(() => {
    const detach = attachIngestionPermissionsBridge((snapshot) => {
      setPermissionSnapshot(snapshot);
    });

    setPermissionSnapshot(getCurrentIngestionPermissions());

    return detach;
  }, []);

  const handleSmsPaste = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setSmsText(text);
    
    const parsed = parseEgyptianFinanceSms(text);
    if (parsed) {
      const queued = onDetectedPayment(text, 'manual_paste');
      setDetectionMessage(
        queued
          ? 'Payment detected and queued. Confirm it from Alerts.'
          : 'Payment already exists in queue.'
      );
    } else {
      setDetectionMessage('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const parsedAmount = parseFloat(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setFormError('Amount must be greater than zero.');
      return;
    }

    const parentCategory = parentCategories.find((category) => category.id === parentCategoryId);
    const subCategory = availableSubCategories.find((category) => category.id === subCategoryId);

    if (!parentCategory) {
      setFormError('Please select a valid parent category.');
      return;
    }

    const displayCategory = subCategory?.name || parentCategory.name;

    onAdd(parsedAmount, merchant, displayCategory, type, {
      parentCategoryId: parentCategory.id,
      subCategoryId: subCategory?.id,
      tagIds: selectedTagIds,
      personId: personId || undefined,
    });
  };

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((previous) =>
      previous.includes(tagId)
        ? previous.filter((selectedTagId) => selectedTagId !== tagId)
        : [...previous, tagId]
    );
  };

  const refreshPermissions = () => {
    setPermissionSnapshot(getCurrentIngestionPermissions());
  };

  const handleRequestSmsPermission = () => {
    requestSmsPermission();
    setTimeout(refreshPermissions, 250);
  };

  const handleRequestNotificationPermission = async () => {
    await requestNotificationPermission();
    setTimeout(refreshPermissions, 250);
  };

  const handleOpenNotificationListenerSettings = () => {
    openNotificationListenerSettings();
    setTimeout(refreshPermissions, 250);
  };

  return (
    <div className="bg-white min-h-screen p-4 pb-24">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Add Transaction</h2>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
        <button 
          onClick={() => setActiveTab('sms')}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'sms' ? 'bg-white shadow text-cib-blue' : 'text-gray-500'}`}
        >
          Parse SMS
        </button>
        <button 
          onClick={() => setActiveTab('manual')}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'manual' ? 'bg-white shadow text-cib-blue' : 'text-gray-500'}`}
        >
          Manual Entry
        </button>
      </div>

      {activeTab === 'sms' ? (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-sm text-blue-800">
              <span className="font-bold">🚀 Smart Parser:</span> Supports CIB, NBE, InstaPay, Vodafone Cash, and Valu messages.
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-900">Detection Permissions</p>
              <button
                type="button"
                onClick={refreshPermissions}
                className="text-xs font-semibold text-cib-blue"
              >
                Refresh
              </button>
            </div>

            <div className="text-xs text-gray-600 space-y-1">
              <p>
                SMS access:{' '}
                <span className={permissionSnapshot.smsGranted ? 'text-emerald-700 font-semibold' : 'text-amber-700 font-semibold'}>
                  {permissionSnapshot.smsGranted ? 'Granted' : 'Not granted'}
                </span>
              </p>
              <p>
                Notification permission:{' '}
                <span className={permissionSnapshot.notificationsGranted ? 'text-emerald-700 font-semibold' : 'text-amber-700 font-semibold'}>
                  {permissionSnapshot.notificationsGranted ? 'Granted' : 'Not granted'}
                </span>
              </p>
              <p>
                Notification listener:{' '}
                <span className={permissionSnapshot.notificationListenerEnabled ? 'text-emerald-700 font-semibold' : 'text-amber-700 font-semibold'}>
                  {permissionSnapshot.notificationListenerEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={handleRequestSmsPermission}
                className="py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700"
              >
                Request SMS Access
              </button>
              <button
                type="button"
                onClick={() => void handleRequestNotificationPermission()}
                className="py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700"
              >
                Request Notification Permission
              </button>
              <button
                type="button"
                onClick={handleOpenNotificationListenerSettings}
                className="py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700"
              >
                Open Notification Listener Settings
              </button>
            </div>
            <p className="text-xs text-gray-500">
              If access is denied, you can still paste payment messages manually below.
            </p>
          </div>
          <textarea
            value={smsText}
            onChange={handleSmsPaste}
            placeholder="Paste SMS here..."
            className="w-full h-32 p-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-cib-blue focus:border-cib-blue transition-all"
          />
          {detectionMessage && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl p-3">
              {detectionMessage}
            </div>
          )}
           <div className="text-xs text-gray-400">
             Try: "Purchase of EGP 150.00 at Bazooka..." or "Transfer of 500 to 012345..."
           </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          {formError && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {formError}
            </div>
          )}

          <div className="flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50 px-3 py-2">
            <div>
              <p className="text-xs font-semibold text-cib-blue uppercase tracking-wide">Category Setup</p>
              <p className="text-xs text-blue-700">Need a new parent/sub-category, tag, or person?</p>
            </div>
            <button
              type="button"
              onClick={onOpenCategoryManager}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-blue-200 text-cib-blue"
            >
              Manage
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (EGP)</label>
            <input
              type="number"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full text-3xl font-bold text-gray-900 border-b-2 border-gray-200 focus:border-cib-blue outline-none py-2 placeholder-gray-300"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Merchant / Title</label>
            <input
              type="text"
              required
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-cib-blue"
              placeholder="e.g., Carrefour, Uber"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Parent Category</label>
              <select
                value={parentCategoryId}
                onChange={(e) => setParentCategoryId(e.target.value)}
                className="w-full p-3 rounded-lg border border-gray-300 bg-white"
                required
              >
                {parentCategories.map((categoryOption) => (
                  <option key={categoryOption.id} value={categoryOption.id}>
                    {categoryOption.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sub-Category</label>
              <select
                value={subCategoryId}
                onChange={(e) => setSubCategoryId(e.target.value)}
                className="w-full p-3 rounded-lg border border-gray-300 bg-white"
              >
                {availableSubCategories.length === 0 && <option value="">No sub-category</option>}
                {availableSubCategories.map((categoryOption) => (
                  <option key={categoryOption.id} value={categoryOption.id}>
                    {categoryOption.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as TransactionType)}
                className="w-full p-3 rounded-lg border border-gray-300 bg-white"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
                <option value="installment">Installment Payment</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Person (Optional)</label>
              <select
                value={personId}
                onChange={(e) => setPersonId(e.target.value)}
                className="w-full p-3 rounded-lg border border-gray-300 bg-white"
              >
                <option value="">General expense</option>
                {activePersons.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tags (Optional)</label>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => {
                const isSelected = selectedTagIds.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                      isSelected
                        ? 'bg-cib-blue text-white border-cib-blue'
                        : 'bg-white text-gray-600 border-gray-200'
                    }`}
                  >
                    {tag.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-4 flex space-x-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 text-gray-600 font-medium bg-gray-100 rounded-xl hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 text-white font-bold bg-cib-blue rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200"
            >
              Save Transaction
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AddTransaction;
