'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Check, Trash2, ChevronLeft, ChevronRight, X, Moon, Sun, Search, ChevronDown, ChevronUp, Repeat, Calendar, Clock, Settings, Edit2 } from 'lucide-react';

// Constants
const hebrewDays = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const hebrewMonths = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];

const HOURS = Array.from({ length: 16 }, (_, i) => i + 6);

const TAGS = [
  { id: 'work', name: 'עבודה', color: '#2563EB' },      // כחול - הדגשה ראשית
  { id: 'personal', name: 'אישי', color: '#64748B' },   // אפור-כחלחל
  { id: 'urgent', name: 'דחוף', color: '#B91C1C' },     // אדום כהה מעודן
];

// Utility functions
const getWeekDates = (date) => {
  const curr = new Date(date);
  const day = curr.getDay();
  const diff = curr.getDate() - day;
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(curr);
    d.setDate(diff + i);
    return d;
  });
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

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'בוקר טוב, שקד';
  if (hour >= 12 && hour < 17) return 'צהריים טובים, שקד';
  if (hour >= 17 && hour < 21) return 'ערב טוב, שקד';
  return 'לילה טוב, שקד';
};

// Mini Pie Chart Component
const PieChart = ({ percentage, size = 44, strokeWidth = 4, darkMode }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;
  const bgColor = darkMode ? '#2A2A2A' : '#E5E5E5';
  const accentColor = '#2563EB';
  
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
          stroke={accentColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-xs font-bold ${darkMode ? 'text-[#F5F5F5]' : 'text-[#1A1A1A]'}`}>
          {percentage}%
        </span>
      </div>
    </div>
  );
};

export default function TaskManager() {
  // State
  const [darkMode, setDarkMode] = useState(false);
  const [tasks, setTasks] = useState({});
  const [recurringTasks, setRecurringTasks] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('week');
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredDay, setHoveredDay] = useState(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTaskDate, setNewTaskDate] = useState(null);
  const [showRecurringManager, setShowRecurringManager] = useState(false);
  const [streak, setStreak] = useState(0);
  
  const searchInputRef = useRef(null);
  const greeting = getGreeting();
  const today = formatDateKey(new Date());

  // Theme
  const theme = {
    bg: darkMode ? 'bg-[#0A0A0A]' : 'bg-[#F8F8F8]',
    card: darkMode ? 'bg-[#161616]' : 'bg-white',
    cardHover: darkMode ? 'hover:bg-[#1E1E1E]' : 'hover:bg-[#FAFAFA]',
    border: darkMode ? 'border-[#252525]' : 'border-[#E8E8E8]',
    text: darkMode ? 'text-[#F5F5F5]' : 'text-[#1A1A1A]',
    textSecondary: darkMode ? 'text-[#A0A0A0]' : 'text-[#6B6B6B]',
    textMuted: darkMode ? 'text-[#606060]' : 'text-[#9CA3AF]',
    accent: '#2563EB',
    input: darkMode 
      ? 'bg-[#1E1E1E] border-[#2A2A2A] text-[#F5F5F5] placeholder-[#505050]' 
      : 'bg-white border-[#E5E5E5] text-[#1A1A1A] placeholder-[#9CA3AF]',
  };

  // Load/Save localStorage
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    const saved = localStorage.getItem('taskManagerPro');
    if (saved) {
      const data = JSON.parse(saved);
      setDarkMode(data.darkMode ?? false);
      setTasks(data.tasks ?? {});
      setRecurringTasks(data.recurringTasks ?? []);
      setStreak(data.streak ?? 0);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('taskManagerPro', JSON.stringify({
      darkMode, tasks, recurringTasks, streak
    }));
  }, [darkMode, tasks, recurringTasks, streak, isLoaded]);

  // Process recurring tasks - creates tasks for today and generates for future days when needed
  useEffect(() => {
    if (!isLoaded || recurringTasks.length === 0) return;
    
    const todayDate = new Date();
    const todayKey = formatDateKey(todayDate);
    const todayDayOfWeek = todayDate.getDay();
    const todayDayOfMonth = todayDate.getDate();

    let tasksToAdd = [];

    recurringTasks.forEach(rt => {
      let shouldAdd = false;

      if (rt.frequency === 'daily') {
        shouldAdd = true;
      } else if (rt.frequency === 'weekly') {
        const days = rt.daysOfWeek || [];
        shouldAdd = days.includes(todayDayOfWeek);
      } else if (rt.frequency === 'monthly' && rt.dayOfMonth === todayDayOfMonth) {
        shouldAdd = true;
      }

      if (shouldAdd) {
        tasksToAdd.push(rt);
      }
    });

    if (tasksToAdd.length > 0) {
      setTasks(prev => {
        const currentTasks = prev[todayKey] || [];
        const newTasks = [...currentTasks];
        
        tasksToAdd.forEach(rt => {
          const exists = currentTasks.some(t => t.recurringId === rt.id);
          if (!exists) {
            newTasks.push({
              id: Date.now() + Math.random(),
              text: rt.text,
              completed: false,
              time: rt.time || null,
              tag: rt.tag || null,
              recurringId: rt.id,
              subtasks: []
            });
          }
        });

        if (newTasks.length !== currentTasks.length) {
          return { ...prev, [todayKey]: newTasks };
        }
        return prev;
      });
    }
  }, [recurringTasks, isLoaded]);

  // Generate recurring tasks for a specific date
  const generateRecurringForDate = useCallback((dateKey) => {
    if (recurringTasks.length === 0) return;
    
    const date = new Date(dateKey);
    const dayOfWeek = date.getDay();
    const dayOfMonth = date.getDate();
    
    // Don't generate for past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return;
    
    let tasksToAdd = [];

    recurringTasks.forEach(rt => {
      let shouldAdd = false;

      if (rt.frequency === 'daily') {
        shouldAdd = true;
      } else if (rt.frequency === 'weekly') {
        const days = rt.daysOfWeek || [];
        shouldAdd = days.includes(dayOfWeek);
      } else if (rt.frequency === 'monthly' && rt.dayOfMonth === dayOfMonth) {
        shouldAdd = true;
      }

      if (shouldAdd) {
        tasksToAdd.push(rt);
      }
    });

    if (tasksToAdd.length > 0) {
      setTasks(prev => {
        const currentTasks = prev[dateKey] || [];
        const newTasks = [...currentTasks];
        let hasChanges = false;
        
        tasksToAdd.forEach(rt => {
          const exists = currentTasks.some(t => t.recurringId === rt.id);
          if (!exists) {
            newTasks.push({
              id: Date.now() + Math.random(),
              text: rt.text,
              completed: false,
              time: rt.time || null,
              tag: rt.tag || null,
              recurringId: rt.id,
              subtasks: []
            });
            hasChanges = true;
          }
        });

        if (hasChanges) {
          return { ...prev, [dateKey]: newTasks };
        }
        return prev;
      });
    }
  }, [recurringTasks]);

  // Generate recurring tasks for visible dates + one month ahead
  useEffect(() => {
    if (!isLoaded || recurringTasks.length === 0) return;
    
    // Generate for current view
    if (view === 'day') {
      generateRecurringForDate(formatDateKey(currentDate));
    } else if (view === 'week') {
      const weekDts = getWeekDates(currentDate);
      weekDts.forEach(date => {
        generateRecurringForDate(formatDateKey(date));
      });
    } else if (view === 'month') {
      // Generate for current month
      const monthDts = getMonthDates(currentDate);
      monthDts.forEach(date => {
        generateRecurringForDate(formatDateKey(date));
      });
      
      // Also generate for next month
      const nextMonth = new Date(currentDate);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      const nextMonthDts = getMonthDates(nextMonth);
      nextMonthDts.forEach(date => {
        generateRecurringForDate(formatDateKey(date));
      });
    }
  }, [currentDate, view, isLoaded, generateRecurringForDate]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
      
      switch(e.key.toLowerCase()) {
        case 'n':
          e.preventDefault();
          setNewTaskDate(formatDateKey(new Date()));
          setShowNewTask(true);
          break;
        case 't':
          e.preventDefault();
          setCurrentDate(new Date());
          break;
        case '1':
          e.preventDefault();
          setView('day');
          break;
        case '2':
          e.preventDefault();
          setView('week');
          break;
        case '3':
          e.preventDefault();
          setView('month');
          break;
        case 'arrowleft':
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            navigate(1);
          }
          break;
        case 'arrowright':
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            navigate(-1);
          }
          break;
        case '/':
          e.preventDefault();
          setShowSearch(true);
          setTimeout(() => searchInputRef.current?.focus(), 100);
          break;
        case 'escape':
          setShowSearch(false);
          setShowNewTask(false);
          setShowRecurringManager(false);
          break;
        case 'r':
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            setShowRecurringManager(true);
          }
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [view]);

  // Navigation
  const navigate = (direction) => {
    const newDate = new Date(currentDate);
    if (view === 'month') newDate.setMonth(newDate.getMonth() + direction);
    else if (view === 'week') newDate.setDate(newDate.getDate() + (direction * 7));
    else newDate.setDate(newDate.getDate() + direction);
    setCurrentDate(newDate);
  };

  // Task operations
  const addTask = (dateKey, taskData) => {
    const newTask = {
      id: Date.now(),
      text: taskData.text,
      completed: false,
      time: taskData.time || null,
      tag: taskData.tag || null,
      subtasks: taskData.subtasks || [],
    };
    setTasks(prev => ({
      ...prev,
      [dateKey]: [...(prev[dateKey] || []), newTask]
    }));
  };

  const addRecurringTask = (taskData) => {
    const newRecurring = {
      id: Date.now(),
      text: taskData.text,
      time: taskData.time || null,
      tag: taskData.tag || null,
      frequency: taskData.frequency,
      daysOfWeek: taskData.daysOfWeek || [],
      dayOfMonth: taskData.dayOfMonth,
    };
    setRecurringTasks(prev => [...prev, newRecurring]);
  };

  const deleteRecurringTask = (id) => {
    setRecurringTasks(prev => prev.filter(rt => rt.id !== id));
  };

  const toggleTask = (dateKey, taskId) => {
    setTasks(prev => ({
      ...prev,
      [dateKey]: prev[dateKey].map(t => 
        t.id === taskId ? { ...t, completed: !t.completed } : t
      )
    }));
  };

  const toggleSubtask = (dateKey, taskId, subtaskId) => {
    setTasks(prev => ({
      ...prev,
      [dateKey]: prev[dateKey].map(t => 
        t.id === taskId 
          ? { ...t, subtasks: t.subtasks.map(st => 
              st.id === subtaskId ? { ...st, completed: !st.completed } : st
            )}
          : t
      )
    }));
  };

  const deleteTask = (dateKey, taskId) => {
    setTasks(prev => ({
      ...prev,
      [dateKey]: prev[dateKey].filter(t => t.id !== taskId)
    }));
  };

  const getDayStats = (dateKey) => {
    const dayTasks = tasks[dateKey] || [];
    let total = 0, completed = 0;
    let tagCounts = { work: 0, personal: 0, urgent: 0, none: 0 };
    
    dayTasks.forEach(task => {
      if (task.subtasks?.length > 0) {
        total += task.subtasks.length;
        completed += task.subtasks.filter(st => st.completed).length;
      } else {
        total += 1;
        completed += task.completed ? 1 : 0;
      }
      // Count by tag
      if (task.tag && tagCounts.hasOwnProperty(task.tag)) {
        tagCounts[task.tag]++;
      } else {
        tagCounts.none++;
      }
    });
    
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percentage, tasks: dayTasks, tagCounts };
  };

  const getWeekStats = () => {
    const weekDts = getWeekDates(currentDate);
    let total = 0, completed = 0;
    weekDts.forEach(date => {
      const stats = getDayStats(formatDateKey(date));
      total += stats.total;
      completed += stats.completed;
    });
    return { total, completed, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
  };

  const getMonthStats = () => {
    const monthDts = getMonthDates(currentDate);
    let total = 0, completed = 0;
    monthDts.forEach(date => {
      const stats = getDayStats(formatDateKey(date));
      total += stats.total;
      completed += stats.completed;
    });
    return { total, completed, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
  };

  // Search
  const searchResults = searchQuery.trim() 
    ? Object.entries(tasks).flatMap(([dateKey, dayTasks]) =>
        dayTasks.filter(t => t.text.includes(searchQuery)).map(t => ({ ...t, dateKey }))
      )
    : [];

  // Get next task
  const getNextTask = () => {
    const todayTasks = tasks[today] || [];
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    const upcoming = todayTasks
      .filter(t => !t.completed && t.time)
      .map(t => {
        const [hours, minutes] = t.time.split(':').map(Number);
        return { ...t, minutes: hours * 60 + minutes };
      })
      .filter(t => t.minutes >= currentMinutes)
      .sort((a, b) => a.minutes - b.minutes);
    
    return upcoming[0] || todayTasks.find(t => !t.completed);
  };

  const weekDates = getWeekDates(currentDate);
  const monthDates = getMonthDates(currentDate);
  const todayStats = getDayStats(today);
  const weekStats = getWeekStats();
  const monthStats = getMonthStats();
  const nextTask = getNextTask();

  // Task Item Component
  const TaskItem = ({ task, dateKey, compact = false }) => {
    const [expanded, setExpanded] = useState(false);
    const hasSubtasks = task.subtasks?.length > 0;
    const completedSubtasks = task.subtasks?.filter(st => st.completed).length || 0;
    const tag = TAGS.find(t => t.id === task.tag);
    const isFullyCompleted = hasSubtasks 
      ? completedSubtasks === task.subtasks.length 
      : task.completed;

    return (
      <div className={`group ${compact ? 'py-1.5' : 'py-2.5'}`}>
        <div className="flex items-start gap-3">
          <button
            onClick={() => !hasSubtasks && toggleTask(dateKey, task.id)}
            className={`flex-shrink-0 w-5 h-5 mt-0.5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
              isFullyCompleted
                ? 'bg-[#2563EB] border-[#2563EB]' 
                : `${darkMode ? 'border-[#404040]' : 'border-[#D1D5DB]'} hover:border-[#2563EB]`
            }`}
          >
            {isFullyCompleted && <Check size={12} className="text-white" strokeWidth={3} />}
          </button>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {task.time && (
                <span className={`text-xs font-mono font-medium ${theme.textMuted}`}>
                  {task.time}
                </span>
              )}
              <span className={`${compact ? 'text-sm' : 'text-[15px]'} leading-snug ${
                isFullyCompleted ? `line-through ${theme.textMuted}` : theme.text
              }`}>
                {task.text}
              </span>
              {tag && (
                <span 
                  className="text-[11px] px-2 py-0.5 rounded-md font-semibold border"
                  style={{ 
                    backgroundColor: `${tag.color}20`, 
                    color: tag.color,
                    borderColor: `${tag.color}40`
                  }}
                >
                  {tag.name}
                </span>
              )}
              {task.recurringId && (
                <Repeat size={12} className={theme.textMuted} />
              )}
              {hasSubtasks && (
                <span className={`text-xs font-medium ${theme.textMuted}`}>
                  {completedSubtasks}/{task.subtasks.length}
                </span>
              )}
            </div>
            
            {hasSubtasks && expanded && (
              <div className={`mt-3 mr-2 space-y-2 border-r-2 ${darkMode ? 'border-[#2A2A2A]' : 'border-[#E5E5E5]'} pr-3`}>
                {task.subtasks.map(subtask => (
                  <div key={subtask.id} className="flex items-center gap-2">
                    <button
                      onClick={() => toggleSubtask(dateKey, task.id, subtask.id)}
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                        subtask.completed 
                          ? 'bg-[#2563EB] border-[#2563EB]' 
                          : `${darkMode ? 'border-[#404040]' : 'border-[#D1D5DB]'}`
                      }`}
                    >
                      {subtask.completed && <Check size={10} className="text-white" strokeWidth={3} />}
                    </button>
                    <span className={`text-sm ${subtask.completed ? `line-through ${theme.textMuted}` : theme.textSecondary}`}>
                      {subtask.text}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {hasSubtasks && (
              <button
                onClick={() => setExpanded(!expanded)}
                className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-[#252525]' : 'hover:bg-[#F3F4F6]'} ${theme.textSecondary}`}
              >
                {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            )}
            <button
              onClick={() => deleteTask(dateKey, task.id)}
              className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-[#2A1A1A]' : 'hover:bg-red-50'} text-red-500`}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // New Task Modal
  const NewTaskModal = () => {
    const [text, setText] = useState('');
    const [time, setTime] = useState('');
    const [tag, setTag] = useState('');
    const [isRecurring, setIsRecurring] = useState(false);
    const [frequency, setFrequency] = useState('daily');
    const [daysOfWeek, setDaysOfWeek] = useState([]);
    const [dayOfMonth, setDayOfMonth] = useState(1);
    const [subtasks, setSubtasks] = useState([]);
    const [newSubtask, setNewSubtask] = useState('');
    const inputRef = useRef(null);

    useEffect(() => {
      inputRef.current?.focus();
    }, []);

    const toggleDayOfWeek = (day) => {
      setDaysOfWeek(prev => 
        prev.includes(day) 
          ? prev.filter(d => d !== day)
          : [...prev, day]
      );
    };

    const handleSubmit = () => {
      if (!text.trim()) return;
      
      if (isRecurring) {
        if (frequency === 'weekly' && daysOfWeek.length === 0) {
          alert('יש לבחור לפחות יום אחד');
          return;
        }
        addRecurringTask({ text, time, tag, frequency, daysOfWeek, dayOfMonth });
      } else {
        addTask(newTaskDate, { text, time, tag, subtasks });
      }
      setShowNewTask(false);
    };

    const addSubtask = () => {
      if (!newSubtask.trim()) return;
      setSubtasks([...subtasks, { id: Date.now(), text: newSubtask, completed: false }]);
      setNewSubtask('');
    };

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className={`${theme.card} rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border ${theme.border}`}>
          <div className={`p-5 border-b ${theme.border}`}>
            <div className="flex items-center justify-between">
              <h2 className={`text-lg font-semibold ${theme.text}`}>משימה חדשה</h2>
              <button 
                onClick={() => setShowNewTask(false)}
                className={`p-2 rounded-lg ${darkMode ? 'hover:bg-[#252525]' : 'hover:bg-[#F3F4F6]'}`}
              >
                <X size={20} className={theme.textSecondary} />
              </button>
            </div>
          </div>

          <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
            <div>
              <input
                ref={inputRef}
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmit()}
                placeholder="מה צריך לעשות?"
                className={`w-full px-4 py-3 rounded-xl border text-[15px] ${theme.input} focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all`}
                dir="rtl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`text-xs font-medium ${theme.textSecondary} mb-1.5 block`}>שעה</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-xl border text-sm ${theme.input} focus:outline-none focus:ring-2 focus:ring-[#2563EB]`}
                />
              </div>
              <div>
                <label className={`text-xs font-medium ${theme.textSecondary} mb-1.5 block`}>תגית</label>
                <select
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-xl border text-sm ${theme.input} focus:outline-none focus:ring-2 focus:ring-[#2563EB]`}
                >
                  <option value="">ללא</option>
                  {TAGS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            </div>

            {/* Recurring Toggle */}
            <div className={`p-4 rounded-xl ${darkMode ? 'bg-[#1E1E1E]' : 'bg-[#F9FAFB]'}`}>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="w-5 h-5 rounded border-2 border-[#D1D5DB] text-[#2563EB] focus:ring-[#2563EB]"
                />
                <div>
                  <span className={`text-sm font-medium ${theme.text}`}>משימה קבועה</span>
                  <p className={`text-xs ${theme.textMuted}`}>תחזור אוטומטית לפי ההגדרה</p>
                </div>
              </label>

              {isRecurring && (
                <div className="mt-4 space-y-4">
                  <div>
                    <label className={`text-xs font-medium ${theme.textSecondary} mb-1.5 block`}>תדירות</label>
                    <select
                      value={frequency}
                      onChange={(e) => setFrequency(e.target.value)}
                      className={`w-full px-3 py-2.5 rounded-xl border text-sm ${theme.input} focus:outline-none focus:ring-2 focus:ring-[#2563EB]`}
                    >
                      <option value="daily">כל יום</option>
                      <option value="weekly">ימים בשבוע</option>
                      <option value="monthly">כל חודש</option>
                    </select>
                  </div>

                  {frequency === 'weekly' && (
                    <div>
                      <label className={`text-xs font-medium ${theme.textSecondary} mb-2 block`}>בחר ימים</label>
                      <div className="grid grid-cols-7 gap-1">
                        {hebrewDays.map((day, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => toggleDayOfWeek(i)}
                            className={`py-2 px-1 rounded-lg text-xs font-medium transition-all ${
                              daysOfWeek.includes(i)
                                ? 'bg-[#2563EB] text-white'
                                : `${darkMode ? 'bg-[#252525] hover:bg-[#333]' : 'bg-white hover:bg-gray-100'} ${theme.text} border ${theme.border}`
                            }`}
                          >
                            {day.slice(0, 2)}׳
                          </button>
                        ))}
                      </div>
                      {daysOfWeek.length > 0 && (
                        <p className={`text-xs ${theme.textMuted} mt-2`}>
                          נבחרו: {daysOfWeek.sort((a,b) => a-b).map(d => hebrewDays[d]).join(', ')}
                        </p>
                      )}
                    </div>
                  )}

                  {frequency === 'monthly' && (
                    <div>
                      <label className={`text-xs font-medium ${theme.textSecondary} mb-1.5 block`}>בתאריך</label>
                      <select
                        value={dayOfMonth}
                        onChange={(e) => setDayOfMonth(Number(e.target.value))}
                        className={`w-full px-3 py-2.5 rounded-xl border text-sm ${theme.input} focus:outline-none focus:ring-2 focus:ring-[#2563EB]`}
                      >
                        {Array.from({ length: 31 }, (_, i) => (
                          <option key={i + 1} value={i + 1}>{i + 1}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Subtasks - only for non-recurring */}
            {!isRecurring && (
              <div>
                <label className={`text-xs font-medium ${theme.textSecondary} mb-1.5 block`}>תת-משימות</label>
                <div className="space-y-2">
                  {subtasks.map((st, i) => (
                    <div key={st.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${darkMode ? 'bg-[#1E1E1E]' : 'bg-[#F9FAFB]'}`}>
                      <span className={`text-sm flex-1 ${theme.text}`}>{st.text}</span>
                      <button 
                        onClick={() => setSubtasks(subtasks.filter((_, idx) => idx !== i))}
                        className="text-red-500 hover:text-red-600"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSubtask}
                      onChange={(e) => setNewSubtask(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSubtask())}
                      placeholder="הוסף תת-משימה..."
                      className={`flex-1 px-3 py-2 rounded-lg border text-sm ${theme.input} focus:outline-none focus:ring-2 focus:ring-[#2563EB]`}
                      dir="rtl"
                    />
                    <button
                      onClick={addSubtask}
                      className="px-3 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-[#1D4ED8] transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className={`p-4 border-t ${theme.border} flex gap-3`}>
            <button
              onClick={() => setShowNewTask(false)}
              className={`flex-1 py-3 rounded-xl font-medium ${darkMode ? 'bg-[#1E1E1E] hover:bg-[#252525]' : 'bg-[#F3F4F6] hover:bg-[#E5E7EB]'} ${theme.text} transition-colors`}
            >
              ביטול
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl font-medium transition-colors"
            >
              {isRecurring ? 'הוסף משימה קבועה' : 'הוסף משימה'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Recurring Tasks Manager Modal
  const RecurringManagerModal = () => {
    const getFrequencyText = (rt) => {
      if (rt.frequency === 'daily') return 'כל יום';
      if (rt.frequency === 'weekly') {
        const days = rt.daysOfWeek || [];
        if (days.length === 0) return 'שבועי';
        if (days.length === 7) return 'כל יום';
        return days.sort((a,b) => a-b).map(d => hebrewDays[d]).join(', ');
      }
      if (rt.frequency === 'monthly') return `ה-${rt.dayOfMonth} בכל חודש`;
      return '';
    };

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className={`${theme.card} rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border ${theme.border}`}>
          <div className={`p-5 border-b ${theme.border}`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className={`text-lg font-semibold ${theme.text}`}>משימות קבועות</h2>
                <p className={`text-sm ${theme.textMuted} mt-0.5`}>{recurringTasks.length} משימות מוגדרות</p>
              </div>
              <button 
                onClick={() => setShowRecurringManager(false)}
                className={`p-2 rounded-lg ${darkMode ? 'hover:bg-[#252525]' : 'hover:bg-[#F3F4F6]'}`}
              >
                <X size={20} className={theme.textSecondary} />
              </button>
            </div>
          </div>

          <div className="p-4 max-h-[60vh] overflow-y-auto">
            {recurringTasks.length === 0 ? (
              <div className={`text-center py-12 ${theme.textMuted}`}>
                <Repeat size={40} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium">אין משימות קבועות</p>
                <p className="text-sm mt-1">הוסף משימה חדשה וסמן אותה כקבועה</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recurringTasks.map(rt => {
                  const tag = TAGS.find(t => t.id === rt.tag);
                  return (
                    <div 
                      key={rt.id} 
                      className={`p-4 rounded-xl border ${theme.border} ${darkMode ? 'bg-[#1E1E1E]' : 'bg-[#FAFAFA]'}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`font-medium ${theme.text}`}>{rt.text}</span>
                            {tag && (
                              <span 
                                className="text-[11px] px-2 py-0.5 rounded-md font-semibold border"
                                style={{ 
                                  backgroundColor: `${tag.color}20`, 
                                  color: tag.color,
                                  borderColor: `${tag.color}40`
                                }}
                              >
                                {tag.name}
                              </span>
                            )}
                          </div>
                          <div className={`flex items-center gap-3 mt-2 text-sm ${theme.textSecondary}`}>
                            <span className="flex items-center gap-1">
                              <Repeat size={12} />
                              {getFrequencyText(rt)}
                            </span>
                            {rt.time && (
                              <span className="flex items-center gap-1">
                                <Clock size={12} />
                                {rt.time}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => deleteRecurringTask(rt.id)}
                          className={`p-2 rounded-lg ${darkMode ? 'hover:bg-[#2A1A1A]' : 'hover:bg-red-50'} text-red-500`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className={`p-4 border-t ${theme.border}`}>
            <button
              onClick={() => { setShowRecurringManager(false); setShowNewTask(true); }}
              className="w-full py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              הוסף משימה קבועה
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Search Modal
  const SearchModal = () => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 pt-[12vh]">
      <div className={`${theme.card} rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border ${theme.border}`}>
        <div className={`p-4 border-b ${theme.border}`}>
          <div className="flex items-center gap-3">
            <Search size={20} className={theme.textMuted} />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="חיפוש משימות..."
              className={`flex-1 bg-transparent text-lg ${theme.text} placeholder-[#9CA3AF] focus:outline-none`}
              dir="rtl"
            />
            <button onClick={() => { setShowSearch(false); setSearchQuery(''); }}>
              <X size={20} className={theme.textSecondary} />
            </button>
          </div>
        </div>
        
        {searchResults.length > 0 && (
          <div className="max-h-[50vh] overflow-y-auto p-2">
            {searchResults.map(task => (
              <div 
                key={`${task.dateKey}-${task.id}`}
                className={`p-3 rounded-xl ${theme.cardHover} cursor-pointer`}
                onClick={() => { 
                  setCurrentDate(new Date(task.dateKey)); 
                  setView('day'); 
                  setShowSearch(false); 
                  setSearchQuery(''); 
                }}
              >
                <div className={`text-sm ${theme.text}`}>{task.text}</div>
                <div className={`text-xs ${theme.textMuted} mt-1`}>
                  {new Date(task.dateKey).toLocaleDateString('he-IL')}
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className={`p-3 border-t ${theme.border}`}>
          <div className={`text-xs ${theme.textMuted} text-center`}>
            ESC לסגירה
          </div>
        </div>
      </div>
    </div>
  );

  // Hover Preview
  const HoverPreview = () => {
    if (!hoveredDay) return null;
    const stats = getDayStats(hoveredDay);
    
    return (
      <div 
        className={`fixed z-50 ${theme.card} rounded-xl shadow-xl border ${theme.border} p-4 w-72`}
        style={{ 
          top: Math.min(hoverPosition.y + 10, window.innerHeight - 200), 
          left: Math.max(10, Math.min(hoverPosition.x - 144, window.innerWidth - 300)),
          pointerEvents: 'none'
        }}
      >
        <div className={`text-sm font-semibold ${theme.text} mb-3`}>
          {stats.total} משימות | {stats.percentage}% הושלם
        </div>
        <div className="space-y-2">
          {stats.tasks.slice(0, 5).map(task => (
            <div key={task.id} className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${task.completed ? 'bg-[#2563EB]' : darkMode ? 'bg-[#404040]' : 'bg-[#D1D5DB]'}`} />
              <span className={`text-sm truncate ${task.completed ? theme.textMuted : theme.textSecondary}`}>
                {task.time && <span className="font-mono">{task.time}</span>} {task.text}
              </span>
            </div>
          ))}
          {stats.tasks.length > 5 && (
            <div className={`text-xs ${theme.textMuted}`}>+{stats.tasks.length - 5} נוספות</div>
          )}
        </div>
      </div>
    );
  };

  // Day View with Hours
  const DayView = () => {
    const dateKey = formatDateKey(currentDate);
    const dayTasks = tasks[dateKey] || [];
    const stats = getDayStats(dateKey);
    const isToday = dateKey === today;

    const tasksByHour = HOURS.reduce((acc, hour) => {
      acc[hour] = dayTasks.filter(t => {
        if (!t.time) return false;
        const taskHour = parseInt(t.time.split(':')[0]);
        return taskHour === hour;
      });
      return acc;
    }, {});

    const unscheduledTasks = dayTasks.filter(t => !t.time);

    return (
      <div className={`${theme.card} rounded-2xl shadow-sm overflow-hidden border ${theme.border}`}>
        <div className={`p-5 border-b ${theme.border}`}>
          <div className="flex items-center justify-between">
            <div>
              <div className={`text-xl font-semibold ${theme.text}`}>
                {hebrewDays[currentDate.getDay()]}
              </div>
              <div className={`text-sm ${theme.textSecondary} mt-0.5`}>
                {currentDate.getDate()} {hebrewMonths[currentDate.getMonth()]} {currentDate.getFullYear()}
              </div>
            </div>
            {isToday && (
              <span className="px-3 py-1.5 bg-[#2563EB] text-white text-xs font-semibold rounded-lg">
                היום
              </span>
            )}
          </div>
          
          {/* Tag summary for the day */}
          {stats.total > 0 && (
            <div className="mt-4 flex items-center gap-4">
              {stats.tagCounts.work > 0 && (
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: '#2563EB' }} />
                  <span className={`text-xs ${theme.textSecondary}`}>{stats.tagCounts.work} עבודה</span>
                </div>
              )}
              {stats.tagCounts.personal > 0 && (
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: '#64748B' }} />
                  <span className={`text-xs ${theme.textSecondary}`}>{stats.tagCounts.personal} אישי</span>
                </div>
              )}
              {stats.tagCounts.urgent > 0 && (
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: '#B91C1C' }} />
                  <span className={`text-xs ${theme.textSecondary}`}>{stats.tagCounts.urgent} דחוף</span>
                </div>
              )}
              {stats.tagCounts.none > 0 && (
                <div className="flex items-center gap-1.5">
                  <div className={`w-2.5 h-2.5 rounded-sm ${darkMode ? 'bg-[#404040]' : 'bg-[#D1D5DB]'}`} />
                  <span className={`text-xs ${theme.textSecondary}`}>{stats.tagCounts.none} ללא תגית</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className={`divide-y ${darkMode ? 'divide-[#1E1E1E]' : 'divide-[#F3F4F6]'}`}>
          {HOURS.map(hour => (
            <div key={hour} className="flex min-h-[56px]">
              <div className={`w-20 py-3 px-4 text-sm font-mono ${theme.textMuted} border-l ${theme.border} flex-shrink-0`}>
                {String(hour).padStart(2, '0')}:00
              </div>
              <div className="flex-1 py-1 px-3">
                {tasksByHour[hour]?.map(task => (
                  <TaskItem key={task.id} task={task} dateKey={dateKey} compact />
                ))}
              </div>
            </div>
          ))}
        </div>

        {unscheduledTasks.length > 0 && (
          <div className={`p-5 border-t ${theme.border}`}>
            <div className={`text-sm font-medium ${theme.textSecondary} mb-3`}>ללא שעה מוגדרת</div>
            <div className="space-y-1">
              {unscheduledTasks.map(task => (
                <TaskItem key={task.id} task={task} dateKey={dateKey} />
              ))}
            </div>
          </div>
        )}

        <div className={`p-4 border-t ${theme.border}`}>
          <button
            onClick={() => { setNewTaskDate(dateKey); setShowNewTask(true); }}
            className={`w-full py-3 rounded-xl border-2 border-dashed ${theme.border} ${theme.textSecondary} hover:border-[#2563EB] hover:text-[#2563EB] transition-all flex items-center justify-center gap-2 font-medium`}
          >
            <Plus size={18} />
            הוסף משימה
          </button>
        </div>
      </div>
    );
  };

  // Week View
  const WeekView = () => (
    <div className="grid grid-cols-7 gap-4">
      {weekDates.map((date, i) => {
        const dateKey = formatDateKey(date);
        const dayTasks = tasks[dateKey] || [];
        const stats = getDayStats(dateKey);
        const isToday = dateKey === today;
        
        // Calculate tag distribution bar
        const totalTasks = stats.total || 1;
        const workPercent = (stats.tagCounts.work / totalTasks) * 100;
        const personalPercent = (stats.tagCounts.personal / totalTasks) * 100;
        const urgentPercent = (stats.tagCounts.urgent / totalTasks) * 100;

        return (
          <div 
            key={i} 
            className={`${theme.card} rounded-2xl shadow-sm overflow-hidden border ${theme.border} ${isToday ? 'ring-2 ring-[#2563EB]' : ''}`}
          >
            <div 
              className={`p-4 text-center cursor-pointer transition-colors ${isToday ? 'bg-[#2563EB]' : darkMode ? 'hover:bg-[#1E1E1E]' : 'hover:bg-[#FAFAFA]'}`}
              onClick={() => { setCurrentDate(date); setView('day'); }}
            >
              <div className={`text-sm font-medium ${isToday ? 'text-blue-100' : theme.textSecondary}`}>
                {hebrewDays[date.getDay()]}
              </div>
              <div className={`text-2xl font-bold mt-1 ${isToday ? 'text-white' : theme.text}`}>
                {date.getDate()}
              </div>
              {stats.total > 0 && (
                <>
                  <div className={`text-xs mt-2 font-medium ${isToday ? 'text-blue-100' : theme.textMuted}`}>
                    {stats.completed}/{stats.total}
                  </div>
                  {/* Tag distribution bar */}
                  <div className="flex h-1.5 mt-2 rounded-full overflow-hidden">
                    {workPercent > 0 && (
                      <div style={{ width: `${workPercent}%`, backgroundColor: '#2563EB' }} />
                    )}
                    {personalPercent > 0 && (
                      <div style={{ width: `${personalPercent}%`, backgroundColor: '#64748B' }} />
                    )}
                    {urgentPercent > 0 && (
                      <div style={{ width: `${urgentPercent}%`, backgroundColor: '#B91C1C' }} />
                    )}
                    {stats.tagCounts.none > 0 && (
                      <div style={{ width: `${(stats.tagCounts.none / totalTasks) * 100}%`, backgroundColor: isToday ? 'rgba(255,255,255,0.3)' : darkMode ? '#333' : '#E5E5E5' }} />
                    )}
                  </div>
                </>
              )}
            </div>

            <div className={`p-3 min-h-[180px] max-h-[280px] overflow-y-auto border-t ${theme.border}`}>
              {dayTasks.length === 0 ? (
                <div className={`text-center py-8 ${theme.textMuted} text-sm`}>
                  אין משימות
                </div>
              ) : (
                dayTasks.map(task => (
                  <TaskItem key={task.id} task={task} dateKey={dateKey} compact />
                ))
              )}
            </div>

            <div className={`p-2 border-t ${theme.border}`}>
              <button
                onClick={() => { setNewTaskDate(dateKey); setShowNewTask(true); }}
                className={`w-full py-2 rounded-lg ${theme.cardHover} ${theme.textMuted} text-sm flex items-center justify-center gap-1 transition-colors`}
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );

  // Month View
  const MonthView = () => {
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const startPadding = firstDayOfMonth.getDay();

    return (
      <div className={`${theme.card} rounded-2xl shadow-sm p-5 border ${theme.border}`}>
        {/* Legend */}
        <div className="flex items-center justify-end gap-4 mb-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#2563EB' }} />
            <span className={theme.textSecondary}>עבודה</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#64748B' }} />
            <span className={theme.textSecondary}>אישי</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#B91C1C' }} />
            <span className={theme.textSecondary}>דחוף</span>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-1 mb-3">
          {hebrewDays.map(day => (
            <div key={day} className={`text-center text-sm font-semibold py-2 ${theme.textSecondary}`}>
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {Array(startPadding).fill(null).map((_, i) => (
            <div key={`pad-${i}`} className="aspect-square" />
          ))}
          {monthDates.map(date => {
            const dateKey = formatDateKey(date);
            const stats = getDayStats(dateKey);
            const isToday = dateKey === today;
            
            // Calculate tag distribution
            const totalTasks = stats.total || 1;
            const workPercent = (stats.tagCounts.work / totalTasks) * 100;
            const personalPercent = (stats.tagCounts.personal / totalTasks) * 100;
            const urgentPercent = (stats.tagCounts.urgent / totalTasks) * 100;

            return (
              <div
                key={dateKey}
                className={`aspect-square p-2 rounded-xl cursor-pointer transition-all ${
                  isToday 
                    ? 'bg-[#2563EB] text-white' 
                    : `${theme.cardHover}`
                }`}
                onMouseEnter={(e) => {
                  if (stats.total > 0) {
                    setHoveredDay(dateKey);
                    setHoverPosition({ x: e.clientX, y: e.clientY });
                  }
                }}
                onMouseLeave={() => setHoveredDay(null)}
                onClick={() => { setCurrentDate(date); setView('day'); }}
              >
                <div className={`text-sm font-semibold ${isToday ? '' : theme.text}`}>
                  {date.getDate()}
                </div>
                {stats.total > 0 && (
                  <div className="mt-1">
                    {/* Tag distribution bar */}
                    <div className="flex h-1.5 rounded-full overflow-hidden">
                      {workPercent > 0 && (
                        <div style={{ width: `${workPercent}%`, backgroundColor: isToday ? 'rgba(255,255,255,0.8)' : '#2563EB' }} />
                      )}
                      {personalPercent > 0 && (
                        <div style={{ width: `${personalPercent}%`, backgroundColor: isToday ? 'rgba(255,255,255,0.5)' : '#64748B' }} />
                      )}
                      {urgentPercent > 0 && (
                        <div style={{ width: `${urgentPercent}%`, backgroundColor: isToday ? 'rgba(255,200,200,0.8)' : '#B91C1C' }} />
                      )}
                      {stats.tagCounts.none > 0 && (
                        <div style={{ width: `${(stats.tagCounts.none / totalTasks) * 100}%`, backgroundColor: isToday ? 'rgba(255,255,255,0.3)' : darkMode ? '#333' : '#E5E5E5' }} />
                      )}
                    </div>
                    <div className={`text-[10px] mt-1 ${isToday ? 'text-blue-100' : theme.textMuted}`}>
                      {stats.completed}/{stats.total}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen ${theme.bg} transition-colors duration-300`} dir="rtl">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        
        {/* Header */}
        <header className={`${theme.card} rounded-2xl shadow-sm p-6 border ${theme.border}`}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-2xl font-bold ${theme.text}`}>{greeting}</h1>
              <p className={`mt-1 ${theme.textSecondary}`}>
                יום {hebrewDays[new Date().getDay()]}, {new Date().getDate()} {hebrewMonths[new Date().getMonth()]} {new Date().getFullYear()}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowRecurringManager(true)}
                className={`p-2.5 rounded-xl ${darkMode ? 'hover:bg-[#1E1E1E]' : 'hover:bg-[#F3F4F6]'} ${theme.textSecondary} transition-colors`}
                title="משימות קבועות (Ctrl+R)"
              >
                <Repeat size={20} />
              </button>
              <button
                onClick={() => setShowSearch(true)}
                className={`p-2.5 rounded-xl ${darkMode ? 'hover:bg-[#1E1E1E]' : 'hover:bg-[#F3F4F6]'} ${theme.textSecondary} transition-colors`}
                title="חיפוש (/)"
              >
                <Search size={20} />
              </button>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2.5 rounded-xl ${darkMode ? 'hover:bg-[#1E1E1E]' : 'hover:bg-[#F3F4F6]'} ${theme.textSecondary} transition-colors`}
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
          </div>

          {/* Stats Bar with Pie Charts */}
          <div className={`mt-5 pt-5 border-t ${theme.border} flex items-center justify-between`}>
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <PieChart percentage={todayStats.percentage} size={48} strokeWidth={4} darkMode={darkMode} />
                <div>
                  <div className={`text-xs font-medium ${theme.textMuted}`}>היום</div>
                  <div className={`text-sm font-bold ${theme.text}`}>{todayStats.completed}/{todayStats.total}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <PieChart percentage={weekStats.percentage} size={48} strokeWidth={4} darkMode={darkMode} />
                <div>
                  <div className={`text-xs font-medium ${theme.textMuted}`}>השבוע</div>
                  <div className={`text-sm font-bold ${theme.text}`}>{weekStats.completed}/{weekStats.total}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <PieChart percentage={monthStats.percentage} size={48} strokeWidth={4} darkMode={darkMode} />
                <div>
                  <div className={`text-xs font-medium ${theme.textMuted}`}>החודש</div>
                  <div className={`text-sm font-bold ${theme.text}`}>{monthStats.completed}/{monthStats.total}</div>
                </div>
              </div>
            </div>
            <div className={`text-sm ${theme.textSecondary}`}>
              סטריק: <span className={`font-bold ${theme.text}`}>{streak} ימים</span>
            </div>
          </div>

          {/* Navigation */}
          <div className={`mt-5 pt-5 border-t ${theme.border} flex items-center justify-between`}>
            <div className={`flex p-1 rounded-xl ${darkMode ? 'bg-[#1E1E1E]' : 'bg-[#F3F4F6]'}`}>
              {[
                { id: 'day', label: 'יום', key: '1' },
                { id: 'week', label: 'שבוע', key: '2' },
                { id: 'month', label: 'חודש', key: '3' },
              ].map(v => (
                <button
                  key={v.id}
                  onClick={() => setView(v.id)}
                  className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    view === v.id 
                      ? `${theme.card} shadow-sm text-[#2563EB]` 
                      : theme.textSecondary
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate(-1)}
                className={`p-2.5 rounded-lg ${darkMode ? 'hover:bg-[#1E1E1E]' : 'hover:bg-[#F3F4F6]'} ${theme.textSecondary} transition-colors`}
              >
                <ChevronRight size={20} />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-4 py-2.5 text-sm font-semibold text-[#2563EB] hover:bg-[#2563EB]/10 rounded-lg transition-colors"
              >
                היום
              </button>
              <button
                onClick={() => navigate(1)}
                className={`p-2.5 rounded-lg ${darkMode ? 'hover:bg-[#1E1E1E]' : 'hover:bg-[#F3F4F6]'} ${theme.textSecondary} transition-colors`}
              >
                <ChevronLeft size={20} />
              </button>
            </div>
          </div>
        </header>

        {/* Next Task Card */}
        {nextTask && view !== 'day' && (
          <div className={`${theme.card} rounded-2xl shadow-sm p-5 border-r-4 border-[#2563EB] border ${theme.border}`}>
            <div className={`text-xs font-semibold uppercase tracking-wide ${theme.textMuted} mb-2`}>המשימה הבאה</div>
            <div className="flex items-center gap-3">
              {nextTask.time && (
                <span className={`text-lg font-mono font-bold ${theme.text}`}>{nextTask.time}</span>
              )}
              <span className={`text-lg ${theme.text}`}>{nextTask.text}</span>
            </div>
          </div>
        )}

        {/* Main Content */}
        {view === 'day' && <DayView />}
        {view === 'week' && <WeekView />}
        {view === 'month' && <MonthView />}

        {/* Keyboard Shortcuts Hint */}
        <div className={`text-center text-xs ${theme.textMuted}`}>
          N משימה חדשה | T היום | 1/2/3 תצוגה | / חיפוש | Ctrl+R משימות קבועות
        </div>

        {/* Modals */}
        {showNewTask && <NewTaskModal />}
        {showSearch && <SearchModal />}
        {showRecurringManager && <RecurringManagerModal />}
        <HoverPreview />
      </div>
    </div>
  );
}
