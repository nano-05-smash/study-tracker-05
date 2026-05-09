import React, { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChevronDown, Plus, X, Check, Clock, Zap, Flame, Calendar, TrendingUp, Volume2, VolumeX } from 'lucide-react';

const QUOTES = [
  "Success is the sum of small efforts repeated day in and day out.",
  "Discipline is choosing between what you want now and what you want most.",
  "Your discipline is your superpower.",
  "The secret of getting ahead is getting started.",
  "Consistency is the key to exponential growth.",
  "Every completed task is a step towards your goals.",
  "Your future self will thank you for today's effort.",
  "Small wins lead to big victories.",
  "Progress, not perfection.",
  "You are stronger than your excuses."
];

const playSound = (type) => {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  if (type === 'complete') {
    oscillator.frequency.value = 800;
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } else if (type === 'fail') {
    oscillator.frequency.value = 300;
    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.4);
  }
};

export default function StudyTracker() {
  const [tasks, setTasks] = useState([]);
  const [dailyHistory, setDailyHistory] = useState([]);
  const [taskInput, setTaskInput] = useState('');
  const [priority, setPriority] = useState('medium');
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [timerMode, setTimerMode] = useState('study');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [quote, setQuote] = useState(QUOTES[0]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const pomodoroInterval = useRef(null);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const savedTasks = localStorage.getItem(`tasks_${today}`);
    const savedHistory = localStorage.getItem('dailyHistory');
    
    if (savedTasks) setTasks(JSON.parse(savedTasks));
    if (savedHistory) setDailyHistory(JSON.parse(savedHistory));
    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  }, []);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(`tasks_${today}`, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('dailyHistory', JSON.stringify(dailyHistory));
  }, [dailyHistory]);

  useEffect(() => {
    if (!isRunning) return;
    pomodoroInterval.current = setInterval(() => {
      setPomodoroTime((prev) => {
        if (prev <= 1) {
          if (soundEnabled) playSound('complete');
          setIsRunning(false);
          if (timerMode === 'study') {
            setTimerMode('break');
            return 5 * 60;
          } else {
            setTimerMode('study');
            return 25 * 60;
          }
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(pomodoroInterval.current);
  }, [isRunning, timerMode, soundEnabled]);

  const addTask = () => {
    if (!taskInput.trim()) return;
    setTasks([...tasks, {
      id: Date.now(),
      name: taskInput,
      priority,
      status: 'pending',
    }]);
    setTaskInput('');
  };

  const updateTaskStatus = (id, status) => {
    setTasks(tasks.map(task => task.id === id ? { ...task, status } : task));
    if (soundEnabled) playSound(status === 'completed' ? 'complete' : 'fail');
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const calculateDisciplineScore = () => {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter(t => t.status === 'completed').length;
    return Math.round((completed / tasks.length) * 100);
  };

  const saveDay = () => {
    if (tasks.length === 0) return;
    const today = new Date().toISOString().split('T')[0];
    const disciplineScore = calculateDisciplineScore();
    const completed = tasks.filter(t => t.status === 'completed').length;
    const failed = tasks.filter(t => t.status === 'failed').length;
    
    const dayData = {
      date: today,
      disciplineScore,
      completed,
      failed,
      total: tasks.length,
      completed_percentage: disciplineScore,
    };

    const existingIndex = dailyHistory.findIndex(d => d.date === today);
    if (existingIndex >= 0) {
      const updated = [...dailyHistory];
      updated[existingIndex] = dayData;
      setDailyHistory(updated);
    } else {
      setDailyHistory([...dailyHistory, dayData]);
    }
  };

  const getStreak = () => {
    if (dailyHistory.length === 0) return 0;
    const sorted = [...dailyHistory].sort((a, b) => new Date(b.date) - new Date(a.date));
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < sorted.length; i++) {
      const dayDate = new Date(sorted[i].date);
      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - i);
      if (dayDate.toDateString() === expectedDate.toDateString()) {
        if (sorted[i].completed_percentage >= 70) streak++;
        else break;
      } else break;
    }
    return streak;
  };

  const getWeeklyStats = () => {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - today.getDay());
    const weekData = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const dayData = dailyHistory.find(d => d.date === dateStr);
      weekData.push({
        name: dayNames[i],
        completed: dayData?.completed || 0,
        failed: dayData?.failed || 0,
        score: dayData?.disciplineScore || 0,
      });
    }
    return weekData;
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    const days = [];
    
    for (let i = 0; i < startingDayOfWeek; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const dayData = dailyHistory.find(d => d.date === dateStr);
      days.push({ date: i, dateStr, score: dayData?.disciplineScore || null });
    }
    return days;
  };

  const getDayColor = (score) => {
    if (score === null) return 'bg-gray-800/30';
    if (score >= 80) return 'bg-green-500/30 border-green-500/50';
    if (score >= 60) return 'bg-yellow-500/30 border-yellow-500/50';
    return 'bg-red-500/30 border-red-500/50';
  };

  const weeklyStats = getWeeklyStats();
  const streak = getStreak();
  const disciplineScore = calculateDisciplineScore();
  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const failedCount = tasks.filter(t => t.status === 'failed').length;
  const calendarDays = getCalendarDays();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-white overflow-x-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Study Discipline Tracker
            </h1>
            <p className="text-gray-400 mt-2">Master consistency, achieve excellence</p>
          </div>
          <button onClick={() => setSoundEnabled(!soundEnabled)} className="p-3 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition">
            {soundEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
          </button>
        </div>

        <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-xl border border-white/20 rounded-2xl p-6 mb-6">
          <p className="text-lg italic text-blue-100">"{quote}"</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4">
            <p className="text-gray-400 text-sm">Today's Score</p>
            <p className="text-3xl font-bold text-blue-400">{disciplineScore}%</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4">
            <p className="text-gray-400 text-sm">Streak</p>
            <p className="text-3xl font-bold text-red-400">{streak}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4">
            <p className="text-gray-400 text-sm">Completed</p>
            <p className="text-3xl font-bold text-green-400">{completedCount}/{tasks.length}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4">
            <p className="text-gray-400 text-sm">Total Days</p>
            <p className="text-3xl font-bold text-purple-400">{dailyHistory.length}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Zap size={24} className="text-yellow-400" />
                Today's Tasks
              </h2>

              <div className="flex gap-2 mb-6 flex-col sm:flex-row">
                <input
                  type="text"
                  value={taskInput}
                  onChange={(e) => setTaskInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTask()}
                  placeholder="Add a new study task..."
                  className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                />
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="bg-white/10 border border-white/20 rounded-lg px-3 py-3 text-white focus:outline-none focus:border-blue-400"
                >
                  <option value="low" className="bg-slate-900">Low</option>
                  <option value="medium" className="bg-slate-900">Medium</option>
                  <option value="high" className="bg-slate-900">High</option>
                </select>
                <button onClick={addTask} className="bg-blue-500 hover:bg-blue-600 rounded-lg px-4 py-3 font-semibold transition">
                  <Plus size={20} />
                </button>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {tasks.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No tasks yet. Add one to get started!</p>
                ) : (
                  tasks.map(task => (
                    <div
                      key={task.id}
                      className={`flex items-center gap-3 p-4 rounded-xl border transition ${
                        task.status === 'completed'
                          ? 'bg-green-500/20 border-green-500/50'
                          : task.status === 'failed'
                          ? 'bg-red-500/20 border-red-500/50'
                          : 'bg-white/10 border-white/20'
                      }`}
                    >
                      <div className="flex-1">
                        <p className={`font-semibold ${task.status === 'completed' ? 'line-through text-gray-400' : ''}`}>
                          {task.name}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {task.priority === 'high' ? '⚡ High Priority' : task.priority === 'medium' ? '• Medium' : '○ Low'}
                        </p>
                      </div>
                      <button
                        onClick={() => updateTaskStatus(task.id, 'completed')}
                        className={`p-2 rounded-lg transition ${
                          task.status === 'completed' ? 'bg-green-500' : 'bg-white/10 hover:bg-green-500/30'
                        }`}
                      >
                        <Check size={18} />
                      </button>
                      <button
                        onClick={() => updateTaskStatus(task.id, 'failed')}
                        className={`p-2 rounded-lg transition ${
                          task.status === 'failed' ? 'bg-red-500' : 'bg-white/10 hover:bg-red-500/30'
                        }`}
                      >
                        <X size={18} />
                      </button>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="p-2 rounded-lg bg-white/10 hover:bg-white/20"
                      >
                        <Trash size={18} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {tasks.length > 0 && (
                <button
                  onClick={saveDay}
                  className="w-full mt-6 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-lg px-4 py-3 font-semibold"
                >
                  Save Today's Progress
                </button>
              )}
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Clock size={24} className="text-blue-400" />
                Focus Timer
              </h2>

              <div className="flex flex-col items-center gap-6">
                <div className="text-6xl font-bold text-blue-400 font-mono">
                  {formatTime(pomodoroTime)}
                </div>
                <p className="text-lg text-gray-300">
                  {timerMode === 'study' ? '📚 Study Mode (25 min)' : '☕ Break Time (5 min)'}
                </p>

                <div className="flex gap-4">
                  <button
                    onClick={() => setIsRunning(!isRunning)}
                    className="bg-blue-500 hover:bg-blue-600 rounded-lg px-8 py-3 font-semibold"
                  >
                    {isRunning ? 'Pause' : 'Start'}
                  </button>
                  <button
                    onClick={() => {
                      setPomodoroTime(timerMode === 'study' ? 25 * 60 : 5 * 60);
                      setIsRunning(false);
                    }}
                    className="bg-white/10 hover:bg-white/20 rounded-lg px-8 py-3 font-semibold border border-white/20"
                  >
                    Reset
                  </button>
                </div>

                <div className="w-full bg-white/10 rounded-full h-2 mt-4">
                  <div
                    className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full"
                    style={{
                      width: `${((timerMode === 'study' ? 25 * 60 : 5 * 60) - pomodoroTime) / (timerMode === 'study' ? 25 * 60 : 5 * 60) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-8">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-4">Weekly Score</h2>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={weeklyStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
                  <YAxis stroke="rgba(255,255,255,0.5)" />
                  <Tooltip contentStyle={{ background: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px' }} />
                  <Line type="monotone" dataKey="score" stroke="#60a5fa" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-4">Completion Rate</h2>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Completed', value: completedCount },
                      { name: 'Failed', value: failedCount },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    dataKey="value"
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#ef4444" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Monthly View</h2>
                <button onClick={() => setShowCalendar(!showCalendar)} className="p-2 rounded-lg hover:bg-white/20">
                  <ChevronDown size={20} className={`transform transition ${showCalendar ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {showCalendar && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))} className="p-1 hover:bg-white/20 rounded">◀</button>
                    <h3 className="font-semibold">{currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
                    <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))} className="p-1 hover:bg-white/20 rounded">▶</button>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-xs mb-2">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                      <div key={d} className="text-center font-semibold text-gray-400">{d}</div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day, idx) => (
                      <div key={idx} className={`aspect-square rounded-lg flex items-center justify-center text-xs font-semibold border border-white/20 ${day ? getDayColor(day.score) : 'bg-transparent border-transparent'}`}>
                        {day?.date}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
          <h2 className="text-2xl font-bold mb-6">Weekly Analytics</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Task Completion</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={weeklyStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
                  <YAxis stroke="rgba(255,255,255,0.5)" />
                  <Tooltip contentStyle={{ background: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px' }} />
                  <Legend />
                  <Bar dataKey="completed" fill="#10b981" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="failed" fill="#ef4444" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-gray-400 text-sm mb-2">Weekly Consistency</p>
                <div className="text-4xl font-bold text-cyan-400">
                  {dailyHistory.length > 0 ? Math.round((dailyHistory.filter(d => d.completed_percentage >= 70).length / dailyHistory.length) * 100) : 0}%
                </div>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-2">Total Tasks This Week</p>
                <div className="text-4xl font-bold text-green-400">{weeklyStats.reduce((sum, day) => sum + day.completed, 0)}</div>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-2">Average Daily Score</p>
                <div className="text-4xl font-bold text-blue-400">{dailyHistory.length > 0 ? Math.round(dailyHistory.reduce((sum, d) => sum + d.disciplineScore, 0) / dailyHistory.length) : 0}%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Trash(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
  );
}
