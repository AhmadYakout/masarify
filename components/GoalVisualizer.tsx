import React, { useState } from 'react';
import { UserGoal } from '../types';
import { generateGoalStyle } from '../services/aiService';

const GoalVisualizer: React.FC = () => {
  const [goals, setGoals] = useState<UserGoal[]>([]);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);

    const style = await generateGoalStyle(newGoalTitle);

    const newGoal: UserGoal = {
      id: Date.now().toString(),
      title: newGoalTitle,
      targetAmount: parseFloat(amount),
      savedAmount: 0,
      colorHex: style.color,
      emoji: style.emoji
    };

    setGoals([...goals, newGoal]);
    setNewGoalTitle('');
    setAmount('');
    setIsGenerating(false);
  };

  return (
    <div className="p-4 pb-24 min-h-screen bg-gray-50">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Financial Goals</h2>
      
      <form onSubmit={handleCreateGoal} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4 mb-8">
        <h3 className="font-semibold text-lg text-gray-700">Set a New Goal</h3>
        <div>
          <label className="block text-sm text-gray-600 mb-1">What are you saving for?</label>
          <input 
            type="text" 
            value={newGoalTitle}
            onChange={e => setNewGoalTitle(e.target.value)}
            placeholder="e.g. New Car, Wedding, Laptop"
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-cib-blue focus:border-cib-blue"
            required
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Target Amount (EGP)</label>
          <input 
            type="number" 
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="50000"
            className="w-full p-2 border border-gray-300 rounded-lg"
            required
          />
        </div>
        <button 
          type="submit" 
          disabled={isGenerating}
          className={`w-full text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-200 transition-colors ${
            isGenerating ? 'bg-gray-400' : 'bg-cib-blue hover:bg-blue-700'
          }`}
        >
          {isGenerating ? 'AI is dreaming... ✨' : 'Create Goal'}
        </button>
      </form>

      <div className="space-y-6">
        {goals.map(goal => (
          <div key={goal.id} className="bg-white rounded-xl shadow-md overflow-hidden">
            <div 
              className="w-full h-32 flex items-center justify-center relative"
              style={{ background: `linear-gradient(135deg, ${goal.colorHex} 0%, #00000088 100%)` }}
            >
               <span className="text-6xl animate-bounce" style={{ animationDuration: '2s' }}>{goal.emoji}</span>
               <div className="absolute bottom-2 left-4 text-white font-bold text-xl drop-shadow-md">{goal.title}</div>
            </div>
            <div className="p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-gray-500">
                    {goal.savedAmount} / {goal.targetAmount} EGP
                </span>
                <span className="text-xs text-cib-blue bg-blue-50 px-2 py-1 rounded-full">
                    {Math.round((goal.savedAmount / goal.targetAmount) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                    className="h-2.5 rounded-full transition-all duration-1000" 
                    style={{ 
                        width: `${Math.min(100, (goal.savedAmount / goal.targetAmount) * 100)}%`,
                        backgroundColor: goal.colorHex
                    }}
                ></div>
              </div>
            </div>
          </div>
        ))}
        {goals.length === 0 && (
            <div className="text-center text-gray-400 py-10">
                No goals set yet. Start saving today!
            </div>
        )}
      </div>
    </div>
  );
};

export default GoalVisualizer;