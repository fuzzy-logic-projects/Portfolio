import { useState } from 'react';
import type { Category } from '../types';
import { api } from '../lib/api';

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function CategoriesEditor({ initial, onSaved }: { initial: Category[]; onSaved: () => void }) {
  const [categories, setCategories] = useState<Category[]>(initial);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  function updateCategory(id: string, patch: Partial<Category>) {
    setCategories((cats) => cats.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  function addCategory() {
    setCategories((cats) => [...cats, { id: crypto.randomUUID(), code: '', name: '', slug: '' }]);
  }

  function removeCategory(id: string) {
    setCategories((cats) => cats.filter((c) => c.id !== id));
  }

  async function handleSave() {
    setSaving(true);
    setStatus(null);
    try {
      await api.updateCategories(categories);
      setStatus('Saved.');
      onSaved();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Could not save.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-panel">
      <p className="admin-panel__hint">
        The code shows up in nav links and entry numbers (e.g. "CW"). The slug is the URL path — keep it short, no
        spaces.
      </p>

      {categories.map((cat) => (
        <div key={cat.id} className="admin-category-row">
          <input
            className="field-input"
            placeholder="Code (e.g. CW)"
            value={cat.code}
            maxLength={4}
            onChange={(e) => updateCategory(cat.id, { code: e.target.value.toUpperCase() })}
          />
          <input
            className="field-input"
            placeholder="Name (e.g. Content writing)"
            value={cat.name}
            onChange={(e) =>
              updateCategory(cat.id, {
                name: e.target.value,
                slug: cat.slug || slugify(e.target.value),
              })
            }
          />
          <input
            className="field-input"
            placeholder="URL slug"
            value={cat.slug}
            onChange={(e) => updateCategory(cat.id, { slug: slugify(e.target.value) })}
          />
          <button type="button" className="btn admin-row-remove" onClick={() => removeCategory(cat.id)}>
            Remove
          </button>
        </div>
      ))}

      <button type="button" className="btn" onClick={addCategory}>
        + Add category
      </button>

      <div className="admin-panel__footer">
        <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        {status && <span className="admin-panel__status">{status}</span>}
      </div>
    </div>
  );
}
