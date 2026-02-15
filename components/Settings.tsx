import React, { useState } from 'react';

interface SettingsProps {
  mobile: string;
  onChangePassword: (oldPassword: string, newPassword: string, confirmPassword: string) => Promise<void>;
  onLogout: () => void;
}

const Settings: React.FC<SettingsProps> = ({ mobile, onChangePassword, onLogout }) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setIsSaving(true);

    try {
      await onChangePassword(oldPassword, newPassword, confirmPassword);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage('Password updated successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update password');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 pb-24 space-y-6 min-h-screen bg-gray-50">
      <h2 className="text-2xl font-bold text-gray-900">Settings</h2>

      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
        <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold">Account</p>
        <p className="text-sm text-gray-700 mt-2">Mobile: {mobile}</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm space-y-4">
        <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold">Security</p>

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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Old Password</label>
          <input
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-cib-blue"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-cib-blue"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-cib-blue"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="w-full py-3 rounded-lg bg-cib-blue text-white font-semibold disabled:opacity-60"
        >
          {isSaving ? 'Updating...' : 'Update Password'}
        </button>
      </form>

      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
        <button
          onClick={onLogout}
          className="w-full py-3 rounded-lg border border-red-200 text-red-600 font-semibold hover:bg-red-50 transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Settings;
