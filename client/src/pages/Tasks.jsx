import { useState, useEffect, useRef } from 'react';
import {
  HiOutlinePlus,
  HiOutlineSearch,
  HiOutlineTrash,
  HiOutlinePencil,
  HiOutlineCheck,
  HiOutlineMicrophone,
  HiOutlineX,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import { taskAPI } from '../api';
import './Tasks.css';

const priorityLabels = { low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent' };

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filters, setFilters] = useState({ category: '', status: '', priority: '', search: '' });
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const [form, setForm] = useState({
    title: '', description: '', category: 'personal', priority: 'medium', dueDate: '', tags: '', isDaily: false,
  });

  useEffect(() => { loadTasks(); }, [filters]);

  const loadTasks = async () => {
    try {
      const params = {};
      if (filters.category) params.category = filters.category;
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      if (filters.search) params.search = filters.search;
      const res = await taskAPI.getAll(params);
      setTasks(res.data);
    } catch (err) {
      console.error(err);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Title is required');
    try {
      const payload = {
        ...form,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()) : [],
      };
      
      // Fix: Don't send empty dueDate string, which causes Mongoose CastError
      if (!payload.dueDate) {
        delete payload.dueDate;
      }

      if (editingTask) {
        await taskAPI.update(editingTask._id, payload);
        toast.success('Task updated!');
      } else {
        await taskAPI.create(payload);
        toast.success('Task created! 🎯');
      }
      resetForm();
      loadTasks();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error saving task');
    }
  };

  const handleDelete = async (id) => {
    try {
      await taskAPI.delete(id);
      toast.success('Task deleted');
      loadTasks();
    } catch (err) {
      toast.error('Error deleting task');
    }
  };

  const handleStatusToggle = async (task) => {
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    try {
      await taskAPI.update(task._id, { status: newStatus });
      if (newStatus === 'done') toast.success('Task completed! +' + task.points + ' XP 🎉');
      loadTasks();
    } catch (err) {
      toast.error('Error updating status');
    }
  };

  const startEditing = (task) => {
    setEditingTask(task);
    setForm({
      title: task.title,
      description: task.description || '',
      category: task.category,
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      tags: task.tags ? task.tags.join(', ') : '',
      isDaily: task.isDaily || false,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setForm({ title: '', description: '', category: 'personal', priority: 'medium', dueDate: '', tags: '', isDaily: false });
    setEditingTask(null);
    setShowModal(false);
  };

  // Voice input
  const toggleVoice = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      toast.error('Voice input not supported in this browser');
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setForm(prev => ({ ...prev, title: transcript }));
      toast.success('Voice captured!');
      setIsListening(false);
    };
    recognition.onerror = () => {
      setIsListening(false);
      toast.error('Voice input failed');
    };
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const dailyTasks = tasks.filter(t => t.isDaily);
  const generalTasks = tasks.filter(t => !t.isDaily);

  const groupedTasks = {
    todo: generalTasks.filter(t => t.status === 'todo'),
    'in-progress': generalTasks.filter(t => t.status === 'in-progress'),
    done: generalTasks.filter(t => t.status === 'done'),
  };

  return (
    <div className="tasks-page animate-in">
      <div className="page-header">
        <div>
          <h1>Tasks</h1>
          <p className="subtitle">{generalTasks.length} projects &bull; {dailyTasks.length} daily</p>
        </div>
        <button className="btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          <HiOutlinePlus /> New Task
        </button>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="search-wrapper">
          <HiOutlineSearch className="search-icon" />
          <input
            className="search-input"
            type="text"
            placeholder="Search tasks..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          />
        </div>
        <select value={filters.category} onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}>
          <option value="">All Categories</option>
          <option value="personal">Personal</option>
          <option value="work">Work</option>
        </select>
        <select value={filters.priority} onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}>
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
        <select value={filters.status} onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}>
          <option value="">All Status</option>
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="done">Done</option>
        </select>
      </div>

      {/* Task List */}
      {loading ? (
        <div className="card-grid">
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 140 }} />)}
        </div>
      ) : tasks.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📋</div>
          <h3>No tasks found</h3>
          <p>Create your first task or adjust your filters</p>
        </div>
      ) : (
        <>
          {/* Daily Tasks Section */}
          {dailyTasks.length > 0 && (
            <div className="daily-tasks-section">
              <h3 className="section-title">🌅 Daily Routines</h3>
              <div className="daily-tasks-grid">
                {dailyTasks.map((task, idx) => (
                  <div key={task._id} className={`daily-card glass-card ${task.status === 'done' ? 'completed' : ''}`} style={{ animationDelay: `${idx * 0.05}s` }}>
                    <button className="check-btn" onClick={() => handleStatusToggle(task)}>
                      {task.status === 'done' ? <HiOutlineCheck /> : <div className="check-empty" />}
                    </button>
                    <div className="daily-content">
                      <h4 className={task.status === 'done' ? 'done' : ''}>{task.title}</h4>
                    </div>
                    <div className="daily-actions">
                      <button className="btn-icon" onClick={() => startEditing(task)}><HiOutlinePencil /></button>
                      <button className="btn-icon" onClick={() => handleDelete(task._id)}><HiOutlineTrash /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Project / General Tasks Kanban */}
          <div className="task-columns">
            {['todo', 'in-progress', 'done'].map(status => (
              <div key={status} className="task-column">
                <div className={`column-header status-${status}`}>
                  <span className="column-dot" />
                  <h3>{status === 'todo' ? 'To Do' : status === 'in-progress' ? 'In Progress' : 'Done'}</h3>
                  <span className="column-count">{groupedTasks[status].length}</span>
                </div>
                <div className="column-tasks">
                  {groupedTasks[status].map((task, idx) => (
                    <div
                      key={task._id}
                      className={`task-card glass-card ${task.status === 'done' ? 'completed' : ''}`}
                      style={{ animationDelay: `${idx * 0.05}s` }}
                    >
                      <div className="task-card-header">
                        <button className="check-btn" onClick={() => handleStatusToggle(task)}>
                          {task.status === 'done' ? <HiOutlineCheck /> : <div className="check-empty" />}
                        </button>
                        <div className="task-card-meta">
                          <span className={`badge badge-${task.category}`}>{task.category}</span>
                          <span className={`badge badge-${task.priority}`}>{priorityLabels[task.priority]}</span>
                        </div>
                      </div>
                      <h4 className={`task-card-title ${task.status === 'done' ? 'done' : ''}`}>{task.title}</h4>
                      {task.description && <p className="task-card-desc">{task.description}</p>}
                      <div className="task-card-footer">
                        <div className="task-card-info">
                          {task.dueDate && (
                            <span className="due-date">
                              📅 {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          )}
                          <span className="task-points">⚡ {task.points} XP</span>
                        </div>
                        <div className="task-card-actions">
                          <button className="btn-icon" onClick={() => startEditing(task)}><HiOutlinePencil /></button>
                          <button className="btn-icon" onClick={() => handleDelete(task._id)}><HiOutlineTrash /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {groupedTasks[status].length === 0 && (
                    <div className="column-empty">No tasks</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && resetForm()}>
          <div className="modal-content">
            <h2>{editingTask ? 'Edit Task' : 'Create Task'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Title</label>
                <div className="input-with-voice">
                  <input
                    type="text"
                    placeholder="What needs to be done?"
                    value={form.title}
                    onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                    autoFocus
                  />
                  <button type="button" className={`voice-btn ${isListening ? 'listening' : ''}`} onClick={toggleVoice}>
                    <HiOutlineMicrophone />
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  placeholder="Add details..."
                  value={form.description}
                  onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <select value={form.category} onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))}>
                    <option value="personal">Personal</option>
                    <option value="work">Work</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select value={form.priority} onChange={(e) => setForm(prev => ({ ...prev, priority: e.target.value }))}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Due Date</label>
                  <input type="date" value={form.dueDate} onChange={(e) => setForm(prev => ({ ...prev, dueDate: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Tags (comma separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. urgent, meeting"
                    value={form.tags}
                    onChange={(e) => setForm(prev => ({ ...prev, tags: e.target.value }))}
                  />
                </div>
              </div>
              <div className="form-group daily-toggle">
                <label className="checkbox-label">
                  <input type="checkbox" checked={form.isDaily} onChange={(e) => setForm(prev => ({ ...prev, isDaily: e.target.checked }))} />
                  Mark as a Daily Task (shows in daily routines)
                </label>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={resetForm}>
                  <HiOutlineX /> Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingTask ? <><HiOutlinePencil /> Update</> : <><HiOutlinePlus /> Create</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
