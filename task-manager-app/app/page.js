'use client';

import React, { useState, useRef } from 'react';
import { Plus, Check, Trash2, TrendingUp, ChevronLeft, ChevronRight, X, BarChart3, Target } from 'lucide-react';

const hebrewDays = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const hebrewMonths = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];

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
    <div className="flex gap-2">
      <input
        ref={inputRef}
        type="text"
        onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
        placeholder={placeholder}
        className="flex-1 text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
        dir="rtl"
      />
      <button
        onClick={handleAdd}
        className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
      >
        <Plus size={18} />
      </button>
    </div>
  );
};

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

export default function TaskManager() {
  const [tasks, setTasks] = useState({});
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('week');
  const [selectedDay, setSelectedDay] = useState(null);

  const weekDates = getWeekDates(currentDate);
  const monthDates = getMonthDates(currentDate);

  const addTask = (dateKey, text) => {
    if (!text?.trim()) return;
    
    setTasks(prev => ({
      ...prev,
      [dateKey]: [...(prev[dateKey] || []), { id: Date.now(), text: text.trim(), completed: false }]
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

  const ProgressBar = ({ percentage, size = 'md' }) => {
    const heights = { sm: 'h-2', md: 'h-3', lg: 'h-4' };
    return (
      <div className={`w-full bg-gray-200 rounded-full ${heights[size]} overflow-hidden`}>
        <div 
          className={`${heights[size]} bg-emerald-500 rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    );
  };

  const CircularProgress = ({ percentage, size = 120, strokeWidth = 10, color = '#10b981' }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;
    
    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e5e7eb"
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
          <span className="text-2xl font-bold text-gray-700">{percentage}%</span>
        </div>
      </div>
    );
  };

  const DayColumn = ({ date, isToday }) => {
    const dateKey = formatDateKey(date);
    const dayTasks = tasks[dateKey] || [];
    const stats = getDayStats(dateKey);
    const dayIndex = date.getDay();

    return (
      <div className={`flex flex-col bg-white rounded-xl shadow-sm border-2 transition-all ${isToday ? 'border-emerald-400 shadow-emerald-100' : 'border-gray-100'}`}>
        <div className={`p-3 rounded-t-xl ${isToday ? 'bg-emerald-50' : 'bg-gray-50'}`}>
          <div className="text-center">
            <div className={`text-sm font-medium ${isToday ? 'text-emerald-600' : 'text-gray-500'}`}>
              {hebrewDays[dayIndex]}
            </div>
            <div className={`text-2xl font-bold ${isToday ? 'text-emerald-700' : 'text-gray-700'}`}>
              {date.getDate()}
            </div>
          </div>
        </div>

        <div className="p-3 border-b border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500">{stats.completed}/{stats.total}</span>
            <span className="text-xs font-semibold text-emerald-600">{stats.percentage}%</span>
          </div>
          <ProgressBar percentage={stats.percentage} size="sm" />
        </div>

        <div className="flex-1 p-3 space-y-2 min-h-[200px] max-h-[300px] overflow-y-auto">
          {dayTasks.map(task => (
            <div 
              key={task.id} 
              className={`group flex items-start gap-2 p-2 rounded-lg transition-all ${task.completed ? 'bg-emerald-50' : 'bg-gray-50 hover:bg-gray-100'}`}
            >
              <button
                onClick={() => toggleTask(dateKey, task.id)}
                className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${task.completed ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 hover:border-emerald-400'}`}
              >
                {task.completed && <Check size={12} className="text-white" />}
              </button>
              <span className={`flex-1 text-sm ${task.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                {task.text}
              </span>
              <button
                onClick={() => deleteTask(dateKey, task.id)}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-gray-100">
          <TaskInput 
            onAdd={(text) => addTask(dateKey, text)} 
            placeholder="משימה חדשה..."
          />
        </div>
      </div>
    );
  };

  const MonthView = () => {
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const startPadding = firstDayOfMonth.getDay();
    
    return (
      <div className="grid grid-cols-7 gap-2">
        {hebrewDays.map(day => (
          <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
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
              className={`p-2 rounded-lg cursor-pointer transition-all min-h-[80px] ${isToday ? 'bg-emerald-50 border-2 border-emerald-400' : 'bg-white border border-gray-200 hover:border-emerald-300'}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-sm font-medium ${isToday ? 'text-emerald-700' : 'text-gray-700'}`}>
                  {date.getDate()}
                </span>
                {stats.total > 0 && (
                  <span className="text-xs text-gray-400">{stats.completed}/{stats.total}</span>
                )}
              </div>
              {stats.total > 0 && (
                <ProgressBar percentage={stats.percentage} size="sm" />
              )}
              <div className="mt-1 space-y-0.5">
                {dayTasks.slice(0, 2).map(task => (
                  <div key={task.id} className={`text-xs truncate ${task.completed ? 'text-gray-400 line-through' : 'text-gray-600'}`}>
                    {task.text}
                  </div>
                ))}
                {dayTasks.length > 2 && (
                  <div className="text-xs text-emerald-600">+{dayTasks.length - 2} עוד</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const DayModal = ({ date, onClose }) => {
    const dateKey = formatDateKey(date);
    const dayTasks = tasks[dateKey] || [];
    const stats = getDayStats(dateKey);

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden">
          <div className="p-4 bg-emerald-500 text-white flex items-center justify-between">
            <div>
              <div className="text-lg font-bold">{hebrewDays[date.getDay()]}</div>
              <div className="text-sm opacity-90">{date.getDate()} {hebrewMonths[date.getMonth()]}</div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-emerald-600 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>
          
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600">התקדמות יומית</span>
              <span className="font-bold text-emerald-600">{stats.percentage}%</span>
            </div>
            <ProgressBar percentage={stats.percentage} size="md" />
            <div className="text-sm text-gray-500 mt-1">{stats.completed} מתוך {stats.total} משימות הושלמו</div>
          </div>

          <div className="p-4 space-y-2 max-h-[40vh] overflow-y-auto">
            {dayTasks.map(task => (
              <div 
                key={task.id}
                className={`flex items-center gap-3 p-3 rounded-lg ${task.completed ? 'bg-emerald-50' : 'bg-gray-50'}`}
              >
                <button
                  onClick={() => toggleTask(dateKey, task.id)}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${task.completed ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'}`}
                >
                  {task.completed && <Check size={14} className="text-white" />}
                </button>
                <span className={`flex-1 ${task.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                  {task.text}
                </span>
                <button
                  onClick={() => deleteTask(dateKey, task.id)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-gray-100">
            <TaskInput 
              onAdd={(text) => addTask(dateKey, text)} 
              placeholder="הוסף משימה חדשה..."
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">מנהל משימות</h1>
              <p className="text-gray-500 mt-1">
                {hebrewMonths[currentDate.getMonth()]} {currentDate.getFullYear()}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex bg-gray-100 rounded-xl p-1">
                {['day', 'week', 'month'].map(v => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === v ? 'bg-white shadow text-emerald-600' : 'text-gray-600 hover:text-gray-800'}`}
                  >
                    {v === 'day' ? 'יום' : v === 'week' ? 'שבוע' : 'חודש'}
                  </button>
                ))}
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => view === 'month' ? navigateMonth(-1) : navigateWeek(-1)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="px-4 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                >
                  היום
                </button>
                <button
                  onClick={() => view === 'month' ? navigateMonth(1) : navigateWeek(1)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-100 rounded-xl">
                <Target className="text-emerald-600" size={24} />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-500">התקדמות יומית</div>
                <div className="text-2xl font-bold text-gray-800">{getDayStats(formatDateKey(new Date())).percentage}%</div>
              </div>
              <CircularProgress percentage={getDayStats(formatDateKey(new Date())).percentage} size={70} strokeWidth={6} color="#10b981" />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <BarChart3 className="text-blue-600" size={24} />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-500">התקדמות שבועית</div>
                <div className="text-2xl font-bold text-gray-800">{weekStats.percentage}%</div>
                <div className="text-xs text-gray-400">{weekStats.completed}/{weekStats.total} משימות</div>
              </div>
              <CircularProgress percentage={weekStats.percentage} size={70} strokeWidth={6} color="#3b82f6" />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-xl">
                <TrendingUp className="text-purple-600" size={24} />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-500">התקדמות חודשית</div>
                <div className="text-2xl font-bold text-gray-800">{monthStats.percentage}%</div>
                <div className="text-xs text-gray-400">{monthStats.completed}/{monthStats.total} משימות</div>
              </div>
              <CircularProgress percentage={monthStats.percentage} size={70} strokeWidth={6} color="#8b5cf6" />
            </div>
          </div>
        </div>

        {/* Weekly Progress Chart */}
        {view !== 'month' && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">גרף השלמת משימות שבועי</h3>
            <div className="flex items-end justify-between gap-2 h-32">
              {weekDates.map((date, i) => {
                const stats = getDayStats(formatDateKey(date));
                const isToday = formatDateKey(new Date()) === formatDateKey(date);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div className="text-xs font-medium text-gray-500">{stats.percentage}%</div>
                    <div className="w-full bg-gray-100 rounded-t-lg relative" style={{ height: '80px' }}>
                      <div 
                        className={`absolute bottom-0 w-full rounded-t-lg transition-all duration-500 ${isToday ? 'bg-emerald-500' : 'bg-emerald-300'}`}
                        style={{ height: `${stats.percentage}%` }}
                      />
                    </div>
                    <div className={`text-xs font-medium ${isToday ? 'text-emerald-600' : 'text-gray-500'}`}>
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
            <div className="w-full max-w-md">
              <DayColumn date={new Date()} isToday={true} />
            </div>
          </div>
        )}

        {view === 'week' && (
          <div className="grid grid-cols-7 gap-3">
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
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <MonthView />
          </div>
        )}

        {selectedDay && (
          <DayModal date={selectedDay} onClose={() => setSelectedDay(null)} />
        )}
      </div>
    </div>
  );
}
