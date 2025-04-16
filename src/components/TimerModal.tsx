import React, { useState, useEffect } from 'react';
import { X, Clock, Timer as TimerIcon } from 'lucide-react';
import { useChatStore } from '../store/chatStore';

interface TimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TimerModal: React.FC<TimerModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings, timer, setTimer } = useChatStore();
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
          new Notification('Timer Complete!', {
            body: timer.isPomodoro 
              ? `${timer.pomodoroState} session complete!`
              : 'Study time is up!',
          });
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
    const totalMinutes = parseInt(hours) * 60 + parseInt(minutes);
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Timer Settings</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>

        {timer.endTime ? (
          <div className="text-center mb-6">
            <div className="text-3xl font-bold mb-2">{timeLeft}</div>
            <div className="text-gray-600 mb-4">
              {timer.isPomodoro 
                ? `${timer.pomodoroState} - Round ${timer.currentRound}/${settings.pomodoroRounds}`
                : 'Study Timer'}
            </div>
            <button
              onClick={stopTimer}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Stop Timer
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Study Timer</h3>
              <div className="flex gap-4 mb-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Hours</label>
                  <input
                    type="number"
                    min="0"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    className="w-20 px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Minutes</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={minutes}
                    onChange={(e) => setMinutes(e.target.value)}
                    className="w-20 px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <button
                onClick={startTimer}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Start Timer
              </button>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-3">Pomodoro Settings</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Work (minutes)</label>
                  <input
                    type="number"
                    min="1"
                    value={settings.pomodoroWork}
                    onChange={(e) => updateSettings({ pomodoroWork: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Break (minutes)</label>
                  <input
                    type="number"
                    min="1"
                    value={settings.pomodoroBreak}
                    onChange={(e) => updateSettings({ pomodoroBreak: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Long Break (minutes)</label>
                  <input
                    type="number"
                    min="1"
                    value={settings.pomodoroLongBreak}
                    onChange={(e) => updateSettings({ pomodoroLongBreak: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Rounds</label>
                  <input
                    type="number"
                    min="1"
                    value={settings.pomodoroRounds}
                    onChange={(e) => updateSettings({ pomodoroRounds: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <button
                onClick={startPomodoro}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
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