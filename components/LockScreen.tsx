import React, { useState, useEffect } from 'react';

interface LockScreenProps {
  unlockPassword: string;
  onUnlock: () => void;
}

const LockScreen: React.FC<LockScreenProps> = ({ unlockPassword, onUnlock }) => {
  const [input, setInput] = useState('');
  const [shake, setShake] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Focus trap-ish behavior: Keep focus on input
  const inputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Initial focus
    if (inputRef.current) inputRef.current.focus();

    // Slower safety interval just in case focus is lost and onBlur misses it
    const focusInterval = setInterval(() => {
      if (inputRef.current && document.activeElement !== inputRef.current) {
        inputRef.current.focus();
      }
    }, 2000);

    return () => clearInterval(focusInterval);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    setIsTyping(true);
    // Auto-check on correct length to be nice, or require enter?
    // Let's require Enter to be deliberate.
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    // Maybe show a "No Cheating!" toast/shake
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input === unlockPassword) {
      onUnlock();
    } else {
      setShake(true);
      setInput(''); // Cruel? Maybe just shake. 
      // Resetting is standard for wrong passwords.
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-white select-none">

      {/* Cute Overlay Message */}
      <div className="text-center mb-12 animate-fade-in-down">
        <div className="text-8xl mb-6">😴</div>
        <h1 className="text-5xl font-extrabold mb-4 tracking-tight">That is enough for today.</h1>
        <p className="text-xl text-slate-300 font-light">Shut it down. Go outside. Touch grass.</p>
      </div>

      {/* Unlock Mechanism */}
      <div className={`w-full max-w-2xl transition-transform ${shake ? 'animate-shake' : ''}`}>
        <p className="text-center text-sm text-slate-400 mb-4">
          If you <strong>really</strong> must continue, type the password manually.
        </p>

        <form onSubmit={handleSubmit} className="relative">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleChange}
            onPaste={handlePaste}
            className="w-full bg-slate-800 border-2 border-slate-700 text-slate-200 p-6 rounded-2xl font-mono text-lg focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all placeholder:text-slate-600 text-center break-all"
            placeholder="Type the 12-character password..."
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
            autoFocus
            onBlur={(e) => e.target.focus()}
          />

          <div className="mt-4 flex justify-between items-center px-2">
            <span className={`text-xs font-mono ${input.length === unlockPassword.length ? 'text-green-400' : 'text-slate-500'}`}>
              {input.length} / {unlockPassword.length} chars
            </span>
            <button
              type="submit"
              className="text-indigo-400 hover:text-indigo-300 text-sm font-semibold uppercase tracking-wider disabled:opacity-50"
              disabled={input.length === 0}
            >
              Unlock
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>
    </div>
  );
};

export default LockScreen;
