import { useState } from 'react';
import type { EducationEntry, HomeContent } from '../types';
import { api } from '../lib/api';

export function HomeEditor({ initial, onSaved }: { initial: HomeContent; onSaved: () => void }) {
  const [form, setForm] = useState<HomeContent>({ ...initial, about: initial.about ?? '' });
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  function updateField<K extends keyof HomeContent>(key: K, value: HomeContent[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function updateEducation(id: string, patch: Partial<EducationEntry>) {
    setForm((f) => ({
      ...f,
      education: f.education.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    }));
  }

  function addEducation() {
    setForm((f) => ({
      ...f,
      education: [...f.education, { id: crypto.randomUUID(), qualification: '', institution: '', years: '' }],
    }));
  }

  function removeEducation(id: string) {
    setForm((f) => ({ ...f, education: f.education.filter((e) => e.id !== id) }));
  }

  async function handleSave() {
    setSaving(true);
    setStatus(null);
    try {
      await api.updateHome(form);
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
      <div className="admin-grid-2">
        <div>
          <label className="field-label" htmlFor="name">
            Name
          </label>
          <input
            id="name"
            className="field-input"
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
          />
        </div>
        <div>
          <label className="field-label" htmlFor="role">
            Role / status line
          </label>
          <input
            id="role"
            className="field-input"
            placeholder="e.g. Open to writing and dev work"
            value={form.role}
            onChange={(e) => updateField('role', e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="field-label" htmlFor="tagline">
          Headline
        </label>
        <input
          id="tagline"
          className="field-input"
          placeholder="The big line at the top of your homepage"
          value={form.tagline}
          onChange={(e) => updateField('tagline', e.target.value)}
        />
      </div>

      <div>
        <label className="field-label" htmlFor="bio">
          Bio
        </label>
        <textarea
          id="bio"
          className="field-input"
          rows={4}
          value={form.bio}
          onChange={(e) => updateField('bio', e.target.value)}
        />
        <p className="admin-panel__hint">
          Markdown supported — **bold**, *italic*, and line breaks are preserved.
        </p>
      </div>

      <div>
        <label className="field-label" htmlFor="about">
          About (Markdown)
        </label>
        <textarea
          id="about"
          className="field-input"
          rows={12}
          placeholder={'# A bit about me\n\nWrite as much as you like — headings, **bold**, *italic*, lists, links.'}
          value={form.about}
          onChange={(e) => updateField('about', e.target.value)}
        />
        <p className="admin-panel__hint">
          Shown on the About page, linked from the nav. Supports Markdown: # headings, **bold**,
          *italic*, lists, links. A blank line starts a new block; a single line break is kept as-is.
        </p>
      </div>

      <div>
        <label className="field-label" htmlFor="email">
          Contact email
        </label>
        <input
          id="email"
          className="field-input"
          type="email"
          value={form.email}
          onChange={(e) => updateField('email', e.target.value)}
        />
      </div>

      <div className="admin-panel__subsection">
        <div className="admin-panel__subsection-header">
          <span className="field-label" style={{ marginBottom: 0 }}>
            Education
          </span>
          <button type="button" className="btn" onClick={addEducation}>
            + Add entry
          </button>
        </div>

        {form.education.map((entry) => (
          <div key={entry.id} className="admin-education-row">
            <input
              className="field-input"
              placeholder="Years, e.g. 2023–27"
              value={entry.years}
              onChange={(e) => updateEducation(entry.id, { years: e.target.value })}
            />
            <input
              className="field-input"
              placeholder="Qualification"
              value={entry.qualification}
              onChange={(e) => updateEducation(entry.id, { qualification: e.target.value })}
            />
            <input
              className="field-input"
              placeholder="Institution"
              value={entry.institution}
              onChange={(e) => updateEducation(entry.id, { institution: e.target.value })}
            />
            <button type="button" className="btn admin-row-remove" onClick={() => removeEducation(entry.id)}>
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="admin-panel__footer">
        <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        {status && <span className="admin-panel__status">{status}</span>}
      </div>
    </div>
  );
}
