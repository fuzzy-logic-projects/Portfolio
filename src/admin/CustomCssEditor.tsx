import { useState } from 'react';
import { api } from '../lib/api';

export function CustomCssEditor({ initial, onSaved }: { initial: string; onSaved: () => void }) {
  const [css, setCss] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setStatus(null);
    try {
      await api.updateCustomCss(css);
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
        Optional. Anything here is injected into the site's stylesheet as-is, after everything else — it can
        override any style on the public pages. Leave blank to use the default look.
      </p>
      <textarea
        className="field-input"
        style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}
        rows={14}
        placeholder=".hero__headline { color: #ffffff; }"
        value={css}
        onChange={(e) => setCss(e.target.value)}
      />
      <div className="admin-panel__footer">
        <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        {status && <span className="admin-panel__status">{status}</span>}
      </div>
    </div>
  );
}
