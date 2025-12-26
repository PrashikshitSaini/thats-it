import React, { useState } from 'react';
import { TimeConfig } from '../types';

interface SetupScreenProps {
  onStart: (time: TimeConfig, password: string) => void;
}

const SetupScreen: React.FC<SetupScreenProps> = ({ onStart }) => {
  const [timeStr, setTimeStr] = useState<string>('17:00'); // Default 5 PM
  const [frequency, setFrequency] = useState<string>('Daily');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');

  const targetLength = 12;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length !== targetLength) {
      setError(`Password must be exactly ${targetLength} characters.`);
      return;
    }

    // Parse time string (HH:MM) to TimeConfig
    const [hours, minutes] = timeStr.split(':').map(Number);

    onStart({ hours, minutes }, password);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Prevent pasting if browser allows overriding via onChange, 
    // but primarily handled by onPaste event.
    setPassword(e.target.value);
    if (error) setError('');
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    setError("No copy-pasting allowed! You have to commit to this.");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 transform transition-all hover:scale-[1.01]">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">That's It</h1>
          <p className="text-slate-500 mt-2">Set your cutoff time. Stick to it.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          <div className="grid grid-cols-2 gap-4">
            {/* Time Input */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Cutoff Time
              </label>
              <input
                type="time"
                value={timeStr}
                onChange={(e) => setTimeStr(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-lg font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer text-slate-900 [color-scheme:light]"
              />
            </div>

            {/* Frequency Selector */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Frequency
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer appearance-none text-slate-900"
              >
                <option value="Daily">Daily</option>
                <option value="Weekdays">Weekdays</option>
                <option value="Once">Once</option>
              </select>
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Unlock Password ({password.length}/{targetLength})
            </label>
            <p className="text-xs text-slate-500 mb-2">
              This password will be required to keep using the computer after {timeStr}. Make it memorable or write it down.
            </p>
            <input
              type="text"
              value={password}
              onChange={handlePasswordChange}
              onPaste={handlePaste}
              className={`w-full p-4 border-2 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all text-slate-900
                ${error && password.length !== targetLength ? 'border-red-300 focus:ring-red-500 bg-red-50' : 'border-slate-200 focus:ring-indigo-500 bg-slate-50'}
              `}
              placeholder="Type exactly 12 characters..."
            />
            {error && (
              <p className="text-red-500 text-xs mt-2 font-medium animate-pulse">{error}</p>
            )}

            <div className="w-full bg-slate-100 h-1 mt-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${password.length === targetLength ? 'bg-green-500' : 'bg-indigo-400'}`}
                style={{ width: `${Math.min(100, (password.length / targetLength) * 100)}%` }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={password.length !== targetLength}
            className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all transform active:scale-95
              ${password.length === targetLength
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-500/30'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'}
            `}
          >
            Schedule Lock
          </button>
        </form>
      </div>

      <p className="text-slate-400 text-xs mt-8 max-w-sm text-center">
        Note: The lock screen will activate automatically at {timeStr}.
      </p>
    </div>
  );
};

export default SetupScreen;