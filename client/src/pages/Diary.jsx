import { useState, useEffect } from 'react';
import { HiOutlinePlus, HiOutlineTrash, HiOutlinePencil, HiOutlineX, HiOutlinePaperClip } from 'react-icons/hi';
import toast from 'react-hot-toast';
import api, { diaryAPI } from '../api';
import './Diary.css';

const API_HOST = (import.meta.env.VITE_API_URL || 'http://localhost:5001/api').replace(/\/api$/, '');

const moods = [
  { value: 'amazing', emoji: '🤩', label: 'Amazing', color: 'var(--mood-amazing)' },
  { value: 'happy', emoji: '😊', label: 'Happy', color: 'var(--mood-happy)' },
  { value: 'neutral', emoji: '😐', label: 'Neutral', color: 'var(--mood-neutral)' },
  { value: 'sad', emoji: '😢', label: 'Sad', color: 'var(--mood-sad)' },
  { value: 'terrible', emoji: '😞', label: 'Terrible', color: 'var(--mood-terrible)' },
];

export default function Diary() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [filterMood, setFilterMood] = useState('');
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], content: '', mood: 'neutral', tags: '', attachments: [], existingAttachments: [] });

  useEffect(() => { loadEntries(); }, [filterMood]);

  const loadEntries = async () => {
    try {
      const params = {};
      if (filterMood) params.mood = filterMood;
      const res = await diaryAPI.getAll(params);
      setEntries(res.data);
    } catch { setEntries([]); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.content.trim()) return toast.error('Write something!');
    try {
      let payload;
      if (form.attachments.length > 0 || form.existingAttachments.length > 0) {
        payload = new FormData();
        payload.append('date', form.date);
        payload.append('content', form.content);
        payload.append('mood', form.mood);
        if (form.tags) payload.append('tags', form.tags);
        form.attachments.forEach(file => payload.append('attachments', file));
        if (editingEntry) {
          payload.append('existingAttachments', JSON.stringify(form.existingAttachments));
        }
      } else {
        payload = { ...form, tags: form.tags ? form.tags.split(',').map(t => t.trim()) : [] };
      }

      if (editingEntry) {
        await diaryAPI.update(editingEntry._id, payload);
        toast.success('Entry updated!');
      } else {
        await diaryAPI.create(payload);
        toast.success('Diary entry created! +15 XP 📝');
      }
      resetForm();
      loadEntries();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error saving entry');
    }
  };

  const handleDelete = async (id) => {
    try {
      await diaryAPI.delete(id);
      toast.success('Entry deleted');
      loadEntries();
    } catch { toast.error('Error deleting entry'); }
  };

  const startEditing = (entry) => {
    setEditingEntry(entry);
    setForm({
      date: entry.date.split('T')[0],
      content: entry.content,
      mood: entry.mood,
      tags: entry.tags ? entry.tags.join(', ') : '',
      attachments: [],
      existingAttachments: entry.attachments || []
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setForm({ date: new Date().toISOString().split('T')[0], content: '', mood: 'neutral', tags: '', attachments: [], existingAttachments: [] });
    setEditingEntry(null);
    setShowModal(false);
  };

  const getMoodObj = (val) => moods.find(m => m.value === val) || moods[2];

  return (
    <div className="diary-page">
      <div className="page-header">
        <div>
          <h1>Diary</h1>
          <p className="subtitle">Track your thoughts and moods</p>
        </div>
        <button className="btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          <HiOutlinePlus /> New Entry
        </button>
      </div>

      {/* Mood Filter */}
      <div className="mood-filter-bar">
        <button className={`mood-filter-btn ${filterMood === '' ? 'active' : ''}`} onClick={() => setFilterMood('')}>All</button>
        {moods.map(m => (
          <button
            key={m.value}
            className={`mood-filter-btn ${filterMood === m.value ? 'active' : ''}`}
            onClick={() => setFilterMood(m.value)}
            style={filterMood === m.value ? { borderColor: m.color, color: m.color } : {}}
          >
            {m.emoji} {m.label}
          </button>
        ))}
      </div>

      {/* Entries */}
      {loading ? (
        <div className="card-grid">{[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 200 }} />)}</div>
      ) : entries.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📖</div>
          <h3>No diary entries yet</h3>
          <p>Start journaling to track your mood and thoughts</p>
        </div>
      ) : (
        <div className="diary-entries">
          {entries.map((entry, idx) => {
            const moodObj = getMoodObj(entry.mood);
            return (
              <div key={entry._id} className="diary-card glass-card" style={{ animationDelay: `${idx * 0.06}s` }}>
                <div className="diary-card-header">
                  <div className="diary-date-badge">
                    <span className="diary-day">{new Date(entry.date).getDate()}</span>
                    <span className="diary-month">{new Date(entry.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                  </div>
                  <div className="diary-mood-badge" style={{ background: `${moodObj.color}15`, borderColor: `${moodObj.color}30`, color: moodObj.color }}>
                    <span className="mood-emoji-lg">{moodObj.emoji}</span>
                    <span>{moodObj.label}</span>
                  </div>
                </div>
                <div className="diary-card-content">
                  <p>{entry.content}</p>
                </div>
                {entry.attachments && entry.attachments.length > 0 && (
                  <div className="diary-attachments-preview">
                    {entry.attachments.map((url, i) => {
                      const fullUrl = `${API_HOST}${url}`;
                      if (url.match(/\.(jpeg|jpg|gif|png|webp)$/i)) return <img key={i} src={fullUrl} alt="attachment" className="attachment-img" />;
                      if (url.match(/\.(mp4|webm)$/i)) return <video key={i} src={fullUrl} controls className="attachment-video" />;
                      if (url.match(/\.(mp3|wav|ogg)$/i)) return <audio key={i} src={fullUrl} controls className="attachment-audio" />;
                      return <a key={i} href={fullUrl} target="_blank" rel="noreferrer" className="attachment-link">Attachment {i+1}</a>;
                    })}
                  </div>
                )}
                {entry.tags && entry.tags.length > 0 && (
                  <div className="diary-tags">
                    {entry.tags.map((tag, i) => <span key={i} className="diary-tag">#{tag}</span>)}
                  </div>
                )}
                <div className="diary-card-footer">
                  <span className="diary-time">
                    {new Date(entry.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <div className="diary-card-actions">
                    <button className="btn-icon" onClick={() => startEditing(entry)}><HiOutlinePencil /></button>
                    <button className="btn-icon" onClick={() => handleDelete(entry._id)}><HiOutlineTrash /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && resetForm()}>
          <div className="modal-content">
            <h2>{editingEntry ? 'Edit Entry' : 'New Diary Entry'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Date</label>
                <input type="date" value={form.date} onChange={(e) => setForm(prev => ({ ...prev, date: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>How are you feeling?</label>
                <div className="mood-selector">
                  {moods.map(m => (
                    <button
                      key={m.value}
                      type="button"
                      className={`mood-option ${form.mood === m.value ? 'selected' : ''}`}
                      onClick={() => setForm(prev => ({ ...prev, mood: m.value }))}
                      style={form.mood === m.value ? { borderColor: m.color, background: `${m.color}15` } : {}}
                    >
                      <span className="mood-emoji-select">{m.emoji}</span>
                      <span className="mood-label-select">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>What's on your mind?</label>
                <textarea
                  placeholder="Write your thoughts..."
                  value={form.content}
                  onChange={(e) => setForm(prev => ({ ...prev, content: e.target.value }))}
                  rows={6}
                  autoFocus
                />
              </div>
              <div className="form-group document-attachments">
                <label>Attachments (Images, Audio, Video)</label>
                <div className="attachment-input-wrapper">
                  <input
                    type="file"
                    id="file-upload"
                    multiple
                    accept="image/*,audio/*,video/*"
                    onChange={(e) => setForm(prev => ({ ...prev, attachments: [...prev.attachments, ...Array.from(e.target.files)] }))}
                  />
                  <label htmlFor="file-upload" className="file-upload-btn">
                    <HiOutlinePaperClip /> Select Files
                  </label>
                  
                  {form.attachments.length > 0 && (
                    <span className="upload-count">{form.attachments.length} file(s) selected</span>
                  )}
                </div>
              </div>
              <div className="form-group">
                <label>Tags (comma separated)</label>
                <input type="text" placeholder="e.g. gratitude, work, family" value={form.tags} onChange={(e) => setForm(prev => ({ ...prev, tags: e.target.value }))} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={resetForm}><HiOutlineX /> Cancel</button>
                <button type="submit" className="btn-primary">
                  {editingEntry ? <><HiOutlinePencil /> Update</> : <><HiOutlinePlus /> Save Entry</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
