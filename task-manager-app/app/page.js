'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Check, Trash2, ChevronLeft, ChevronRight, X, Moon, Sun, Search, ChevronDown, ChevronUp, Repeat, Calendar, Clock } from 'lucide-react';

// Constants
const hebrewDays = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const hebrewMonths = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];

const HOURS = Array.from({ length: 16 }, (_, i) => i + 6); // 06:00 - 21:00

const TAGS = [
  { id: 'rosayo', name: 'ROSAYO', color: '#3B82F6' },
  { id: 'personal', name: 'אישי', color: '#6B7280' },
  { id: 'urgent', name: 'דחוף', color: '#EF4444' },
];

const RECURRING_OPTIONS = [
  { id: 'none', name: 'ללא' },
  { id: 'daily', name: 'כל יום' },
  { id: 'weekly', name: 'כל שבוע' },
  { id: 'monthly', name: 'כל חודש' },
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
  if (hour >= 5 && hour < 12) return { text: 'בוקר טוב, שקד', emoji: '☀️' };
  if (hour >= 12 && hour < 17) return { text: 'צהריים טובים, שקד', emoji: '🌤️' };
  if (hour >= 17 && hour < 21) return { text: 'ערב טוב, שקד', emoji: '🌅' };
  return { text: 'לילה טוב, שקד', emoji: '🌙' };
};

export default function TaskManager() {
  // State
  const [darkMode, setDarkMode] = useState(false);
  const [tasks, setTasks] = useState({});
  const [backlog, setBacklog] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('week');
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredDay, setHoveredDay] = useState(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTaskDate, setNewTaskDate] = useState(null);
  const [streak, setStreak] = useState(0);
  const [completedDays, setCompletedDays] = useState([]);
  
  const searchInputRef = useRef(null);
  const greeting = getGreeting();
  const today = formatDateKey(new Date());

  // Theme
  const theme = {
    bg: darkMode ? 'bg-[#121212]' : 'bg-[#F5F5F5]',
    card: darkMode ? 'bg-[#1E1E1E]' : 'bg-white',
    cardHover: darkMode ? 'hover:bg-[#252525]' : 'hover:bg-[#FAFAFA]',
    border: darkMode ? 'border-[#2A2A2A]' : 'border-[#E5E5E5]',
    text: darkMode ? 'text-[#F5F5F5]' : 'text-[#1A1A1A]',
    textSecondary: darkMode ? 'text-[#888888]' : 'text-[#6B6B6B]',
    textMuted: darkMode ? 'text-[#555555]' : 'text-[#9CA3AF]',
    accent: '#2563EB',
    accentHover: '#1D4ED8',
    success: '#059669',
    input: darkMode 
      ? 'bg-[#252525] border-[#333333] text-[#F5F5F5] placeholder-[#666666]' 
      : 'bg-white border-[#E5E5E5] text-[#1A1A1A] placeholder-[#9CA3AF]',
  };

  // Load/Save localStorage
  useEffect(() => {
    const saved = localStorage.getItem('taskManagerData');
    if (saved) {
      const data = JSON.parse(saved);
      setDarkMode(data.darkMode ?? false);
      setTasks(data.tasks ?? {});
      setBacklog(data.backlog ?? []);
      setStreak(data.streak ?? 0);
      setCompletedDays(data.completedDays ?? []);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('taskManagerData', JSON.stringify({
      darkMode, tasks, backlog, streak, completedDays
    }));
  }, [darkMode, tasks, backlog, streak, completedDays]);

  // Handle recurring tasks
  useEffect(() => {
    const todayKey = formatDateKey(new Date());
    const processedKey = `recurring_processed_${todayKey}`;
    
    if (localStorage.getItem(processedKey)) return;
    
    Object.entries(tasks).forEach(([dateKey, dayTasks]) => {
      dayTasks.forEach(task => {
        if (!task.recurring || task.recurring === 'none') return;
        
        const taskDate = new Date(dateKey);
        const newDate = new Date(taskDate);
        
        if (task.recurring === 'daily') newDate.setDate(newDate.getDate() + 1);
        else if (task.recurring === 'weekly') newDate.setDate(newDate.getDate() + 7);
        else if (task.recurring === 'monthly') newDate.setMonth(newDate.getMonth() + 1);
        
        const newDateKey = formatDateKey(newDate);
        if (newDateKey === todayKey) {
          const exists = tasks[newDateKey]?.some(t => t.text === task.text && t.recurring === task.recurring);
          if (!exists) {
            setTasks(prev => ({
              ...prev,
              [newDateKey]: [...(prev[newDateKey] || []), {
                ...task,
                id: Date.now() + Math.random(),
                completed: false,
                subtasks: task.subtasks?.map(st => ({ ...st, completed: false })) || []
              }]
            }));
          }
        }
      });
    });
    
    localStorage.setItem(processedKey, 'true');
  }, [tasks]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      switch(e.key) {
        case 'n': case 'N': case 'מ':
          e.preventDefault();
          setNewTaskDate(formatDateKey(new Date()));
          setShowNewTask(true);
          break;
        case 't': case 'T': case 'א':
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
        case 'ArrowLeft':
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            navigate(1);
          }
          break;
        case 'ArrowRight':
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
        case 'Escape':
          setShowSearch(false);
          setShowNewTask(false);
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
      recurring: taskData.recurring || 'none',
      subtasks: taskData.subtasks || [],
    };
    setTasks(prev => ({
      ...prev,
      [dateKey]: [...(prev[dateKey] || []), newTask]
    }));
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
    dayTasks.forEach(task => {
      if (task.subtasks?.length > 0) {
        total += task.subtasks.length;
        completed += task.subtasks.filter(st => st.completed).length;
      } else {
        total += 1;
        completed += task.completed ? 1 : 0;
      }
    });
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percentage, tasks: dayTasks };
  };

  const getWeekStats = () => {
    const weekDates = getWeekDates(currentDate);
    let total = 0, completed = 0;
    weekDates.forEach(date => {
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

  // Get next task for "Now" view
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
  const nextTask = getNextTask();

  // Components
  const TaskItem = ({ task, dateKey, compact = false }) => {
    const [expanded, setExpanded] = useState(false);
    const hasSubtasks = task.subtasks?.length > 0;
    const completedSubtasks = task.subtasks?.filter(st => st.completed).length || 0;
    const tag = TAGS.find(t => t.id === task.tag);

    return (
      <div className={`group ${compact ? 'py-1.5' : 'py-2'}`}>
        <div className="flex items-start gap-3">
          <button
            onClick={() => !hasSubtasks && toggleTask(dateKey, task.id)}
            className={`flex-shrink-0 w-5 h-5 mt-0.5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
              task.completed || (hasSubtasks && completedSubtasks === task.subtasks.length)
                ? 'bg-[#059669] border-[#059669]' 
                : `${darkMode ? 'border-[#444]' : 'border-[#D1D5DB]'} hover:border-[#2563EB]`
            }`}
          >
            {(task.completed || (hasSubtasks && completedSubtasks === task.subtasks.length)) && (
              <Check size={12} className="text-white" strokeWidth={3} />
            )}
          </button>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {task.time && (
                <span className={`text-xs font-medium ${theme.textMuted}`}>
                  {task.time}
                </span>
              )}
              <span className={`${compact ? 'text-sm' : 'text-[15px]'} ${
                task.completed ? `line-through ${theme.textMuted}` : theme.text
              }`}>
                {task.text}
              </span>
              {tag && (
                <span 
                  className="text-xs px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                >
                  {tag.name}
                </span>
              )}
              {task.recurring && task.recurring !== 'none' && (
                <Repeat size={12} className={theme.textMuted} />
              )}
              {hasSubtasks && (
                <span className={`text-xs ${theme.textMuted}`}>
                  [{completedSubtasks}/{task.subtasks.length}]
                </span>
              )}
            </div>
            
            {hasSubtasks && expanded && (
              <div className="mt-2 mr-2 space-y-1.5 border-r-2 border-[#E5E5E5] dark:border-[#333] pr-3">
                {task.subtasks.map(subtask => (
                  <div key={subtask.id} className="flex items-center gap-2">
                    <button
                      onClick={() => toggleSubtask(dateKey, task.id, subtask.id)}
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                        subtask.completed 
                          ? 'bg-[#059669] border-[#059669]' 
                          : `${darkMode ? 'border-[#444]' : 'border-[#D1D5DB]'}`
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
                className={`p-1 rounded ${darkMode ? 'hover:bg-[#333]' : 'hover:bg-[#F3F4F6]'}`}
              >
                {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            )}
            <button
              onClick={() => deleteTask(dateKey, task.id)}
              className={`p-1 rounded text-red-400 ${darkMode ? 'hover:bg-red-900/20' : 'hover:bg-red-50'}`}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const NewTaskModal = () => {
    const [text, setText] = useState('');
    const [time, setTime] = useState('');
    const [tag, setTag] = useState('');
    const [recurring, setRecurring] = useState('none');
    const [subtasks, setSubtasks] = useState([]);
    const [newSubtask, setNewSubtask] = useState('');
    const inputRef = useRef(null);

    useEffect(() => {
      inputRef.current?.focus();
    }, []);

    const handleSubmit = () => {
      if (!text.trim()) return;
      addTask(newTaskDate, { text, time, tag, recurring, subtasks });
      setShowNewTask(false);
    };

    const addSubtask = () => {
      if (!newSubtask.trim()) return;
      setSubtasks([...subtasks, { id: Date.now(), text: newSubtask, completed: false }]);
      setNewSubtask('');
    };

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className={`${theme.card} rounded-2xl shadow-2xl w-full max-w-md overflow-hidden`}>
          <div className={`p-5 border-b ${theme.border}`}>
            <div className="flex items-center justify-between">
              <h2 className={`text-lg font-semibold ${theme.text}`}>משימה חדשה</h2>
              <button 
                onClick={() => setShowNewTask(false)}
                className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-[#333]' : 'hover:bg-[#F3F4F6]'}`}
              >
                <X size={20} className={theme.textSecondary} />
              </button>
            </div>
          </div>

          <div className="p-5 space-y-4">
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmit()}
              placeholder="מה צריך לעשות?"
              className={`w-full px-4 py-3 rounded-xl border text-[15px] ${theme.input} focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent`}
              dir="rtl"
            />

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

            <div>
              <label className={`text-xs font-medium ${theme.textSecondary} mb-1.5 block`}>חזרה</label>
              <select
                value={recurring}
                onChange={(e) => setRecurring(e.target.value)}
                className={`w-full px-3 py-2.5 rounded-xl border text-sm ${theme.input} focus:outline-none focus:ring-2 focus:ring-[#2563EB]`}
              >
                {RECURRING_OPTIONS.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
              </select>
            </div>

            <div>
              <label className={`text-xs font-medium ${theme.textSecondary} mb-1.5 block`}>תת-משימות</label>
              <div className="space-y-2">
                {subtasks.map((st, i) => (
                  <div key={st.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${darkMode ? 'bg-[#252525]' : 'bg-[#F9FAFB]'}`}>
                    <span className={`text-sm ${theme.text}`}>{st.text}</span>
                    <button 
                      onClick={() => setSubtasks(subtasks.filter((_, idx) => idx !== i))}
                      className="mr-auto text-red-400"
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
                    onKeyPress={(e) => e.key === 'Enter' && addSubtask()}
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
          </div>

          <div className={`p-4 border-t ${theme.border} flex gap-3`}>
            <button
              onClick={() => setShowNewTask(false)}
              className={`flex-1 py-3 rounded-xl font-medium ${darkMode ? 'bg-[#252525] hover:bg-[#333]' : 'bg-[#F3F4F6] hover:bg-[#E5E7EB]'} ${theme.text} transition-colors`}
            >
              ביטול
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl font-medium transition-colors"
            >
              הוסף משימה
            </button>
          </div>
        </div>
      </div>
    );
  };

  const SearchModal = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 pt-[15vh]">
      <div className={`${theme.card} rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden`}>
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
            ESC לסגירה · Enter לבחירה
          </div>
        </div>
      </div>
    </div>
  );

  const HoverPreview = () => {
    if (!hoveredDay) return null;
    const stats = getDayStats(hoveredDay);
    
    return (
      <div 
        className={`fixed z-50 ${theme.card} rounded-xl shadow-xl border ${theme.border} p-3 w-64`}
        style={{ 
          top: hoverPosition.y + 10, 
          left: hoverPosition.x - 128,
          pointerEvents: 'none'
        }}
      >
        <div className={`text-sm font-medium ${theme.text} mb-2`}>
          {stats.total} משימות · {stats.percentage}% הושלם
        </div>
        <div className="space-y-1">
          {stats.tasks.slice(0, 4).map(task => (
            <div key={task.id} className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${task.completed ? 'bg-[#059669]' : 'bg-[#D1D5DB]'}`} />
              <span className={`text-xs truncate ${task.completed ? theme.textMuted : theme.textSecondary}`}>
                {task.time && `${task.time} · `}{task.text}
              </span>
            </div>
          ))}
          {stats.tasks.length > 4 && (
            <div className={`text-xs ${theme.textMuted}`}>+{stats.tasks.length - 4} עוד</div>
          )}
        </div>
      </div>
    );
  };

  // Day View with Hours
  const DayView = () => {
    const dateKey = formatDateKey(currentDate);
    const dayTasks = tasks[dateKey] || [];
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
      <div className={`${theme.card} rounded-2xl shadow-sm overflow-hidden`}>
        <div className={`p-4 border-b ${theme.border} flex items-center justify-between`}>
          <div>
            <div className={`text-lg font-semibold ${theme.text}`}>
              {hebrewDays[currentDate.getDay()]}
            </div>
            <div className={`text-sm ${theme.textSecondary}`}>
              {currentDate.getDate()} {hebrewMonths[currentDate.getMonth()]}
            </div>
          </div>
          {isToday && (
            <span className="px-3 py-1 bg-[#2563EB] text-white text-xs font-medium rounded-full">
              היום
            </span>
          )}
        </div>

        <div className="divide-y divide-[#E5E5E5] dark:divide-[#2A2A2A]">
          {HOURS.map(hour => (
            <div key={hour} className="flex min-h-[60px]">
              <div className={`w-16 p-2 text-left text-sm ${theme.textMuted} border-l ${theme.border}`}>
                {String(hour).padStart(2, '0')}:00
              </div>
              <div className="flex-1 p-2">
                {tasksByHour[hour]?.map(task => (
                  <TaskItem key={task.id} task={task} dateKey={dateKey} compact />
                ))}
              </div>
            </div>
          ))}
        </div>

        {unscheduledTasks.length > 0 && (
          <div className={`p-4 border-t ${theme.border}`}>
            <div className={`text-sm font-medium ${theme.textSecondary} mb-2`}>ללא שעה</div>
            {unscheduledTasks.map(task => (
              <TaskItem key={task.id} task={task} dateKey={dateKey} />
            ))}
          </div>
        )}

        <div className={`p-4 border-t ${theme.border}`}>
          <button
            onClick={() => { setNewTaskDate(dateKey); setShowNewTask(true); }}
            className={`w-full py-3 rounded-xl border-2 border-dashed ${theme.border} ${theme.textSecondary} hover:border-[#2563EB] hover:text-[#2563EB] transition-colors flex items-center justify-center gap-2`}
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
    <div className="grid grid-cols-7 gap-3">
      {weekDates.map((date, i) => {
        const dateKey = formatDateKey(date);
        const dayTasks = tasks[dateKey] || [];
        const stats = getDayStats(dateKey);
        const isToday = dateKey === today;

        return (
          <div 
            key={i} 
            className={`${theme.card} rounded-2xl shadow-sm overflow-hidden ${isToday ? 'ring-2 ring-[#2563EB]' : ''}`}
          >
            <div className={`p-3 text-center ${isToday ? 'bg-[#2563EB] text-white' : ''}`}>
              <div className={`text-sm ${isToday ? 'text-blue-100' : theme.textSecondary}`}>
                {hebrewDays[date.getDay()]}
              </div>
              <div className={`text-xl font-semibold ${isToday ? 'text-white' : theme.text}`}>
                {date.getDate()}
              </div>
              <div className={`text-xs mt-1 ${isToday ? 'text-blue-100' : theme.textMuted}`}>
                {stats.completed}/{stats.total}
              </div>
            </div>

            <div className="p-2 min-h-[200px] max-h-[300px] overflow-y-auto">
              {dayTasks.map(task => (
                <TaskItem key={task.id} task={task} dateKey={dateKey} compact />
              ))}
            </div>

            <div className={`p-2 border-t ${theme.border}`}>
              <button
                onClick={() => { setNewTaskDate(dateKey); setShowNewTask(true); }}
                className={`w-full py-2 rounded-lg ${theme.cardHover} ${theme.textMuted} text-sm flex items-center justify-center gap-1`}
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
      <div className={`${theme.card} rounded-2xl shadow-sm p-4`}>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {hebrewDays.map(day => (
            <div key={day} className={`text-center text-sm font-medium py-2 ${theme.textSecondary}`}>
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

            return (
              <div
                key={dateKey}
                className={`aspect-square p-1.5 rounded-xl cursor-pointer transition-all ${
                  isToday 
                    ? 'bg-[#2563EB] text-white' 
                    : `${theme.cardHover} ${stats.total > 0 ? '' : ''}`
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
                <div className={`text-sm font-medium ${isToday ? '' : theme.text}`}>
                  {date.getDate()}
                </div>
                {stats.total > 0 && (
                  <div className="mt-1">
                    <div 
                      className={`h-1 rounded-full ${isToday ? 'bg-white/30' : darkMode ? 'bg-[#333]' : 'bg-[#E5E5E5]'}`}
                    >
                      <div 
                        className={`h-1 rounded-full ${isToday ? 'bg-white' : 'bg-[#2563EB]'}`}
                        style={{ width: `${stats.percentage}%` }}
                      />
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
        <header className={`${theme.card} rounded-2xl shadow-sm p-6`}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-2xl font-bold ${theme.text} flex items-center gap-2`}>
                <span>{greeting.emoji}</span>
                <span>{greeting.text}</span>
              </h1>
              <p className={`mt-1 ${theme.textSecondary}`}>
                יום {hebrewDays[new Date().getDay()]}, {new Date().getDate()} ב{hebrewMonths[new Date().getMonth()]} {new Date().getFullYear()}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSearch(true)}
                className={`p-2.5 rounded-xl ${darkMode ? 'hover:bg-[#252525]' : 'hover:bg-[#F3F4F6]'} ${theme.textSecondary} transition-colors`}
                title="חיפוש (/)"
              >
                <Search size={20} />
              </button>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2.5 rounded-xl ${darkMode ? 'hover:bg-[#252525]' : 'hover:bg-[#F3F4F6]'} ${theme.textSecondary} transition-colors`}
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className={`mt-4 pt-4 border-t ${theme.border} flex items-center gap-6 text-sm`}>
            <div>
              <span className={theme.textSecondary}>היום: </span>
              <span className={`font-semibold ${theme.text}`}>{todayStats.completed}/{todayStats.total}</span>
            </div>
            <div>
              <span className={theme.textSecondary}>השבוע: </span>
              <span className={`font-semibold ${theme.text}`}>{weekStats.completed}/{weekStats.total}</span>
            </div>
            <div>
              <span className={theme.textSecondary}>סטריק: </span>
              <span className={`font-semibold ${theme.text}`}>{streak} ימים</span>
            </div>
          </div>

          {/* Navigation */}
          <div className={`mt-4 pt-4 border-t ${theme.border} flex items-center justify-between`}>
            <div className={`flex p-1 rounded-xl ${darkMode ? 'bg-[#252525]' : 'bg-[#F3F4F6]'}`}>
              {[
                { id: 'day', label: 'יום', key: '1' },
                { id: 'week', label: 'שבוע', key: '2' },
                { id: 'month', label: 'חודש', key: '3' },
              ].map(v => (
                <button
                  key={v.id}
                  onClick={() => setView(v.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
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
                className={`p-2 rounded-lg ${darkMode ? 'hover:bg-[#252525]' : 'hover:bg-[#F3F4F6]'} ${theme.textSecondary}`}
              >
                <ChevronRight size={20} />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-4 py-2 text-sm font-medium text-[#2563EB] hover:bg-[#2563EB]/10 rounded-lg transition-colors"
              >
                היום
              </button>
              <button
                onClick={() => navigate(1)}
                className={`p-2 rounded-lg ${darkMode ? 'hover:bg-[#252525]' : 'hover:bg-[#F3F4F6]'} ${theme.textSecondary}`}
              >
                <ChevronLeft size={20} />
              </button>
            </div>
          </div>
        </header>

        {/* Next Task Card */}
        {nextTask && view !== 'day' && (
          <div className={`${theme.card} rounded-2xl shadow-sm p-5 border-r-4 border-[#2563EB]`}>
            <div className={`text-xs font-medium ${theme.textMuted} mb-1`}>המשימה הבאה</div>
            <div className="flex items-center gap-3">
              {nextTask.time && (
                <span className={`text-lg font-semibold ${theme.text}`}>{nextTask.time}</span>
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
          <span className="opacity-60">
            N משימה חדשה · T היום · 1/2/3 תצוגה · / חיפוש
          </span>
        </div>

        {/* Modals */}
        {showNewTask && <NewTaskModal />}
        {showSearch && <SearchModal />}
        <HoverPreview />
      </div>
    </div>
  );
}
