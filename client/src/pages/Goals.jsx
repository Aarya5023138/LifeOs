import { useState, useEffect } from 'react';
import { HiOutlinePlus, HiOutlineSparkles, HiOutlineTrash, HiOutlinePencil, HiOutlineCheckCircle } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { goalAPI } from '../api';
import './Goals.css';

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', targetDate: '', category: 'personal', status: 'not_started', progress: 0
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => { loadGoals(); }, []);

  const loadGoals = async () => {
    try {
      const res = await goalAPI.getAll();
      setGoals(res.data);
    } catch { 
      toast.error('Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Goal title is required');
    
    try {
      const payload = { ...form };
      if (!payload.targetDate) delete payload.targetDate;

      if (editingId) {
        await goalAPI.update(editingId, payload);
        toast.success('Goal updated! 🎯');
      } else {
        await goalAPI.create(payload);
        toast.success('Goal added! 🚀');
      }
      closeModal();
      loadGoals();
    } catch (err) {
      toast.error('Error saving goal');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this goal?')) return;
    try {
      await goalAPI.delete(id);
      toast.success('Goal deleted');
      loadGoals();
    } catch {
      toast.error('Error deleting goal');
    }
  };

  const handleEdit = (goal) => {
    setForm({
      title: goal.title,
      description: goal.description,
      targetDate: goal.targetDate ? goal.targetDate.split('T')[0] : '',
      category: goal.category,
      status: goal.status,
      progress: goal.progress
    });
    setEditingId(goal._id);
    setShowModal(true);
  };

  const updateProgress = async (id, newProgress) => {
    try {
      let status = newProgress === 100 ? 'achieved' : (newProgress > 0 ? 'in_progress' : 'not_started');
      await goalAPI.update(id, { progress: newProgress, status });
      loadGoals();
    } catch {
      toast.error('Failed to update progress');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm({ title: '', description: '', targetDate: '', category: 'personal', status: 'not_started', progress: 0 });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'achieved': return 'var(--color-success)';
      case 'in_progress': return 'var(--color-info)';
      case 'not_started': return 'var(--color-warning)';
      case 'abandoned': return 'var(--color-danger)';
      default: return 'var(--text-secondary)';
    }
  };

  // Metrics
  const totalGoals = goals.length;
  const achievedGoals = goals.filter(g => g.status === 'achieved').length;
  const overallProgress = totalGoals === 0 ? 0 : Math.round(goals.reduce((acc, g) => acc + g.progress, 0) / totalGoals);

  return (
    <div className="goals-page animate-in">
      <div className="page-header">
        <div>
          <h1>Dreams & Goals for the Year</h1>
          <p className="subtitle">Set your vision, track progress, and make it happen.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <HiOutlinePlus /> New Goal
        </button>
      </div>

      {loading ? (
        <div className="card-grid">{[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 160 }} />)}</div>
      ) : (
        <>
          <div className="goals-overview glass-card">
            <div className="overview-stat">
              <span className="stat-value">{totalGoals}</span>
              <span className="stat-label">Total Goals</span>
            </div>
            <div className="overview-stat">
              <span className="stat-value text-success">{achievedGoals}</span>
              <span className="stat-label">Achieved</span>
            </div>
            <div className="overview-stat progress-stat">
              <div className="progress-circle-wrap">
                <div className="progress-circle" style={{ background: `conic-gradient(var(--accent-primary) ${overallProgress}%, var(--bg-primary) 0)` }}>
                  <div className="progress-inner">{overallProgress}%</div>
                </div>
              </div>
              <span className="stat-label">Overall Progress</span>
            </div>
          </div>

          {goals.length === 0 ? (
            <div className="empty-state">
              <div className="icon">🌠</div>
              <h3>No goals set yet</h3>
              <p>What do you want to achieve this year? Let's dream big!</p>
            </div>
          ) : (
            <div className="goals-grid">
              {goals.map((goal, idx) => (
                <div key={goal._id} className="goal-card glass-card" style={{ animationDelay: `${idx * 0.1}s` }}>
                  <div className="goal-header">
                    <div className="goal-badges">
                      <span className={`badge badge-${goal.category}`}>{goal.category}</span>
                      <span className="badge" style={{ background: getStatusColor(goal.status) + '22', color: getStatusColor(goal.status), border: `1px solid ${getStatusColor(goal.status)}55` }}>
                        {goal.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="goal-actions">
                      <button className="btn-icon" onClick={() => handleEdit(goal)}><HiOutlinePencil /></button>
                      <button className="btn-icon" onClick={() => handleDelete(goal._id)}><HiOutlineTrash /></button>
                    </div>
                  </div>
                  
                  <h3 className="goal-title">{goal.title}</h3>
                  {goal.description && <p className="goal-desc">{goal.description}</p>}
                  
                  {goal.targetDate && (
                    <div className="goal-date">
                      🎯 Target: {new Date(goal.targetDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                  )}

                  <div className="goal-progress-section">
                    <div className="progress-bar-header">
                      <span>Progress</span>
                      <span>{goal.progress}%</span>
                    </div>
                    <div className="progress-bar-bg">
                      <div className="progress-bar-fill" style={{ width: `${goal.progress}%`, background: goal.progress === 100 ? 'var(--color-success)' : 'var(--accent-gradient)' }} />
                    </div>
                    <input 
                      type="range" 
                      min="0" max="100" 
                      value={goal.progress} 
                      onChange={(e) => updateProgress(goal._id, parseInt(e.target.value))}
                      className="progress-slider"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Goal Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="modal-content">
            <h2>{editingId ? 'Edit Goal' : 'New Dream/Goal'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Title</label>
                <input type="text" placeholder="e.g. Learn a new language" value={form.title} onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))} autoFocus />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea placeholder="Why is this important to you?" value={form.description} onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))} rows={3} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Target Date</label>
                  <input type="date" value={form.targetDate} onChange={(e) => setForm(prev => ({ ...prev, targetDate: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select value={form.category} onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))}>
                    <option value="personal">Personal</option>
                    <option value="career">Career</option>
                    <option value="health">Health</option>
                    <option value="finance">Finance</option>
                    <option value="learning">Learning</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              
              <div className="form-group">
                <label>Initial Progress (%)</label>
                <input type="number" min="0" max="100" value={form.progress} onChange={(e) => setForm(prev => ({ ...prev, progress: parseInt(e.target.value) || 0 }))} />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn-primary"><HiOutlineSparkles /> {editingId ? 'Save Changes' : 'Manifest It'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
