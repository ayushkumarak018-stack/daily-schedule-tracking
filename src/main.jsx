import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlarmClock, ArrowDownToLine, ArrowUpFromLine, BarChart3, Bell, BookOpen,
  CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, Circle,
  CirclePlus, Clock3, FileText, Flame, Focus, GripVertical, LayoutDashboard,
  ListFilter, Menu, Moon, MoreHorizontal, Pencil, Pause, Play, Plus, RotateCcw,
  Search, Settings, Sparkles, Sun, Target, Trash2, TrendingUp, Upload, UserRound,
  X, Zap
} from 'lucide-react';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts';
import './styles.css';

const categories = {
  Work: { color: '#5577d4', tint: '#e9edfb' },
  Study: { color: '#b36b41', tint: '#f7e8de' },
  Personal: { color: '#3d9a78', tint: '#def1e9' },
  Health: { color: '#d16a6a', tint: '#f7e0df' },
  Meeting: { color: '#8b63b6', tint: '#eee5f7' },
  Other: { color: '#64748b', tint: '#e8edf2' }
};

const initialTasks = [
  { id: 1, title: 'Morning run & stretch', description: 'Start the day with a clear head.', start: '06:45', end: '07:30', priority: 'Medium', category: 'Health', done: true },
  { id: 2, title: 'Deep work: product strategy', description: 'Quarterly roadmap and priorities.', start: '09:00', end: '11:00', priority: 'High', category: 'Work', done: false },
  { id: 3, title: 'Design critique with team', description: 'Review the onboarding flow.', start: '11:30', end: '12:15', priority: 'High', category: 'Meeting', done: false },
  { id: 4, title: 'Lunch away from desk', description: 'A real break, no screens.', start: '12:30', end: '13:15', priority: 'Low', category: 'Personal', done: false },
  { id: 5, title: 'Read chapter 4', description: 'The Creative Act by Rick Rubin.', start: '14:00', end: '14:45', priority: 'Low', category: 'Study', done: false },
  { id: 6, title: 'Inbox zero', description: 'Triage and reply to important threads.', start: '15:15', end: '16:00', priority: 'Medium', category: 'Work', done: false }
];

const weeklyData = [
  { day: 'Mon', score: 72, hours: 5.3 }, { day: 'Tue', score: 84, hours: 6.8 },
  { day: 'Wed', score: 62, hours: 4.2 }, { day: 'Thu', score: 91, hours: 7.5 },
  { day: 'Fri', score: 78, hours: 6.1 }, { day: 'Sat', score: 48, hours: 3.4 },
  { day: 'Sun', score: 66, hours: 4.8 }
];
const categoryData = Object.entries(categories).slice(0, 5).map(([name, value], index) => ({ name, value: [32, 22, 18, 14, 10][index], color: value.color }));

function formatDate(date = new Date()) {
  return new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(date);
}
function formatShortDate(date = new Date()) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
}
function formatClock(date = new Date()) {
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(date);
}
function timeToMinutes(value) { const [h, m] = value.split(':').map(Number); return h * 60 + m; }
function formatTime(value) { const [h, m] = value.split(':').map(Number); const suffix = h >= 12 ? 'PM' : 'AM'; return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${suffix}`; }

function App() {
  const [tasks, setTasks] = useState(() => JSON.parse(localStorage.getItem('daymark-tasks') || 'null') || initialTasks);
  const [activeView, setActiveView] = useState('Overview');
  const [theme, setTheme] = useState(() => localStorage.getItem('daymark-theme') || 'light');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All tasks');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [draggedTask, setDraggedTask] = useState(null);
  const [notice, setNotice] = useState('');
  const [mobileNav, setMobileNav] = useState(false);
  const [pomodoroOpen, setPomodoroOpen] = useState(false);
  const [clock, setClock] = useState(() => formatClock());

  useEffect(() => localStorage.setItem('daymark-tasks', JSON.stringify(tasks)), [tasks]);
  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem('daymark-theme', theme); }, [theme]);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(''), 2600); return () => clearTimeout(timer); }, [notice]);
  useEffect(() => { const timer = setInterval(() => setClock(formatClock()), 30000); return () => clearInterval(timer); }, []);

  const completed = tasks.filter(task => task.done).length;
  const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
  const visibleTasks = useMemo(() => tasks.filter(task => {
    const matchesSearch = `${task.title} ${task.description} ${task.category}`.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'All tasks' || (filter === 'Completed' ? task.done : filter === 'Pending' ? !task.done : task.priority === filter || task.category === filter);
    return matchesSearch && matchesFilter;
  }), [tasks, search, filter]);

  function toggleTask(id) { setTasks(current => current.map(task => task.id === id ? { ...task, done: !task.done } : task)); }
  function removeTask(id) { setTasks(current => current.filter(task => task.id !== id)); setNotice('Schedule removed'); }
  function saveTask(task) {
    setTasks(current => task.id ? current.map(item => item.id === task.id ? task : item) : [...current, { ...task, id: Date.now() }]);
    setModalOpen(false); setEditingTask(null); setNotice(task.id ? 'Schedule updated' : 'Schedule added');
  }
  function moveTask(id, start) { setTasks(current => current.map(task => task.id === id ? { ...task, start } : task)); setNotice('Timeline updated'); }
  function exportCsv() {
    const csv = ['Title,Category,Priority,Start,End,Status', ...tasks.map(task => [task.title, task.category, task.priority, task.start, task.end, task.done ? 'Completed' : 'Pending'].map(value => `"${value}"`).join(','))].join('\n');
    const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); link.download = 'daymark-schedule.csv'; link.click(); setNotice('CSV exported');
  }
  function backup() { const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([JSON.stringify(tasks, null, 2)], { type: 'application/json' })); link.download = 'daymark-backup.json'; link.click(); setNotice('Backup downloaded'); }
  function restoreBackup(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const restored = JSON.parse(reader.result);
        if (!Array.isArray(restored) || restored.some(task => !task.title || !task.start || !task.end)) throw new Error('Invalid backup');
        setTasks(restored); setNotice('Backup restored');
      } catch { setNotice('That backup file is not valid'); }
    };
    reader.readAsText(file);
  }

  const navItems = [['Overview', LayoutDashboard], ['Timeline', Clock3], ['Calendar', CalendarDays], ['Analytics', BarChart3]];
  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? 'open' : ''}`}>
      <div className="brand"><span className="brand-mark"><Sparkles size={16} /></span><span>daymark</span></div>
      <div className="workspace-switcher"><span className="avatar">A</span><span><b>Alex's workspace</b><small>Personal plan</small></span><ChevronDown size={14} /></div>
      <nav className="main-nav">{navItems.map(([name, Icon]) => <button key={name} className={activeView === name ? 'active' : ''} onClick={() => { setActiveView(name); setMobileNav(false); }}><Icon size={18} />{name}{name === 'Timeline' && <span className="nav-count">{tasks.filter(t => !t.done).length}</span>}</button>)}</nav>
      <div className="side-label">Workspace</div>
      <nav className="main-nav"><button onClick={() => setNotice('Goals are on track')}><Target size={18} />Goals</button><button onClick={() => setPomodoroOpen(true)}><Focus size={18} />Focus timer</button><button onClick={() => setNotice('Settings coming soon')}><Settings size={18} />Settings</button></nav>
      <div className="sidebar-bottom"><div className="upgrade-card"><div className="upgrade-icon"><Zap size={16} /></div><b>Make time for what matters.</b><p>Build a rhythm that works for you.</p><button onClick={() => setNotice('You are already on the best plan')}>Explore Pro <ChevronRight size={14} /></button></div><div className="user-row"><span className="avatar avatar-small">A</span><span><b>Alex Morgan</b><small>alex@example.com</small></span><MoreHorizontal size={17} /></div></div>
    </aside>
    <main className="main-content">
      <header className="topbar"><button className="icon-button mobile-menu" onClick={() => setMobileNav(!mobileNav)}><Menu size={20} /></button><div className="breadcrumb"><span>Workspace</span><ChevronRight size={14} /><b>{activeView}</b></div><div className="top-actions"><div className="search-box"><Search size={16} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search schedules..." /></div><button className="icon-button" onClick={() => setNotice('No new reminders')}><Bell size={18} /><i className="notification-dot" /></button><button className="icon-button" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>{theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}</button><button className="top-avatar">AM</button></div></header>
      {activeView === 'Overview' && <Dashboard clock={clock} tasks={tasks} visibleTasks={visibleTasks} progress={progress} completed={completed} filter={filter} setFilter={setFilter} onToggle={toggleTask} onDelete={removeTask} onEdit={task => { setEditingTask(task); setModalOpen(true); }} onAdd={() => { setEditingTask(null); setModalOpen(true); }} onExport={exportCsv} onBackup={backup} onRestore={restoreBackup} onDrop={moveTask} draggedTask={draggedTask} setDraggedTask={setDraggedTask} />}
      {activeView === 'Timeline' && <Timeline tasks={visibleTasks} onToggle={toggleTask} onEdit={task => { setEditingTask(task); setModalOpen(true); }} onDrop={moveTask} draggedTask={draggedTask} setDraggedTask={setDraggedTask} />}
      {activeView === 'Calendar' && <CalendarView tasks={tasks} />}
      {activeView === 'Analytics' && <Analytics />}
    </main>
    <AnimatePresence>{modalOpen && <TaskModal task={editingTask} onClose={() => { setModalOpen(false); setEditingTask(null); }} onSave={saveTask} />}</AnimatePresence>
    <AnimatePresence>{pomodoroOpen && <PomodoroTimer onClose={() => setPomodoroOpen(false)} />}</AnimatePresence>
    <AnimatePresence>{notice && <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} className="toast"><Check size={16} />{notice}</motion.div>}</AnimatePresence>
  </div>;
}

function Dashboard({ clock, tasks, visibleTasks, progress, completed, filter, setFilter, onToggle, onDelete, onEdit, onAdd, onExport, onBackup, onRestore, onDrop, draggedTask, setDraggedTask }) {
  return <div className="page-wrap"><section className="welcome-row"><div><p className="eyebrow">{formatDate()}</p><h1>Good morning, Alex <span>✦</span></h1><p className="muted">A little progress every day adds up to remarkable results.</p></div><div className="date-control"><CalendarDays size={16} /><span>Today, {formatShortDate()} · {clock}</span><ChevronDown size={14} /></div></section>
    <section className="stats-grid"><StatCard label="Daily progress" value={`${progress}%`} detail="of your day complete" icon={<TrendingUp size={18} />} accent="blue" progress={progress} /><StatCard label="Total schedules" value={tasks.length} detail="planned for today" icon={<ListFilter size={18} />} accent="orange" /><StatCard label="Completed" value={completed} detail={`${tasks.length - completed} still to go`} icon={<Check size={18} />} accent="green" /><StatCard label="Current streak" value="7 days" detail="Best: 14 days" icon={<Flame size={18} />} accent="purple" /></section>
    <section className="content-grid"><div className="main-column"><div className="section-heading"><div><h2>Today's schedule</h2><p className="muted">Stay focused on what matters most.</p></div><div className="heading-actions"><FilterButton filter={filter} setFilter={setFilter} /><button className="primary-button" onClick={onAdd}><Plus size={17} />Add schedule</button></div></div><Timeline tasks={visibleTasks} compact onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} onDrop={onDrop} draggedTask={draggedTask} setDraggedTask={setDraggedTask} /></div><aside className="right-column"><QuoteCard /><ProductivityCard progress={progress} /><NotesCard /></aside></section>
    <section className="bottom-grid"><AnalyticsMini /><QuickActions onExport={onExport} onBackup={onBackup} onRestore={onRestore} onAdd={onAdd} /></section>
  </div>;
}

function StatCard({ label, value, detail, icon, accent, progress }) { return <div className={`stat-card ${accent}`}><div className="stat-top"><span className="stat-label">{label}</span><span className="stat-icon">{icon}</span></div><div className="stat-value">{value}</div><div className="stat-detail">{detail}</div>{progress !== undefined && <div className="mini-progress"><span style={{ width: `${progress}%` }} /></div>}</div>; }
function FilterButton({ filter, setFilter }) { return <div className="filter-wrap"><ListFilter size={15} /><select value={filter} onChange={e => setFilter(e.target.value)}><option>All tasks</option><option>Pending</option><option>Completed</option><option>High</option><option>Medium</option><option>Low</option><option>Work</option><option>Study</option></select><ChevronDown size={13} /></div>; }
function QuoteCard() { return <div className="quote-card"><div className="quote-mark">“</div><p>The secret of getting ahead is getting started.</p><span>— Mark Twain</span><div className="quote-dots"><i className="selected" /><i /><i /><button><ChevronRight size={14} /></button></div></div>; }
function ProductivityCard({ progress }) { return <div className="productivity-card"><div className="card-title-row"><div><h3>Productivity score</h3><p>This week</p></div><button className="more-button"><MoreHorizontal size={18} /></button></div><div className="score-row"><div className="score-ring" style={{ '--score': `${Math.max(progress, 68)}%` }}><strong>{Math.max(progress, 68)}</strong><span>/ 100</span></div><div><b>Great work!</b><p>You're 12% above<br />your weekly average.</p></div></div><div className="score-bar"><span style={{ width: '76%' }} /></div><div className="score-legend"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div></div>; }
function NotesCard() { const [note, setNote] = useState('Keep meetings focused. Leave room for deep work.'); return <div className="notes-card"><div className="card-title-row"><div><h3>Daily note</h3><p>A space for your thoughts</p></div><FileText size={17} /></div><textarea value={note} onChange={e => setNote(e.target.value)} /><div className="note-footer"><span>Saved just now</span><button onClick={() => setNote('')}>Clear</button></div></div>; }

function Timeline({ tasks, compact = false, onToggle, onEdit, onDelete, onDrop, draggedTask, setDraggedTask }) {
  const hours = compact ? [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17] : [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
  const startHour = hours[0];
  const nowPosition = ((new Date().getHours() + new Date().getMinutes() / 60) - startHour) * 76;
  return <div className={`timeline ${compact ? 'compact' : ''}`}><div className="timeline-head"><span className="today-label"><span className="live-dot" />Live timeline</span><span className="timeline-date">{formatDate()}</span><button className="small-action"><AlarmClock size={14} /> Reminders</button></div><div className="timeline-body"><div className="time-labels">{hours.map(hour => <span key={hour}>{hour % 12 || 12} {hour >= 12 ? 'PM' : 'AM'}</span>)}</div><div className="timeline-track" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); if (draggedTask) { const box = e.currentTarget.getBoundingClientRect(); const hour = Math.max(startHour, Math.min(20, Math.floor(startHour + (e.clientY - box.top) / 76))); onDrop(draggedTask, `${String(hour).padStart(2, '0')}:00`); setDraggedTask(null); }}}>{hours.map(hour => <div className="hour-line" key={hour} />)}{nowPosition > 0 && nowPosition < hours.length * 76 && <div className="current-line" style={{ top: nowPosition }}><span>Now</span></div>}{tasks.map(task => <ScheduleBlock key={task.id} task={task} startHour={startHour} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} onDragStart={setDraggedTask} />)}</div></div>{!tasks.length && <div className="empty-state"><Search size={22} /><b>No schedules found</b><span>Try another filter or add a new schedule.</span></div>}</div>;
}
function ScheduleBlock({ task, startHour, onToggle, onEdit, onDelete, onDragStart }) { const top = (timeToMinutes(task.start) - startHour * 60) / 60 * 76; const height = Math.max(44, (timeToMinutes(task.end) - timeToMinutes(task.start)) / 60 * 76); const style = categories[task.category]; return <motion.div layout draggable onDragStart={() => onDragStart(task.id)} className={`schedule-block ${task.done ? 'done' : ''}`} style={{ top, height, '--category': style.color, '--tint': style.tint }}><div className="block-color" /><div className="block-content" onClick={() => onEdit?.(task)}><div className="block-title"><span>{task.title}</span>{task.priority === 'High' && <i className="priority-dot" />}</div><span className="block-time"><Clock3 size={12} />{formatTime(task.start)} - {formatTime(task.end)}</span></div><button className={`check-button ${task.done ? 'checked' : ''}`} onClick={e => { e.stopPropagation(); onToggle(task.id); }}>{task.done && <Check size={13} />}</button><button className="block-menu" onClick={() => onDelete?.(task.id)}><Trash2 size={13} /></button><GripVertical className="grip" size={15} /></motion.div>; }

function AnalyticsMini() { return <div className="analytics-mini"><div className="card-title-row"><div><h3>Weekly productivity</h3><p>Completed schedules by day</p></div><button className="text-button">View analytics <ChevronRight size={14} /></button></div><div className="chart-wrap"><ResponsiveContainer width="100%" height={150}><AreaChart data={weeklyData}><defs><linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#5577d4" stopOpacity={0.24} /><stop offset="100%" stopColor="#5577d4" stopOpacity={0} /></linearGradient></defs><CartesianGrid vertical={false} stroke="#e8ebe8" /><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#89918c', fontSize: 11 }} /><YAxis hide domain={[0, 100]} /><Tooltip cursor={{ stroke: '#c9d1cd' }} contentStyle={{ border: '0', borderRadius: 8, boxShadow: '0 8px 24px #18251c1a' }} /><Area type="monotone" dataKey="score" stroke="#5577d4" strokeWidth={2.5} fill="url(#chartFill)" /></AreaChart></ResponsiveContainer></div></div>; }
function QuickActions({ onExport, onBackup, onRestore, onAdd }) { return <div className="quick-actions"><div className="card-title-row"><div><h3>Quick actions</h3><p>Make your workflow easier</p></div><Zap size={17} /></div><button onClick={onAdd}><CirclePlus size={17} /><span><b>New schedule</b><small>Add something to your day</small></span><ChevronRight size={15} /></button><button onClick={onExport}><ArrowDownToLine size={17} /><span><b>Export your data</b><small>Download as CSV</small></span><ChevronRight size={15} /></button><button onClick={onBackup}><ArrowUpFromLine size={17} /><span><b>Backup schedules</b><small>Keep your data safe</small></span><ChevronRight size={15} /></button><label className="restore-action"><Upload size={17} /><span><b>Restore a backup</b><small>Import a JSON backup</small></span><ChevronRight size={15} /><input type="file" accept="application/json,.json" onChange={onRestore} /></label></div>; }

 function CalendarView({ tasks }) { const [view, setView] = useState('Month'); const [monthOffset, setMonthOffset] = useState(0); const today = new Date(); const now = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1); const firstDay = (now.getDay() + 6) % 7; const days = Array.from({ length: 35 }, (_, index) => new Date(now.getFullYear(), now.getMonth(), index - firstDay + 1)); const monthLabel = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(now); const isToday = date => date.toDateString() === today.toDateString(); return <div className="page-wrap"><div className="view-heading"><div><p className="eyebrow">Schedule archive</p><h1>Calendar</h1><p className="muted">A wider view of your rhythm and routines.</p></div><div className="calendar-controls"><button className="icon-button" onClick={() => setMonthOffset(current => current - 1)}><ChevronLeft size={17} /></button><b>{monthLabel}</b><button className="icon-button" onClick={() => setMonthOffset(current => current + 1)}><ChevronRight size={17} /></button></div></div><div className="calendar-card"><div className="calendar-tabs">{['Month', 'Week', 'Day'].map(option => <button key={option} className={view === option ? 'active' : ''} onClick={() => setView(option)}>{option}</button>)}</div>{view === 'Month' ? <><div className="calendar-weekdays">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => <span key={day}>{day}</span>)}</div><div className="calendar-grid">{days.map((date, index) => { const actual = date.getMonth() === now.getMonth(); const marked = actual && (isToday(date) || date.getDate() === 15 || date.getDate() === 21 || date.getDate() === 27); return <div className={`calendar-day ${!actual ? 'muted-day' : ''} ${isToday(date) ? 'today' : ''}`} key={index}><span>{date.getDate()}</span>{marked && <div className="calendar-events"><i style={{ background: categories.Work.color }} />{isToday(date) && <i style={{ background: categories.Study.color }} />}</div>}</div>; })}</div></> : <CalendarAgenda tasks={tasks} view={view} />}</div><div className="history-row"><div><h2>{view} schedule</h2><p className="muted">{tasks.length} items on your plan</p></div><div className="history-pills"><span><i className="legend-dot work" />Work</span><span><i className="legend-dot study" />Study</span><span><i className="legend-dot personal" />Personal</span></div></div></div>; }
 function CalendarAgenda({ tasks, view }) { return <div className="calendar-agenda"><div className="agenda-heading"><span>{view === 'Day' ? 'Today' : 'This week'}</span><span>{tasks.length} schedules</span></div>{tasks.map(task => <div className="agenda-item" key={task.id}><span className="agenda-time">{formatTime(task.start)}</span><span className="agenda-bar" style={{ background: categories[task.category].color }} /><span className="agenda-details"><b>{task.title}</b><small>{task.category} · {formatTime(task.start)} - {formatTime(task.end)}</small></span><span className={`agenda-status ${task.done ? 'complete' : ''}`}>{task.done ? 'Done' : task.priority}</span></div>)}</div>; }
function Analytics() { return <div className="page-wrap"><div className="view-heading"><div><p className="eyebrow">Patterns & momentum</p><h1>Analytics</h1><p className="muted">Understand how you spend your best hours.</p></div><div className="date-control"><CalendarDays size={16} />Last 7 days<ChevronDown size={14} /></div></div><div className="analytics-stats"><StatCard label="Completion rate" value="78%" detail="+8.4% vs last week" icon={<TrendingUp size={18} />} accent="blue" /><StatCard label="Focus time" value="32.4h" detail="4.6h average / day" icon={<Focus size={18} />} accent="orange" /><StatCard label="Best day" value="Thursday" detail="91 productivity score" icon={<Sparkles size={18} />} accent="green" /></div><div className="analytics-layout"><div className="large-chart"><div className="card-title-row"><div><h3>Productivity trend</h3><p>Your score over the last week</p></div><button className="filter-wrap">This week <ChevronDown size={13} /></button></div><ResponsiveContainer width="100%" height={290}><BarChart data={weeklyData} barSize={28}><CartesianGrid vertical={false} stroke="#e7ebe8" /><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#89918c', fontSize: 12 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: '#89918c', fontSize: 11 }} /><Tooltip cursor={{ fill: '#f4f6f3' }} contentStyle={{ border: 0, borderRadius: 8 }} /><Bar dataKey="score" radius={[5, 5, 0, 0]}>{weeklyData.map((entry, index) => <Cell key={index} fill={index === 3 ? '#5577d4' : '#c9d4f3'} />)}</Bar></BarChart></ResponsiveContainer></div><div className="category-chart"><div className="card-title-row"><div><h3>Time by category</h3><p>This week's focus distribution</p></div><MoreHorizontal size={18} /></div><div className="donut-wrap"><ResponsiveContainer width="100%" height={200}><PieChart><Pie data={categoryData} innerRadius={57} outerRadius={80} paddingAngle={3} dataKey="value">{categoryData.map(entry => <Cell key={entry.name} fill={entry.color} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer><div className="donut-center"><b>32.4</b><span>hours</span></div></div><div className="category-legend">{categoryData.map(item => <span key={item.name}><i style={{ background: item.color }} />{item.name}<b>{item.value}%</b></span>)}</div></div></div></div>; }
function PomodoroTimer({ onClose }) { const [seconds, setSeconds] = useState(25 * 60); const [running, setRunning] = useState(false); useEffect(() => { if (!running) return undefined; const interval = setInterval(() => setSeconds(current => current > 0 ? current - 1 : 0), 1000); return () => clearInterval(interval); }, [running]); useEffect(() => { if (seconds === 0) setRunning(false); }, [seconds]); const minutes = Math.floor(seconds / 60); const remaining = seconds % 60; const percent = ((25 * 60 - seconds) / (25 * 60)) * 100; return <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={event => event.target === event.currentTarget && onClose()}><motion.div className="modal pomodoro-modal" initial={{ opacity: 0, y: 16, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }}><div className="modal-header"><div><p className="eyebrow">Focus timer</p><h2>One thing at a time</h2></div><button className="icon-button" onClick={onClose}><X size={18} /></button></div><div className="pomodoro-face"><div className="pomodoro-ring" style={{ '--timer-progress': `${percent}%` }}><strong>{String(minutes).padStart(2, '0')}:{String(remaining).padStart(2, '0')}</strong><span>{seconds === 0 ? 'Session complete' : running ? 'Stay with it' : 'Ready when you are'}</span></div></div><div className="pomodoro-actions"><button className="secondary-button" onClick={() => { setSeconds(25 * 60); setRunning(false); }}><RotateCcw size={15} />Reset</button><button className="primary-button" onClick={() => setRunning(current => !current)}>{running ? <Pause size={15} /> : <Play size={15} />}{running ? 'Pause' : 'Start focus'}</button></div></motion.div></motion.div>; }

function TaskModal({ task, onClose, onSave }) { const [form, setForm] = useState(task || { title: '', description: '', start: '09:00', end: '10:00', priority: 'Medium', category: 'Work', done: false }); const update = (key, value) => setForm(current => ({ ...current, [key]: value })); return <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={e => e.target === e.currentTarget && onClose()}><motion.div className="modal" initial={{ opacity: 0, y: 16, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }}><div className="modal-header"><div><p className="eyebrow">{task ? 'Edit schedule' : 'New schedule'}</p><h2>{task ? 'Refine your plan' : 'Add to your day'}</h2></div><button className="icon-button" onClick={onClose}><X size={18} /></button></div><label>Task title<input autoFocus value={form.title} onChange={e => update('title', e.target.value)} placeholder="What needs your attention?" /></label><label>Description <span>Optional</span><textarea value={form.description} onChange={e => update('description', e.target.value)} placeholder="Add some context..." /></label><div className="form-row"><label>Start time<input type="time" value={form.start} onChange={e => update('start', e.target.value)} /></label><label>End time<input type="time" value={form.end} onChange={e => update('end', e.target.value)} /></label></div><div className="form-row"><label>Priority<select value={form.priority} onChange={e => update('priority', e.target.value)}><option>High</option><option>Medium</option><option>Low</option></select></label><label>Category<select value={form.category} onChange={e => update('category', e.target.value)}>{Object.keys(categories).map(name => <option key={name}>{name}</option>)}</select></label></div><div className="modal-footer"><button className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" disabled={!form.title.trim()} onClick={() => onSave(form)}>{task ? <Pencil size={16} /> : <Plus size={16} />}{task ? 'Save changes' : 'Add schedule'}</button></div></motion.div></motion.div>; }

createRoot(document.getElementById('root')).render(<App />);