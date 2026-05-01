import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { 
  HiOutlinePlus, 
  HiOutlineTrash, 
  HiOutlinePencil,
  HiOutlineColorSwatch,
  HiOutlineCheck,
  HiOutlineX
} from 'react-icons/hi';
import { BsPinFill, BsPin } from 'react-icons/bs';
import { noteAPI } from '../api';
import './Notes.css';

const NOTE_COLORS = [
  '#1a1a2e', // Default dark
  '#2a0a2a', // Purple tint
  '#0a2a2a', // Teal tint
  '#2a2a0a', // Yellow tint
  '#2a0a0a', // Red tint
  '#0a1a2a'  // Blue tint
];

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    color: '#1a1a2e',
    isPinned: false
  });

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const response = await noteAPI.getAll();
      setNotes(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast.error('Failed to load notes');
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      color: '#1a1a2e',
      isPinned: false
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (note) => {
    setFormData({
      title: note.title,
      content: note.content,
      color: note.color,
      isPinned: note.isPinned
    });
    setEditingId(note._id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    try {
      if (editingId) {
        const res = await noteAPI.update(editingId, formData);
        setNotes(notes.map(n => n._id === editingId ? res.data : n).sort((a,b) => b.isPinned - a.isPinned));
        toast.success('Note updated');
      } else {
        const res = await noteAPI.create(formData);
        setNotes([res.data, ...notes].sort((a,b) => b.isPinned - a.isPinned));
        toast.success('Note added');
      }
      resetForm();
    } catch (error) {
      toast.error('Error saving note');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        await noteAPI.delete(id);
        setNotes(notes.filter(n => n._id !== id));
        toast.success('Note deleted');
      } catch (error) {
        toast.error('Failed to delete note');
      }
    }
  };

  const togglePin = async (note) => {
    try {
      const res = await noteAPI.update(note._id, { isPinned: !note.isPinned });
      setNotes(notes.map(n => n._id === note._id ? res.data : n).sort((a, b) => b.isPinned - a.isPinned));
    } catch (error) {
      toast.error('Failed to update pin status');
    }
  };

  if (loading) {
    return <div className="loading-state">Loading notes...</div>;
  }

  const pinnedNotes = notes.filter(n => n.isPinned);
  const otherNotes = notes.filter(n => !n.isPinned);

  return (
    <div className="notes-page fade-in">
      <div className="notes-header">
        <div>
          <h1>Notes</h1>
          <p className="subtitle">Capture your thoughts and important information</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <HiOutlinePlus /> New Note
        </button>
      </div>

      {showForm && (
        <div className="note-form-modal fade-in">
          <div className="note-form-container glass-panel">
            <div className="modal-header">
              <h2>{editingId ? 'Edit Note' : 'Create Note'}</h2>
              <button className="icon-btn" onClick={resetForm}>
                <HiOutlineX />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="note-form">
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Title"
                  className="note-title-input"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  autoFocus
                />
              </div>
              
              <div className="form-group">
                <textarea
                  placeholder="Write your note here..."
                  className="note-content-input"
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  rows={8}
                ></textarea>
              </div>

              <div className="form-actions">
                <div className="color-picker">
                  <HiOutlineColorSwatch className="color-icon" />
                  {NOTE_COLORS.map(c => (
                    <div 
                      key={c}
                      className={`color-choice ${formData.color === c ? 'active' : ''}`}
                      style={{ backgroundColor: c }}
                      onClick={() => setFormData({...formData, color: c})}
                    />
                  ))}
                </div>
                
                <div className="action-buttons">
                  <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel</button>
                  <button type="submit" className="btn btn-primary">
                    <HiOutlineCheck /> {editingId ? 'Update' : 'Save'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {notes.length === 0 ? (
        <div className="empty-state glass-panel">
          <div className="empty-icon">📝</div>
          <h2>No notes yet</h2>
          <p>Create your first note to start capturing your thoughts.</p>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <HiOutlinePlus /> Create Note
          </button>
        </div>
      ) : (
        <div className="notes-container">
          {pinnedNotes.length > 0 && (
            <div className="notes-section">
              <h3 className="section-title">Pinned</h3>
              <div className="notes-grid">
                {pinnedNotes.map(note => (
                  <NoteCard 
                    key={note._id} 
                    note={note} 
                    onEdit={handleEdit} 
                    onDelete={handleDelete} 
                    onPin={togglePin} 
                  />
                ))}
              </div>
            </div>
          )}

          {otherNotes.length > 0 && (
            <div className="notes-section">
              {pinnedNotes.length > 0 && <h3 className="section-title">Others</h3>}
              <div className="notes-grid">
                {otherNotes.map(note => (
                  <NoteCard 
                    key={note._id} 
                    note={note} 
                    onEdit={handleEdit} 
                    onDelete={handleDelete} 
                    onPin={togglePin} 
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function NoteCard({ note, onEdit, onDelete, onPin }) {
  return (
    <div className="note-card glass-panel" style={{ backgroundColor: note.color }}>
      <div className="note-card-header">
        <h3 className="note-title">{note.title}</h3>
        <button 
          className={`pin-btn ${note.isPinned ? 'active' : ''}`} 
          onClick={() => onPin(note)}
          title={note.isPinned ? "Unpin" : "Pin"}
        >
          {note.isPinned ? <BsPinFill /> : <BsPin />}
        </button>
      </div>
      <div className="note-content">
        {note.content.split('\n').map((line, i) => (
          <span key={i}>
            {line}
            <br />
          </span>
        ))}
      </div>
      <div className="note-footer">
        <span className="note-date">
          {new Date(note.updatedAt || note.createdAt).toLocaleDateString(undefined, { 
            month: 'short', day: 'numeric', year: 'numeric' 
          })}
        </span>
        <div className="note-actions">
          <button className="icon-btn" onClick={() => onEdit(note)}>
            <HiOutlinePencil />
          </button>
          <button className="icon-btn delete-btn" onClick={() => onDelete(note._id)}>
            <HiOutlineTrash />
          </button>
        </div>
      </div>
    </div>
  );
}
