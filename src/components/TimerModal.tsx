import React, { useState, useEffect } from 'react';
import { X, Clock, Timer as TimerIcon, Play, Square } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import { useTheme } from '../lib/ThemeProvider';

interface TimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TimerModal: React.FC<TimerModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings, timer, setTimer } = useChatStore();
  const { isDarkMode } = useTheme();
  const [hours, setHours] = useState('0');
  const [minutes, setMinutes] = useState('0');
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    const interval = setInterval(() => {
      if (timer.endTime) {
        const now = new Date();
        const end = new Date(timer.endTime);
        const diff = end.getTime() - now.getTime();

        if (diff <= 0) {
          setTimer({ endTime: null });
          if (Notification.permission === 'granted') {
            new Notification('Timer Complete!', {
              body: timer.isPomodoro 
                ? `${timer.pomodoroState} session complete!`
                : 'Study time is up!',
            });
          }
          if (timer.isPomodoro) {
            handlePomodoroTransition();
          }
        } else {
          const minutes = Math.floor(diff / 60000);
          const seconds = Math.floor((diff % 60000) / 1000);
          setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [timer.endTime]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscKey);
    return () => window.removeEventListener('keydown', handleEscKey);
  }, [isOpen, onClose]);

  const handlePomodoroTransition = () => {
    const { pomodoroState, currentRound } = timer;
    const { pomodoroWork, pomodoroBreak, pomodoroLongBreak, pomodoroRounds } = settings;

    let newState: 'work' | 'break' | 'longBreak' = 'work';
    let newRound = currentRound;

    if (pomodoroState === 'work') {
      if (currentRound >= pomodoroRounds) {
        newState = 'longBreak';
        newRound = 1;
      } else {
        newState = 'break';
        newRound = currentRound + 1;
      }
    }

    const minutes = newState === 'work' 
      ? pomodoroWork 
      : newState === 'break' 
        ? pomodoroBreak 
        : pomodoroLongBreak;

    setTimer({
      endTime: new Date(Date.now() + minutes * 60000),
      pomodoroState: newState,
      currentRound: newRound,
    });
  };

  const startTimer = () => {
    const hoursVal = parseInt(hours) || 0;
    const minutesVal = parseInt(minutes) || 0;
    const totalMinutes = hoursVal * 60 + minutesVal;
    if (totalMinutes > 0) {
      setTimer({
        endTime: new Date(Date.now() + totalMinutes * 60000),
        isPomodoro: false,
      });
    }
  };

  const startPomodoro = () => {
    setTimer({
      endTime: new Date(Date.now() + settings.pomodoroWork * 60000),
      isPomodoro: true,
      pomodoroState: 'work',
      currentRound: 1,
    });
  };

  const stopTimer = () => {
    setTimer({
      endTime: null,
      isPomodoro: false,
      pomodoroState: 'work',
      currentRound: 1,
    });
  };

  if (!isOpen) return null;

  const inputClasses = `w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-app-purple/50 ${
    isDarkMode 
      ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-400' 
      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
  } transition-colors`;

  const labelClasses = `block text-sm font-medium mb-2 ${
    isDarkMode ? 'text-gray-300' : 'text-gray-700'
  }`;

  const getStateColor = () => {
    if (!timer.isPomodoro) return '';
    
    switch(timer.pomodoroState) {
      case 'work': return isDarkMode ? 'text-red-400' : 'text-red-600';
      case 'break': return isDarkMode ? 'text-green-400' : 'text-green-600';
      case 'longBreak': return isDarkMode ? 'text-blue-400' : 'text-blue-600';
      default: return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div 
        className={`relative ${
          isDarkMode ? 'bg-app-card-dark text-white' : 'bg-white text-gray-800'
        } rounded-2xl p-5 sm:p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-app`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="timer-title"
      >
        <div className="flex justify-between items-center mb-6 sticky top-0 z-10">
          <h2 id="timer-title" className="text-xl font-bold bg-gradient-to-r from-app-purple to-purple-400 bg-clip-text text-transparent">Timer</h2>
          <button 
            onClick={onClose} 
            className={`p-2 rounded-full ${
              isDarkMode ? 'text-gray-400 hover:bg-gray-700/50' : 'text-gray-500 hover:bg-gray-100'
            } transition-colors`}
            aria-label="Close timer settings"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {timer.endTime ? (
          <div className="text-center mb-6">
            <div className="text-5xl font-bold mb-4 text-app-purple">{timeLeft}</div>
            <div className={`text-lg mb-5 font-medium ${getStateColor()}`}>
              {timer.isPomodoro 
                ? `${timer.pomodoroState.charAt(0).toUpperCase() + timer.pomodoroState.slice(1)} - Round ${timer.currentRound}/${settings.pomodoroRounds}`
                : 'Study Timer'}
            </div>
            <button
              onClick={stopTimer}
              className="px-5 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors shadow-app flex items-center gap-2 mx-auto"
              aria-label="Stop timer"
            >
              <Square className="h-4 w-4" />
              Stop Timer
            </button>
          </div>
        ) : (
          <>
            <div className="mb-7">
              <h3 className="text-lg font-semibold mb-4 text-app-purple">Study Timer</h3>
              <div className="flex gap-4 mb-4">
                <div className="flex-1">
                  <label htmlFor="hours" className={labelClasses}>Hours</label>
                  <input
                    id="hours"
                    type="number"
                    min="0"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    className={inputClasses}
                  />
                </div>
                <div className="flex-1">
                  <label htmlFor="minutes" className={labelClasses}>Minutes</label>
                  <input
                    id="minutes"
                    type="number"
                    min="0"
                    max="59"
                    value={minutes}
                    onChange={(e) => setMinutes(e.target.value)}
                    className={inputClasses}
                  />
                </div>
              </div>
              <button
                onClick={startTimer}
                className="w-full px-5 py-2.5 bg-app-purple text-white rounded-xl hover:bg-app-purple-dark transition-colors shadow-app flex items-center justify-center gap-2"
                aria-label="Start study timer"
              >
                <Play className="h-4 w-4" />
                Start Timer
              </button>
            </div>

            <div className={`border-t pt-6 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-app-purple">Pomodoro Settings</h3>
                <button
                  onClick={startPomodoro}
                  className="px-5 py-2.5 bg-app-purple text-white rounded-xl hover:bg-app-purple-dark transition-colors shadow-app flex items-center gap-2"
                  aria-label="Start pomodoro"
                >
                  <Play className="h-4 w-4" />
                  Start Pomodoro
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div>
                  <label htmlFor="pomodoro-work" className={labelClasses}>Work (minutes)</label>
                  <input
                    id="pomodoro-work"
                    type="number"
                    min="1"
                    value={settings.pomodoroWork}
                    onChange={(e) => updateSettings({ pomodoroWork: parseInt(e.target.value) || 25 })}
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label htmlFor="pomodoro-break" className={labelClasses}>Break (minutes)</label>
                  <input
                    id="pomodoro-break"
                    type="number"
                    min="1"
                    value={settings.pomodoroBreak}
                    onChange={(e) => updateSettings({ pomodoroBreak: parseInt(e.target.value) || 5 })}
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label htmlFor="pomodoro-long-break" className={labelClasses}>Long Break (minutes)</label>
                  <input
                    id="pomodoro-long-break"
                    type="number"
                    min="1"
                    value={settings.pomodoroLongBreak}
                    onChange={(e) => updateSettings({ pomodoroLongBreak: parseInt(e.target.value) || 15 })}
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label htmlFor="pomodoro-rounds" className={labelClasses}>Rounds before long break</label>
                  <input
                    id="pomodoro-rounds"
                    type="number"
                    min="1"
                    value={settings.pomodoroRounds}
                    onChange={(e) => updateSettings({ pomodoroRounds: parseInt(e.target.value) || 4 })}
                    className={inputClasses}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};