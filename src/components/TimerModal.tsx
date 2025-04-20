import React, { useState, useEffect } from 'react';
import { X, Clock, Timer as TimerIcon } from 'lucide-react';
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

  const inputClasses = `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
    isDarkMode 
      ? 'bg-gray-700 border-gray-600 text-white' 
      : 'bg-white border-gray-300 text-gray-900'
  }`;

  const labelClasses = `block text-sm mb-1 ${
    isDarkMode ? 'text-gray-300' : 'text-gray-600'
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        className={`${
          isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
        } rounded-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="timer-title"
      >
        <div className="flex justify-between items-center mb-4 sticky top-0 z-10">
          <h2 id="timer-title" className="text-xl font-bold">Timer Settings</h2>
          <button 
            onClick={onClose} 
            className={`p-1 rounded-full ${
              isDarkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'
            }`}
            aria-label="Close timer settings"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {timer.endTime ? (
          <div className="text-center mb-6">
            <div className="text-4xl font-bold mb-3">{timeLeft}</div>
            <div className={`text-lg mb-4 ${getStateColor()}`}>
              {timer.isPomodoro 
                ? `${timer.pomodoroState.charAt(0).toUpperCase() + timer.pomodoroState.slice(1)} - Round ${timer.currentRound}/${settings.pomodoroRounds}`
                : 'Study Timer'}
            </div>
            <button
              onClick={stopTimer}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              aria-label="Stop timer"
            >
              Stop Timer
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Study Timer</h3>
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
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                aria-label="Start study timer"
              >
                Start Timer
              </button>
            </div>

            <div className={`border-t pt-6 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className="text-lg font-semibold mb-3">Pomodoro Settings</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
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
                  <label htmlFor="pomodoro-rounds" className={labelClasses}>Rounds</label>
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
              <button
                onClick={startPomodoro}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                aria-label="Start pomodoro timer"
              >
                Start Pomodoro
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};