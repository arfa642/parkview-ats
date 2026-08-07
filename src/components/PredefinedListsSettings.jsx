import React, { useState, useEffect } from 'react';
import { MdAdd, MdDelete, MdRefresh, MdCheckCircle, MdCategory, MdBusiness, MdLocationOn, MdBadge } from 'react-icons/md';

const DEFAULT_LISTS = {
  categories: ['Laptop', 'Desktop', 'Monitor', 'Mobile', 'Printer', 'UPS', 'Network Device', 'Mouse', 'Keyboard', 'Access Card', 'Headset'],
  departments: ['IT', 'HR', 'Finance', 'Operations', 'Sales', 'Marketing', 'Logistics', 'Executive', 'Administration', 'Procurement'],
  locations: ['Head Office', 'Site A', 'Site B', 'Regional Office', 'Warehouse', 'Remote'],
  designations: ['Software Engineer', 'System Administrator', 'HR Manager', 'Finance Manager', 'Operations Lead', 'Executive Assistant', 'IT Specialist', 'Director']
};

export default function PredefinedListsSettings() {
  const [lists, setLists] = useState(() => {
    const saved = localStorage.getItem('pv_ats_predefined_lists');
    return saved ? JSON.parse(saved) : DEFAULT_LISTS;
  });

  const [activeCategory, setActiveCategory] = useState('categories');
  const [newItemText, setNewItemText] = useState('');
  const [notification, setNotification] = useState('');

  useEffect(() => {
    localStorage.setItem('pv_ats_predefined_lists', JSON.stringify(lists));
  }, [lists]);

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3000);
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    const trimmed = newItemText.trim();
    if (!trimmed) return;

    if (lists[activeCategory].some(item => item.toLowerCase() === trimmed.toLowerCase())) {
      showNotification(`"${trimmed}" already exists in ${activeCategory}.`);
      return;
    }

    setLists(prev => ({
      ...prev,
      [activeCategory]: [...prev[activeCategory], trimmed]
    }));
    setNewItemText('');
    showNotification(`Added "${trimmed}" to ${activeCategory}.`);
  };

  const handleRemoveItem = (itemToRemove) => {
    setLists(prev => ({
      ...prev,
      [activeCategory]: prev[activeCategory].filter(item => item !== itemToRemove)
    }));
    showNotification(`Removed "${itemToRemove}".`);
  };

  const handleResetDefaults = () => {
    if (window.confirm(`Reset ${activeCategory} back to default list?`)) {
      setLists(prev => ({
        ...prev,
        [activeCategory]: [...DEFAULT_LISTS[activeCategory]]
      }));
      showNotification(`Reset ${activeCategory} to default options.`);
    }
  };

  const tabs = [
    { key: 'categories', label: 'Asset Categories', icon: <MdCategory size={20} />, color: '#3b82f6' },
    { key: 'departments', label: 'Employee Departments', icon: <MdBusiness size={20} />, color: '#10b981' },
    { key: 'locations', label: 'Locations / Sites', icon: <MdLocationOn size={20} />, color: '#f59e0b' },
    { key: 'designations', label: 'Job Designations', icon: <MdBadge size={20} />, color: '#a855f7' }
  ];

  return (
    <div style={{ padding: '0.5rem 0' }}>
      <style>{`
        .list-tab-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          border-radius: 10px;
          border: 1px solid var(--border-color);
          background-color: var(--bg-color);
          color: var(--text-secondary);
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .list-tab-btn.active {
          background-color: var(--accent-color);
          color: #000;
          border-color: var(--accent-color);
          box-shadow: 0 4px 12px rgba(212, 175, 55, 0.2);
        }
        .item-tag {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.875rem;
          background-color: var(--bg-color);
          border: 1px solid var(--border-color);
          border-radius: 20px;
          color: var(--text-primary);
          font-weight: 500;
          font-size: 0.95rem;
          transition: all 0.2s ease;
        }
        .item-tag:hover {
          border-color: var(--accent-color);
        }
        .remove-btn {
          background: none;
          border: none;
          color: #ef4444;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2px;
          border-radius: 50%;
          transition: background 0.2s;
        }
        .remove-btn:hover {
          background-color: rgba(239, 68, 68, 0.15);
        }
      `}</style>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {tabs.map(t => (
          <button
            key={t.key}
            type="button"
            className={`list-tab-btn ${activeCategory === t.key ? 'active' : ''}`}
            onClick={() => setActiveCategory(t.key)}
          >
            {t.icon}
            {t.label} ({lists[t.key].length})
          </button>
        ))}
      </div>

      {notification && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', marginBottom: '1.25rem', fontWeight: '600' }}>
          <MdCheckCircle size={20} />
          <span>{notification}</span>
        </div>
      )}

      {/* Add New Item Input */}
      <form onSubmit={handleAddItem} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <input
          type="text"
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          placeholder={`Add new ${activeCategory.slice(0, -1)}...`}
          style={{ flex: 1, padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif' }}
        />
        <button
          type="submit"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', backgroundColor: 'var(--accent-color)', color: '#000', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
        >
          <MdAdd size={20} />
          Add Item
        </button>
        <button
          type="button"
          onClick={handleResetDefaults}
          title="Reset to defaults"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
        >
          <MdRefresh size={20} />
          Reset Defaults
        </button>
      </form>

      {/* Tags Grid */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', padding: '1rem', minHeight: '120px', backgroundColor: 'var(--bg-color)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        {lists[activeCategory].length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', margin: 'auto' }}>No items in this list. Add one above.</p>
        ) : (
          lists[activeCategory].map(item => (
            <div key={item} className="item-tag">
              <span>{item}</span>
              <button
                type="button"
                className="remove-btn"
                onClick={() => handleRemoveItem(item)}
                title={`Delete ${item}`}
              >
                <MdDelete size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
