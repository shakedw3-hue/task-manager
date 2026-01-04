'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Plus, Check, Trash2, TrendingUp, ChevronLeft, ChevronRight, X, BarChart3, Target, Copy, CheckCheck, Archive, ArrowRight, Trophy, Flame, Star, Gift, Moon, Sun, Calendar } from 'lucide-react';

const hebrewDays = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const hebrewMonths = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];

const getWeekDates = (date) => {
  const curr = new Date(date);
  const day = curr.getDay();
  const diff = curr.getDate() - day;
  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(curr);
    d.setDate(diff + i);
    weekDates.push(d);
  }
  return weekDates;
};

const formatDateKey = (date) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const getMonthDates = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const dates = [];
  for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
    dates.push(new Date(d));
  }
  return dates;
};

// Apple-style Pie Chart
const PieChart = ({ percentage, size = 100, strokeWidth = 8, color = '#007AFF', darkMode }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;
  const bgColor = darkMode ? '#2C2C2E' : '#F2F2F7';
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={bgColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          {percentage}%
        </span>
      </div>
    </div>
  );
};

export default function TaskManager() {
  const [darkMode, setDarkMode] = useState(false);
  const [tasks, setTasks] = useState({});
  const [backlog, setBacklog] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('week');
  const [selectedDay, setSelectedDay] = useState(null);
  const [showBacklog, setShowBacklog] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [copied, setCopied] = useState(false);
  const [points, setPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [completedDays, setCompletedDays] = useState([]);
  const [newBacklogDate, setNewBacklogDate] = useState('');
  const [newBacklogTime, setNewBacklogTime] = useState('');

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return { text: 'בוקר טוב, שקד', emoji: '☀️' };
    } else if (hour >= 12 && hour < 17) {
      return { text: 'צהריים טובים, שקד', emoji: '🌤️' };
    } else if (hour >= 17 && hour < 21) {
      return { text: 'ערב טוב, שקד', emoji: '🌅' };
    } else {
      return { text: 'לילה טוב, שקד', emoji: '🌙' };
    }
  };

  const greeting = getGreeting();
  
  // Format today's date
  const formatFullDate = (date) => {
    const day = date.getDate();
    const month = hebrewMonths[date.getMonth()];
    const year = date.getFullYear();
    const dayName = hebrewDays[date.getDay()];
    return `יום ${dayName}, ${day} ב${month} ${year}`;
  };

  const todayFullDate = formatFullDate(new Date());

  // Theme colors
  const theme = {
    bg: darkMode ? 'bg-[#000000]' : 'bg-[#F2F2F7]',
    card: darkMode ? 'bg-[#1C1C1E]' : 'bg-white',
    cardHover: darkMode ? 'hover:bg-[#2C2C2E]' : 'hover:bg-gray-50',
    cardBorder: darkMode ? 'border-[#2C2C2E]' : 'border-gray-200',
    text: darkMode ? 'text-white' : 'text-gray-900',
    textSecondary: darkMode ? 'text-[#8E8E93]' : 'text-gray-500',
    textTertiary: darkMode ? 'text-[#636366]' : 'text-gray-400',
    input: darkMode ? 'bg-[#2C2C2E] border-[#3A3A3C] text-white placeholder-[#636366]' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400',
    modalBg: darkMode ? 'bg-[#1C1C1E]' : 'bg-white',
    divider: darkMode ? 'border-[#2C2C2E]' : 'border-gray-100',
    progressBg: darkMode ? 'bg-[#2C2C2E]' : 'bg-gray-100',
  };

  // Apple colors
  const colors = {
    blue: '#007AFF',
    green: '#34C759',
    purple: '#AF52DE',
    orange: '#FF9500',
    red: '#FF3B30',
    teal: '#5AC8FA',
  };

  // Auto-move scheduled backlog tasks
  useEffect(() => {
    const today = formatDateKey(new Date());
    const tasksToMove = backlog.filter(task => task.scheduledDate && task.scheduledDate <= today);
    
    if (tasksToMove.length > 0) {
      tasksToMove.forEach(task => {
        const dateKey = task.scheduledDate;
        setTasks(prev => ({
          ...prev,
          [dateKey]: [...(prev[dateKey] || []), { 
            id: task.id, 
            text: task.scheduledTime ? `${task.scheduledTime} · ${task.text}` : task.text, 
            completed: false 
          }]
        }));
      });
      setBacklog(prev => prev.filter(task => !task.scheduledDate || task.scheduledDate > today));
    }
  }, [backlog]);

  // Load from localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    const savedTasks = localStorage.getItem('tasks');
    const savedBacklog = localStorage.getItem('backlog');
    const savedPoints = localStorage.getItem('points');
    const savedStreak = localStorage.getItem('streak');
    const savedCompletedDays = localStorage.getItem('completedDays');
    
    if (savedDarkMode) setDarkMode(JSON.parse(savedDarkMode));
    if (savedTasks) setTasks(JSON.parse(savedTasks));
    if (savedBacklog) setBacklog(JSON.parse(savedBacklog));
    if (savedPoints) setPoints(JSON.parse(savedPoints));
    if (savedStreak) setStreak(JSON.parse(savedStreak));
    if (savedCompletedDays) setCompletedDays(JSON.parse(savedCompletedDays));
  }, []);

  // Save to localStorage
  useEffect(() => { localStorage.setItem('darkMode', JSON.stringify(darkMode)); }, [darkMode]);
  useEffect(() => { localStorage.setItem('tasks', JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem('backlog', JSON.stringify(backlog)); }, [backlog]);
  useEffect(() => { localStorage.setItem('points', JSON.stringify(points)); }, [points]);
  useEffect(() => { localStorage.setItem('streak', JSON.stringify(streak)); }, [streak]);
  useEffect(() => { localStorage.setItem('completedDays', JSON.stringify(completedDays)); }, [completedDays]);

  const weekDates = getWeekDates(currentDate);
  const monthDates = getMonthDates(currentDate);

  const addTask = (dateKey, text) => {
    if (!text?.trim()) return;
    setTasks(prev => ({
      ...prev,
      [dateKey]: [...(prev[dateKey] || []), { id: Date.now(), text: text.trim(), completed: false }]
    }));
  };

  const addToBacklog = (text, scheduledDate = null, scheduledTime = null) => {
    if (!text?.trim()) return;
    setBacklog(prev => [...prev, { 
      id: Date.now(), 
      text: text.trim(),
      scheduledDate: scheduledDate || null,
      scheduledTime: scheduledTime || null
    }]);
  };

  const moveFromBacklog = (taskId, dateKey) => {
    const task = backlog.find(t => t.id === taskId);
    if (task) {
      setBacklog(prev => prev.filter(t => t.id !== taskId));
      const taskText = task.scheduledTime ? `${task.scheduledTime} · ${task.text}` : task.text;
      setTasks(prev => ({
        ...prev,
        [dateKey]: [...(prev[dateKey] || []), { id: task.id, text: taskText, completed: false }]
      }));
    }
  };

  const deleteFromBacklog = (taskId) => {
    setBacklog(prev => prev.filter(t => t.id !== taskId));
  };

  const toggleTask = (dateKey, taskId) => {
    const task = tasks[dateKey]?.find(t => t.id === taskId);
    const wasCompleted = task?.completed;
    
    setTasks(prev => ({
      ...prev,
      [dateKey]: prev[dateKey].map(t => 
        t.id === taskId ? { ...t, completed: !t.completed } : t
      )
    }));

    if (!wasCompleted) {
      setPoints(prev => prev + 10);
    } else {
      setPoints(prev => Math.max(0, prev - 10));
    }
  };

  const deleteTask = (dateKey, taskId) => {
    setTasks(prev => ({
      ...prev,
      [dateKey]: prev[dateKey].filter(t => t.id !== taskId)
    }));
  };

  const getDayStats = (dateKey) => {
    const dayTasks = tasks[dateKey] || [];
    const total = dayTasks.length;
    const completed = dayTasks.filter(t => t.completed).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percentage };
  };

  const getWeekStats = () => {
    let total = 0, completed = 0;
    weekDates.forEach(date => {
      const dateKey = formatDateKey(date);
      const dayTasks = tasks[dateKey] || [];
      total += dayTasks.length;
      completed += dayTasks.filter(t => t.completed).length;
    });
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percentage };
  };

  const getMonthStats = () => {
    let total = 0, completed = 0;
    monthDates.forEach(date => {
      const dateKey = formatDateKey(date);
      const dayTasks = tasks[dateKey] || [];
      total += dayTasks.length;
      completed += dayTasks.filter(t => t.completed).length;
    });
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percentage };
  };

  const markDayComplete = () => {
    const today = formatDateKey(new Date());
    if (!completedDays.includes(today)) {
      setCompletedDays(prev => [...prev, today]);
      setStreak(prev => prev + 1);
      setPoints(prev => prev + 50);
    }
  };

  const generateDaySummary = () => {
    const today = formatDateKey(new Date());
    const todayTasks = tasks[today] || [];
    const completed = todayTasks.filter(t => t.completed);
    const incomplete = todayTasks.filter(t => !t.completed);
    const stats = getDayStats(today);
    
    const date = new Date();
    const dateStr = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
    
    let summary = `📊 סיכום יום - ${dateStr}\n\n`;
    
    if (completed.length > 0) {
      summary += `✅ הושלמו (${completed.length}):\n`;
      completed.forEach(t => { summary += `• ${t.text}\n`; });
      summary += '\n';
    }
    
    if (incomplete.length > 0) {
      summary += `❌ לא הושלמו (${incomplete.length}):\n`;
      incomplete.forEach(t => { summary += `• ${t.text}\n`; });
      summary += '\n';
    }
    
    summary += `📈 אחוז השלמה: ${stats.percentage}%\n`;
    summary += `🔥 סטריק: ${streak} ימים רצוף!\n`;
    summary += `⭐ סה"כ נקודות: ${points}\n`;
    
    return summary;
  };

  const copyToClipboard = async () => {
    const summary = generateDaySummary();
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const navigateWeek = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction * 7));
    setCurrentDate(newDate);
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const weekStats = getWeekStats();
  const monthStats = getMonthStats();
  const todayStats = getDayStats(formatDateKey(new Date()));

  const achievements = [
    { icon: Star, title: 'התחלה טובה', description: 'השלם משימה ראשונה', unlocked: points >= 10, color: colors.orange },
    { icon: Flame, title: 'על גלגלים', description: 'סטריק של 3 ימים', unlocked: streak >= 3, color: colors.orange },
    { icon: Trophy, title: 'אלוף השבוע', description: 'השלם 100% בשבוע', unlocked: weekStats.percentage === 100 && weekStats.total > 0, color: colors.green },
    { icon: Gift, title: 'צובר נקודות', description: 'צבור 500 נקודות', unlocked: points >= 500, color: colors.purple },
  ];

  // Task Input Component
  const TaskInput = ({ onAdd, placeholder }) => {
    const inputRef = useRef(null);
    
    const handleAdd = () => {
      const text = inputRef.current?.value?.trim();
      if (text) {
        onAdd(text);
        inputRef.current.value = '';
      }
    };
    
    return (
      <div className="flex gap-3">
        <input
          ref={inputRef}
          type="text"
          onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
          placeholder={placeholder}
          className={`flex-1 px-4 py-3 rounded-xl border text-[15px] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:border-transparent ${theme.input}`}
          dir="rtl"
        />
        <button
          onClick={handleAdd}
          className="px-4 py-3 bg-[#007AFF] text-white rounded-xl hover:bg-[#0056CC] transition-all duration-200 active:scale-95"
        >
          <Plus size={20} strokeWidth={2.5} />
        </button>
      </div>
    );
  };

  // Progress Bar Component
  const ProgressBar = ({ percentage, color = colors.blue, size = 'md' }) => {
    const heights = { sm: 'h-1.5', md: 'h-2', lg: 'h-3' };
    return (
      <div className={`w-full ${theme.progressBg} rounded-full ${heights[size]} overflow-hidden`}>
        <div 
          className={`${heights[size]} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
    );
  };

  // Day Column Component
  const DayColumn = ({ date, isToday }) => {
    const dateKey = formatDateKey(date);
    const dayTasks = tasks[dateKey] || [];
    const stats = getDayStats(dateKey);
    const dayIndex = date.getDay();

    return (
      <div className={`flex flex-col rounded-2xl transition-all duration-200 ${theme.card} ${isToday ? 'ring-2 ring-[#007AFF] shadow-lg' : 'shadow-sm'}`}>
        {/* Header */}
        <div className={`p-4 rounded-t-2xl ${isToday ? 'bg-[#007AFF]' : darkMode ? 'bg-[#2C2C2E]' : 'bg-gray-50'}`}>
          <div className="text-center">
            <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-100' : theme.textSecondary}`}>
              {hebrewDays[dayIndex]}
            </div>
            <div className={`text-2xl font-bold ${isToday ? 'text-white' : theme.text}`}>
              {date.getDate()}
            </div>
            <div className={`text-xs mt-1 ${isToday ? 'text-blue-100' : theme.textTertiary}`}>
              {hebrewMonths[date.getMonth()]}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className={`px-4 py-3 border-b ${theme.divider}`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-medium ${theme.textSecondary}`}>
              {stats.completed}/{stats.total}
            </span>
            <span className="text-xs font-bold" style={{ color: colors.blue }}>
              {stats.percentage}%
            </span>
          </div>
          <ProgressBar percentage={stats.percentage} color={isToday ? colors.blue : colors.green} size="sm" />
        </div>

        {/* Tasks */}
        <div className="flex-1 p-3 space-y-2 min-h-[180px] max-h-[280px] overflow-y-auto">
          {dayTasks.map(task => (
            <div 
              key={task.id} 
              className={`group flex items-start gap-3 p-3 rounded-xl transition-all duration-200 ${
                task.completed 
                  ? darkMode ? 'bg-[#1A2F1A]' : 'bg-green-50' 
                  : darkMode ? 'bg-[#2C2C2E]' : 'bg-gray-50'
              } ${!task.completed && (darkMode ? 'hover:bg-[#3A3A3C]' : 'hover:bg-gray-100')}`}
            >
              <button
                onClick={() => toggleTask(dateKey, task.id)}
                className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                  task.completed 
                    ? 'bg-[#34C759] border-[#34C759]' 
                    : `border-gray-300 ${darkMode ? 'hover:border-[#007AFF]' : 'hover:border-[#007AFF]'}`
                }`}
              >
                {task.completed && <Check size={14} className="text-white" strokeWidth={3} />}
              </button>
              <span className={`flex-1 text-[14px] leading-relaxed ${
                task.completed 
                  ? `line-through ${theme.textTertiary}` 
                  : theme.text
              }`}>
                {task.text}
              </span>
              <button
                onClick={() => deleteTask(dateKey, task.id)}
                className={`opacity-0 group-hover:opacity-100 p-1 rounded-lg transition-all duration-200 ${
                  darkMode ? 'hover:bg-red-900/30 text-red-400' : 'hover:bg-red-50 text-red-400'
                }`}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {dayTasks.length === 0 && (
            <div className={`text-center py-8 ${theme.textTertiary}`}>
              <div className="text-3xl mb-2">📝</div>
              <div className="text-sm">אין משימות</div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className={`p-3 border-t ${theme.divider}`}>
          <TaskInput 
            onAdd={(text) => addTask(dateKey, text)} 
            placeholder="משימה חדשה..."
          />
        </div>
      </div>
    );
  };

  // Month View Component
  const MonthView = () => {
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const startPadding = firstDayOfMonth.getDay();
    
    return (
      <div className="grid grid-cols-7 gap-2">
        {hebrewDays.map(day => (
          <div key={day} className={`text-center text-sm font-semibold py-3 ${theme.textSecondary}`}>
            {day}
          </div>
        ))}
        {Array(startPadding).fill(null).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {monthDates.map(date => {
          const dateKey = formatDateKey(date);
          const stats = getDayStats(dateKey);
          const isToday = formatDateKey(new Date()) === dateKey;
          const dayTasks = tasks[dateKey] || [];
          
          return (
            <div
              key={dateKey}
              onClick={() => setSelectedDay(date)}
              className={`p-3 rounded-xl cursor-pointer transition-all duration-200 min-h-[100px] ${
                isToday 
                  ? 'bg-[#007AFF] text-white shadow-lg' 
                  : `${theme.card} ${theme.cardHover} border ${theme.cardBorder}`
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-bold ${isToday ? 'text-white' : theme.text}`}>
                  {date.getDate()}
                </span>
                {stats.total > 0 && (
                  <span className={`text-xs font-medium ${isToday ? 'text-blue-100' : theme.textSecondary}`}>
                    {stats.completed}/{stats.total}
                  </span>
                )}
              </div>
              {stats.total > 0 && (
                <ProgressBar 
                  percentage={stats.percentage} 
                  color={isToday ? '#fff' : colors.green} 
                  size="sm" 
                />
              )}
              <div className="mt-2 space-y-1">
                {dayTasks.slice(0, 2).map(task => (
                  <div 
                    key={task.id} 
                    className={`text-xs truncate ${
                      isToday 
                        ? task.completed ? 'text-blue-200 line-through' : 'text-white' 
                        : task.completed ? `line-through ${theme.textTertiary}` : theme.textSecondary
                    }`}
                  >
                    {task.text}
                  </div>
                ))}
                {dayTasks.length > 2 && (
                  <div className={`text-xs font-medium ${isToday ? 'text-blue-100' : 'text-[#007AFF]'}`}>
                    +{dayTasks.length - 2} עוד
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Day Modal Component
  const DayModal = ({ date, onClose }) => {
    const dateKey = formatDateKey(date);
    const dayTasks = tasks[dateKey] || [];
    const stats = getDayStats(dateKey);

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className={`${theme.modalBg} rounded-3xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-hidden`}>
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-[#007AFF] to-[#5856D6] text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{hebrewDays[date.getDay()]}</div>
                <div className="text-blue-100 mt-1">{date.getDate()} {hebrewMonths[date.getMonth()]}</div>
              </div>
              <button 
                onClick={onClose} 
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>
          </div>
          
          {/* Stats */}
          <div className={`px-6 py-4 border-b ${theme.divider}`}>
            <div className="flex items-center justify-between mb-3">
              <span className={theme.textSecondary}>התקדמות יומית</span>
              <span className="text-lg font-bold text-[#007AFF]">{stats.percentage}%</span>
            </div>
            <ProgressBar percentage={stats.percentage} color={colors.blue} size="lg" />
            <div className={`text-sm mt-2 ${theme.textTertiary}`}>
              {stats.completed} מתוך {stats.total} משימות הושלמו
            </div>
          </div>

          {/* Tasks */}
          <div className="p-4 space-y-2 max-h-[40vh] overflow-y-auto">
            {dayTasks.map(task => (
              <div 
                key={task.id}
                className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-200 ${
                  task.completed 
                    ? darkMode ? 'bg-[#1A2F1A]' : 'bg-green-50'
                    : darkMode ? 'bg-[#2C2C2E]' : 'bg-gray-50'
                }`}
              >
                <button
                  onClick={() => toggleTask(dateKey, task.id)}
                  className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                    task.completed 
                      ? 'bg-[#34C759] border-[#34C759]' 
                      : 'border-gray-300 hover:border-[#007AFF]'
                  }`}
                >
                  {task.completed && <Check size={16} className="text-white" strokeWidth={3} />}
                </button>
                <span className={`flex-1 text-[15px] ${
                  task.completed ? `line-through ${theme.textTertiary}` : theme.text
                }`}>
                  {task.text}
                </span>
                <button
                  onClick={() => deleteTask(dateKey, task.id)}
                  className={`p-2 rounded-lg transition-all ${darkMode ? 'hover:bg-red-900/30' : 'hover:bg-red-50'} text-red-400`}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className={`p-4 border-t ${theme.divider}`}>
            <TaskInput 
              onAdd={(text) => addTask(dateKey, text)} 
              placeholder="הוסף משימה חדשה..."
            />
          </div>
        </div>
      </div>
    );
  };

  // Backlog Modal Component
  const BacklogModal = () => {
    const backlogInputRef = useRef(null);
    
    const handleAddToBacklog = () => {
      const text = backlogInputRef.current?.value?.trim();
      if (text) {
        addToBacklog(text, newBacklogDate || null, newBacklogTime || null);
        backlogInputRef.current.value = '';
        setNewBacklogDate('');
        setNewBacklogTime('');
      }
    };

    const formatDisplayDate = (dateStr) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return `${date.getDate()}/${date.getMonth() + 1}`;
    };

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className={`${theme.modalBg} rounded-3xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden`}>
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-[#AF52DE] to-[#5856D6] text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Calendar size={24} />
                </div>
                <div>
                  <div className="text-xl font-bold">משימות עתידיות</div>
                  <div className="text-purple-100 text-sm">{backlog.length} משימות מתוזמנות</div>
                </div>
              </div>
              <button 
                onClick={() => setShowBacklog(false)} 
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Tasks */}
          <div className="p-4 space-y-2 max-h-[35vh] overflow-y-auto">
            {backlog.length === 0 ? (
              <div className={`text-center py-12 ${theme.textTertiary}`}>
                <div className="text-5xl mb-3">📅</div>
                <div className="font-medium mb-1">אין משימות מתוזמנות</div>
                <div className="text-sm">הוסף משימות עם תאריך ושעה</div>
              </div>
            ) : (
              backlog.map(task => (
                <div 
                  key={task.id} 
                  className={`flex items-center gap-3 p-4 rounded-xl transition-all duration-200 ${
                    darkMode ? 'bg-[#2C2C2E] hover:bg-[#3A3A3C]' : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className={`text-[15px] ${theme.text}`}>{task.text}</div>
                    {(task.scheduledDate || task.scheduledTime) && (
                      <div className="flex items-center gap-2 mt-2">
                        {task.scheduledDate && (
                          <span className="text-xs px-2.5 py-1 bg-[#AF52DE]/20 text-[#AF52DE] rounded-full font-medium">
                            📅 {formatDisplayDate(task.scheduledDate)}
                          </span>
                        )}
                        {task.scheduledTime && (
                          <span className="text-xs px-2.5 py-1 bg-[#007AFF]/20 text-[#007AFF] rounded-full font-medium">
                            ⏰ {task.scheduledTime}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => moveFromBacklog(task.id, formatDateKey(new Date()))}
                    className="p-2.5 text-[#34C759] hover:bg-[#34C759]/10 rounded-xl transition-all"
                    title="העבר להיום"
                  >
                    <ArrowRight size={18} />
                  </button>
                  <button
                    onClick={() => deleteFromBacklog(task.id)}
                    className={`p-2.5 rounded-xl transition-all ${darkMode ? 'hover:bg-red-900/30' : 'hover:bg-red-50'} text-red-400`}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Input Section */}
          <div className={`p-4 border-t ${theme.divider} space-y-3`}>
            <input
              ref={backlogInputRef}
              type="text"
              onKeyPress={(e) => e.key === 'Enter' && handleAddToBacklog()}
              placeholder="תיאור המשימה..."
              className={`w-full px-4 py-3 rounded-xl border text-[15px] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#AF52DE] focus:border-transparent ${theme.input}`}
              dir="rtl"
            />
            
            <div className="flex gap-3">
              <div className="flex-1">
                <label className={`text-xs font-medium ${theme.textSecondary} mb-1.5 block`}>תאריך</label>
                <input
                  type="date"
                  value={newBacklogDate}
                  onChange={(e) => setNewBacklogDate(e.target.value)}
                  min={formatDateKey(new Date())}
                  className={`w-full px-3 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#AF52DE] ${theme.input}`}
                />
              </div>
              <div className="flex-1">
                <label className={`text-xs font-medium ${theme.textSecondary} mb-1.5 block`}>שעה</label>
                <input
                  type="time"
                  value={newBacklogTime}
                  onChange={(e) => setNewBacklogTime(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#AF52DE] ${theme.input}`}
                />
              </div>
            </div>

            <button
              onClick={handleAddToBacklog}
              className="w-full py-3.5 bg-gradient-to-r from-[#AF52DE] to-[#5856D6] text-white rounded-xl font-semibold transition-all duration-200 hover:opacity-90 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Plus size={20} strokeWidth={2.5} />
              הוסף משימה
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Summary Modal Component
  const SummaryModal = () => {
    const today = formatDateKey(new Date());
    const todayTasks = tasks[today] || [];
    const completed = todayTasks.filter(t => t.completed);
    const incomplete = todayTasks.filter(t => !t.completed);

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className={`${theme.modalBg} rounded-3xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden`}>
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-[#34C759] to-[#30D158] text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xl font-bold">📊 סיכום יום</div>
                <div className="text-green-100 text-sm mt-1">{new Date().toLocaleDateString('he-IL')}</div>
              </div>
              <button 
                onClick={() => setShowSummary(false)} 
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className={`p-4 rounded-2xl text-center ${darkMode ? 'bg-[#1A2F1A]' : 'bg-green-50'}`}>
                <div className="text-3xl font-bold text-[#34C759]">{todayStats.percentage}%</div>
                <div className={`text-sm mt-1 ${theme.textSecondary}`}>הושלם</div>
              </div>
              <div className={`p-4 rounded-2xl text-center ${darkMode ? 'bg-[#2F1F00]' : 'bg-orange-50'}`}>
                <div className="text-3xl font-bold text-[#FF9500]">{streak}</div>
                <div className={`text-sm mt-1 ${theme.textSecondary}`}>סטריק 🔥</div>
              </div>
              <div className={`p-4 rounded-2xl text-center ${darkMode ? 'bg-[#1F1A2F]' : 'bg-purple-50'}`}>
                <div className="text-3xl font-bold text-[#AF52DE]">{points}</div>
                <div className={`text-sm mt-1 ${theme.textSecondary}`}>נקודות ⭐</div>
              </div>
            </div>

            {/* Completed */}
            {completed.length > 0 && (
              <div>
                <div className="text-sm font-semibold text-[#34C759] mb-2">✅ הושלמו ({completed.length})</div>
                <div className={`${darkMode ? 'bg-[#2C2C2E]' : 'bg-gray-50'} rounded-xl p-3 space-y-1`}>
                  {completed.map(t => (
                    <div key={t.id} className={`text-sm ${theme.textSecondary}`}>• {t.text}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Incomplete */}
            {incomplete.length > 0 && (
              <div>
                <div className="text-sm font-semibold text-[#FF3B30] mb-2">❌ לא הושלמו ({incomplete.length})</div>
                <div className={`${darkMode ? 'bg-[#2C2C2E]' : 'bg-gray-50'} rounded-xl p-3 space-y-1`}>
                  {incomplete.map(t => (
                    <div key={t.id} className={`text-sm ${theme.textSecondary}`}>• {t.text}</div>
                  ))}
                </div>
              </div>
            )}

            {todayTasks.length === 0 && (
              <div className={`text-center py-8 ${theme.textTertiary}`}>
                <div className="text-4xl mb-2">📝</div>
                <div>אין משימות להיום</div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className={`p-4 border-t ${theme.divider} flex gap-3`}>
            <button
              onClick={copyToClipboard}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold transition-all duration-200 ${
                copied 
                  ? 'bg-[#34C759] text-white' 
                  : `${darkMode ? 'bg-[#2C2C2E] hover:bg-[#3A3A3C]' : 'bg-gray-100 hover:bg-gray-200'} ${theme.text}`
              }`}
            >
              {copied ? <CheckCheck size={20} /> : <Copy size={20} />}
              {copied ? 'הועתק!' : 'העתק סיכום'}
            </button>
            <button
              onClick={() => { markDayComplete(); setShowSummary(false); }}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-[#34C759] hover:bg-[#2DB550] text-white rounded-xl font-semibold transition-all duration-200"
            >
              <Check size={20} strokeWidth={2.5} />
              סיים יום
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Stats Modal Component
  const StatsModal = () => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`${theme.modalBg} rounded-3xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden`}>
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-[#AF52DE] to-[#FF2D55] text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <Trophy size={24} />
              </div>
              <div>
                <div className="text-xl font-bold">הסטטיסטיקות שלי</div>
                <div className="text-pink-100 text-sm">{points} נקודות</div>
              </div>
            </div>
            <button 
              onClick={() => setShowStats(false)} 
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Pie Charts */}
          <div className="flex justify-around items-center py-2">
            <div className="text-center">
              <PieChart 
                percentage={weekStats.percentage} 
                color={colors.blue}
                size={100}
                strokeWidth={8}
                darkMode={darkMode}
              />
              <div className={`text-sm font-medium mt-3 ${theme.textSecondary}`}>שבועי</div>
            </div>
            <div className="text-center">
              <PieChart 
                percentage={monthStats.percentage} 
                color={colors.purple}
                size={100}
                strokeWidth={8}
                darkMode={darkMode}
              />
              <div className={`text-sm font-medium mt-3 ${theme.textSecondary}`}>חודשי</div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className={`p-5 rounded-2xl text-center ${darkMode ? 'bg-[#2F1F00]' : 'bg-orange-50'}`}>
              <Flame className="mx-auto mb-2 text-[#FF9500]" size={28} />
              <div className="text-3xl font-bold text-[#FF9500]">{streak}</div>
              <div className={`text-sm ${theme.textSecondary}`}>ימים רצוף</div>
            </div>
            <div className={`p-5 rounded-2xl text-center ${darkMode ? 'bg-[#1F1A2F]' : 'bg-purple-50'}`}>
              <Star className="mx-auto mb-2 text-[#AF52DE]" size={28} />
              <div className="text-3xl font-bold text-[#AF52DE]">{points}</div>
              <div className={`text-sm ${theme.textSecondary}`}>נקודות</div>
            </div>
            <div className={`p-5 rounded-2xl text-center ${darkMode ? 'bg-[#001F3F]' : 'bg-blue-50'}`}>
              <div className="text-3xl font-bold text-[#007AFF]">{weekStats.completed}</div>
              <div className={`text-sm ${theme.textSecondary}`}>משימות השבוע</div>
            </div>
            <div className={`p-5 rounded-2xl text-center ${darkMode ? 'bg-[#1A2F1A]' : 'bg-green-50'}`}>
              <div className="text-3xl font-bold text-[#34C759]">{monthStats.completed}</div>
              <div className={`text-sm ${theme.textSecondary}`}>משימות החודש</div>
            </div>
          </div>

          {/* Achievements */}
          <div>
            <div className={`text-lg font-bold mb-4 ${theme.text}`}>🏆 הישגים</div>
            <div className="space-y-2">
              {achievements.map((achievement, i) => (
                <div 
                  key={i} 
                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                    achievement.unlocked 
                      ? 'border-[#34C759]/30 bg-[#34C759]/5' 
                      : `${theme.cardBorder} ${darkMode ? 'bg-[#1C1C1E]' : 'bg-gray-50'} opacity-50`
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div 
                      className="p-2.5 rounded-xl"
                      style={{ backgroundColor: achievement.unlocked ? `${achievement.color}20` : darkMode ? '#2C2C2E' : '#E5E5EA' }}
                    >
                      <achievement.icon 
                        size={22} 
                        style={{ color: achievement.unlocked ? achievement.color : darkMode ? '#636366' : '#8E8E93' }}
                      />
                    </div>
                    <div className="flex-1">
                      <div className={`font-semibold ${achievement.unlocked ? theme.text : theme.textTertiary}`}>
                        {achievement.title}
                      </div>
                      <div className={`text-sm ${theme.textSecondary}`}>{achievement.description}</div>
                    </div>
                    {achievement.unlocked && <Check className="text-[#34C759]" size={22} strokeWidth={3} />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme.bg} p-6`} dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className={`${theme.card} rounded-2xl shadow-sm p-6`}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Title & Date */}
            <div>
              <div className="flex items-center gap-3">
                <span className="text-3xl">{greeting.emoji}</span>
                <h1 className={`text-3xl font-bold ${theme.text}`}>{greeting.text}</h1>
              </div>
              <p className={`mt-2 ${theme.textSecondary}`}>
                {todayFullDate}
              </p>
            </div>
            
            {/* Actions Row */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Dark Mode Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-3 rounded-xl transition-all duration-200 ${
                  darkMode 
                    ? 'bg-[#2C2C2E] hover:bg-[#3A3A3C] text-yellow-400' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                }`}
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              {/* Quick Stats */}
              <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl ${darkMode ? 'bg-[#2F1F00]' : 'bg-orange-50'}`}>
                <Flame className="text-[#FF9500]" size={18} />
                <span className="font-bold text-[#FF9500]">{streak}</span>
              </div>
              <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl ${darkMode ? 'bg-[#1F1A2F]' : 'bg-purple-50'}`}>
                <Star className="text-[#AF52DE]" size={18} />
                <span className="font-bold text-[#AF52DE]">{points}</span>
              </div>

              {/* Action Buttons */}
              <button
                onClick={() => setShowBacklog(true)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                  darkMode 
                    ? 'bg-[#AF52DE]/20 hover:bg-[#AF52DE]/30 text-[#AF52DE]' 
                    : 'bg-purple-100 hover:bg-purple-200 text-purple-700'
                }`}
              >
                <Archive size={18} />
                <span>עתידיות</span>
                {backlog.length > 0 && (
                  <span className="bg-[#AF52DE] text-white text-xs px-2 py-0.5 rounded-full font-bold">
                    {backlog.length}
                  </span>
                )}
              </button>
              
              <button
                onClick={() => setShowSummary(true)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                  darkMode 
                    ? 'bg-[#34C759]/20 hover:bg-[#34C759]/30 text-[#34C759]' 
                    : 'bg-green-100 hover:bg-green-200 text-green-700'
                }`}
              >
                <BarChart3 size={18} />
                <span>סיכום יום</span>
              </button>

              <button
                onClick={() => setShowStats(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#AF52DE] to-[#FF2D55] text-white rounded-xl font-medium transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
              >
                <Trophy size={18} />
                <span>סטטיסטיקות</span>
              </button>
            </div>
          </div>

          {/* View Toggle & Navigation */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t border-opacity-10" style={{ borderColor: darkMode ? '#3A3A3C' : '#E5E5EA' }}>
            <div className={`flex p-1.5 rounded-xl ${darkMode ? 'bg-[#2C2C2E]' : 'bg-gray-100'}`}>
              {['day', 'week', 'month'].map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    view === v 
                      ? `${theme.card} shadow-sm text-[#007AFF]` 
                      : `${theme.textSecondary} hover:${theme.text}`
                  }`}
                >
                  {v === 'day' ? 'יום' : v === 'week' ? 'שבוע' : 'חודש'}
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => view === 'month' ? navigateMonth(-1) : navigateWeek(-1)}
                className={`p-2.5 rounded-xl transition-all duration-200 ${darkMode ? 'hover:bg-[#2C2C2E]' : 'hover:bg-gray-100'} ${theme.textSecondary}`}
              >
                <ChevronRight size={22} />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-5 py-2.5 text-sm font-semibold text-[#007AFF] hover:bg-[#007AFF]/10 rounded-xl transition-all duration-200"
              >
                היום
              </button>
              <button
                onClick={() => view === 'month' ? navigateMonth(1) : navigateWeek(1)}
                className={`p-2.5 rounded-xl transition-all duration-200 ${darkMode ? 'hover:bg-[#2C2C2E]' : 'hover:bg-gray-100'} ${theme.textSecondary}`}
              >
                <ChevronLeft size={22} />
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`${theme.card} rounded-2xl shadow-sm p-6`}>
            <div className="flex items-center gap-5">
              <div className={`p-4 rounded-2xl ${darkMode ? 'bg-[#1A2F1A]' : 'bg-green-50'}`}>
                <Target className="text-[#34C759]" size={26} />
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium ${theme.textSecondary}`}>התקדמות יומית</div>
                <div className={`text-3xl font-bold mt-1 ${theme.text}`}>{todayStats.percentage}%</div>
                <div className={`text-sm ${theme.textTertiary}`}>{todayStats.completed}/{todayStats.total} משימות</div>
              </div>
              <PieChart percentage={todayStats.percentage} size={64} strokeWidth={6} color={colors.green} darkMode={darkMode} />
            </div>
          </div>

          <div className={`${theme.card} rounded-2xl shadow-sm p-6`}>
            <div className="flex items-center gap-5">
              <div className={`p-4 rounded-2xl ${darkMode ? 'bg-[#001F3F]' : 'bg-blue-50'}`}>
                <BarChart3 className="text-[#007AFF]" size={26} />
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium ${theme.textSecondary}`}>התקדמות שבועית</div>
                <div className={`text-3xl font-bold mt-1 ${theme.text}`}>{weekStats.percentage}%</div>
                <div className={`text-sm ${theme.textTertiary}`}>{weekStats.completed}/{weekStats.total} משימות</div>
              </div>
              <PieChart percentage={weekStats.percentage} size={64} strokeWidth={6} color={colors.blue} darkMode={darkMode} />
            </div>
          </div>

          <div className={`${theme.card} rounded-2xl shadow-sm p-6`}>
            <div className="flex items-center gap-5">
              <div className={`p-4 rounded-2xl ${darkMode ? 'bg-[#1F1A2F]' : 'bg-purple-50'}`}>
                <TrendingUp className="text-[#AF52DE]" size={26} />
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium ${theme.textSecondary}`}>התקדמות חודשית</div>
                <div className={`text-3xl font-bold mt-1 ${theme.text}`}>{monthStats.percentage}%</div>
                <div className={`text-sm ${theme.textTertiary}`}>{monthStats.completed}/{monthStats.total} משימות</div>
              </div>
              <PieChart percentage={monthStats.percentage} size={64} strokeWidth={6} color={colors.purple} darkMode={darkMode} />
            </div>
          </div>
        </div>

        {/* Weekly Chart */}
        {view !== 'month' && (
          <div className={`${theme.card} rounded-2xl shadow-sm p-6`}>
            <h3 className={`text-lg font-bold mb-6 ${theme.text}`}>גרף השלמת משימות שבועי</h3>
            <div className="flex items-end justify-between gap-3 h-40">
              {weekDates.map((date, i) => {
                const stats = getDayStats(formatDateKey(date));
                const isToday = formatDateKey(new Date()) === formatDateKey(date);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-3">
                    <div className={`text-sm font-semibold ${isToday ? 'text-[#007AFF]' : theme.textSecondary}`}>
                      {stats.percentage}%
                    </div>
                    <div className={`w-full rounded-xl relative ${theme.progressBg}`} style={{ height: '100px' }}>
                      <div 
                        className="absolute bottom-0 w-full rounded-xl transition-all duration-500"
                        style={{ 
                          height: `${Math.max(stats.percentage, 2)}%`,
                          backgroundColor: isToday ? colors.blue : colors.green
                        }}
                      />
                    </div>
                    <div className={`text-sm font-medium ${isToday ? 'text-[#007AFF]' : theme.textSecondary}`}>
                      {hebrewDays[date.getDay()]}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Main Content */}
        {view === 'day' && (
          <div className="flex justify-center">
            <div className="w-full max-w-lg">
              <DayColumn date={new Date()} isToday={true} />
            </div>
          </div>
        )}

        {view === 'week' && (
          <div className="grid grid-cols-7 gap-4">
            {weekDates.map((date, i) => (
              <DayColumn 
                key={i} 
                date={date} 
                isToday={formatDateKey(new Date()) === formatDateKey(date)}
              />
            ))}
          </div>
        )}

        {view === 'month' && (
          <div className={`${theme.card} rounded-2xl shadow-sm p-6`}>
            <MonthView />
          </div>
        )}

        {/* Modals */}
        {selectedDay && <DayModal date={selectedDay} onClose={() => setSelectedDay(null)} />}
        {showBacklog && <BacklogModal />}
        {showSummary && <SummaryModal />}
        {showStats && <StatsModal />}
      </div>
    </div>
  );
}
