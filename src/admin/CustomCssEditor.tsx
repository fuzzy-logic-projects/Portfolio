import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';

/** Marks the auto-generated color block inside the saved customCss string,
 * so it can be told apart from anything typed by hand and round-tripped
 * back into the color pickers next time this tab is opened. */
const THEME_START = '/* theme:start */';
const THEME_END = '/* theme:end */';

type ColorKey = 'background' | 'primary' | 'secondary' | 'accent' | 'bodyText' | 'textSecondary' | 'textMuted';

const DEFAULT_COLORS: Record<ColorKey, string> = {
  background: '#1c1c1c',
  primary: '#bfa181',
  secondary: '#d4c5b0',
  accent: '#f4f4f4',
  bodyText: '#e8e6e1',
  textSecondary: '#a8a29b',
  textMuted: '#706b63',
};

const CSS_VAR: Record<ColorKey, string> = {
  background: '--bg',
  primary: '--gold',
  secondary: '--beige',
  accent: '--accent-light',
  bodyText: '--text-primary',
  textSecondary: '--text-secondary',
  textMuted: '--text-muted',
};

const SWATCHES: { key: ColorKey; label: string; hint: string }[] = [
  { key: 'background', label: 'Background', hint: 'Page background' },
  { key: 'primary', label: 'Primary', hint: 'Gold accents, buttons, links' },
  { key: 'secondary', label: 'Secondary', hint: 'Warm beige accents' },
  { key: 'accent', label: 'Accent', hint: 'Headings, brand name' },
  { key: 'bodyText', label: 'Body text', hint: 'Main paragraph text' },
];

/** Every text color on the site beyond the main body copy above — split out
 * so each one is individually pickable instead of only the single "Body
 * text" swatch. */
const TEXT_SWATCHES: { key: ColorKey; label: string; hint: string }[] = [
  { key: 'textSecondary', label: 'Secondary text', hint: 'Nav links, bio text, card meta' },
  { key: 'textMuted', label: 'Muted text', hint: 'Eyebrows, labels, least prominent text' },
];

function buildThemeBlock(colors: Record<ColorKey, string>): string {
  const lines = (Object.keys(CSS_VAR) as ColorKey[]).map((key) => `  ${CSS_VAR[key]}: ${colors[key]};`);
  return `${THEME_START}\n:root {\n${lines.join('\n')}\n}\n${THEME_END}`;
}

function parseInitial(initial: string): { colors: Record<ColorKey, string>; otherCss: string; dirty: boolean } {
  const startIdx = initial.indexOf(THEME_START);
  const endIdx = initial.indexOf(THEME_END);
  if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
    return { colors: { ...DEFAULT_COLORS }, otherCss: initial, dirty: false };
  }
  const block = initial.slice(startIdx, endIdx + THEME_END.length);
  const colors = { ...DEFAULT_COLORS };
  (Object.keys(CSS_VAR) as ColorKey[]).forEach((key) => {
    const match = block.match(new RegExp(`${CSS_VAR[key]}\\s*:\\s*(#[0-9a-fA-F]{6})`));
    if (match) colors[key] = match[1];
  });
  const otherCss = (initial.slice(0, startIdx) + initial.slice(endIdx + THEME_END.length)).trim();
  return { colors, otherCss, dirty: true };
}

export function CustomCssEditor({ initial, onSaved }: { initial: string; onSaved: () => void }) {
  const parsedInitial = useMemo(() => parseInitial(initial), [initial]);
  const [colors, setColors] = useState<Record<ColorKey, string>>(parsedInitial.colors);
  const [otherCss, setOtherCss] = useState(parsedInitial.otherCss);
  const [themeDirty, setThemeDirty] = useState(parsedInitial.dirty);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  // Live preview: while this tab is open, push the current picker values
  // into a style tag that sits after the saved one, so the whole dashboard
  // (which shares the same color variables as the public site) instantly
  // reflects whatever's currently picked — without touching the saved copy
  // until "Save changes" is actually pressed.
  useEffect(() => {
    const id = 'theme-preview-draft';
    let tag = document.getElementById(id) as HTMLStyleElement | null;
    if (!tag) {
      tag = document.createElement('style');
      tag.id = id;
      document.head.appendChild(tag);
    }
    const decls = (Object.keys(CSS_VAR) as ColorKey[]).map((key) => `${CSS_VAR[key]}: ${colors[key]};`).join(' ');
    tag.textContent = `:root { ${decls} }`;

    return () => {
      document.getElementById(id)?.remove();
    };
  }, [colors]);

  function handleColorChange(key: ColorKey, value: string) {
    setThemeDirty(true);
    setColors((prev) => ({ ...prev, [key]: value }));
  }

  function handleResetColors() {
    setThemeDirty(true);
    setColors({ ...DEFAULT_COLORS });
  }

  async function handleSave() {
    setSaving(true);
    setStatus(null);
    try {
      const finalCss = themeDirty ? `${buildThemeBlock(colors)}\n\n${otherCss}`.trim() : otherCss;
      await api.updateCustomCss(finalCss);
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
      <div className="admin-panel__subsection admin-panel__subsection--first">
        <span className="field-label admin-panel__subsection-label">Live preview</span>
        <p className="admin-panel__hint">
          A rough mockup of the public site using whatever's currently picked below — nothing here is saved until
          you press "Save changes."
        </p>
        <div className="theme-preview">
          <span className="theme-preview__eyebrow">Index — Preview</span>
          <h2 className="theme-preview__heading">Nikhil — Portfolio</h2>
          <p className="theme-preview__body">
            Body text looks like this across the site — project descriptions, the bio, and page copy.
          </p>
          <p className="theme-preview__secondary">Secondary text — nav links, captions, card meta.</p>
          <div className="theme-preview__card">
            <span className="theme-preview__card-eyebrow">WA-01</span>
            <span className="theme-preview__card-title">Sample project</span>
            <span className="theme-preview__card-meta">Web App · 2026</span>
          </div>
          <div className="theme-preview__actions">
            <span className="theme-preview__link">A link ↗</span>
            <button type="button" className="btn btn-primary theme-preview__btn" tabIndex={-1}>
              Get in touch
            </button>
          </div>
        </div>
      </div>

      <div className="admin-panel__subsection">
        <div className="admin-panel__subsection-header">
          <span className="field-label admin-panel__subsection-label">Theme colors</span>
          <button type="button" className="btn" onClick={handleResetColors}>
            Reset to defaults
          </button>
        </div>
        <p className="admin-panel__hint">
          Pick the site's core colors. This dashboard shares the same color system as the public pages, so you'll
          see the change here immediately as you pick — nothing is saved until you press "Save changes" below.
        </p>
        <div className="admin-color-grid">
          {SWATCHES.map(({ key, label, hint }) => (
            <label key={key} className="admin-color-swatch">
              <input
                type="color"
                value={colors[key]}
                onChange={(e) => handleColorChange(key, e.target.value)}
                aria-label={label}
              />
              <span className="admin-color-swatch__text">
                <span className="admin-color-swatch__label">{label}</span>
                <span className="admin-color-swatch__hint">{hint}</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="admin-panel__subsection">
        <span className="field-label admin-panel__subsection-label">Text colors</span>
        <p className="admin-panel__hint">
          Body text above covers most paragraph copy. These cover the rest of the text roles on the site.
        </p>
        <div className="admin-color-grid">
          {TEXT_SWATCHES.map(({ key, label, hint }) => (
            <label key={key} className="admin-color-swatch">
              <input
                type="color"
                value={colors[key]}
                onChange={(e) => handleColorChange(key, e.target.value)}
                aria-label={label}
              />
              <span className="admin-color-swatch__text">
                <span className="admin-color-swatch__label">{label}</span>
                <span className="admin-color-swatch__hint">{hint}</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="admin-panel__subsection">
        <span className="field-label admin-panel__subsection-label">Other CSS (optional)</span>
        <p className="admin-panel__hint">
          Anything here is injected into the site's stylesheet as-is, after everything else — it can override any
          style on the public pages, including the colors above. Leave blank if you don't need it.
        </p>
        <textarea
          className="field-input"
          style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}
          rows={12}
          placeholder=".hero__headline { color: #ffffff; }"
          value={otherCss}
          onChange={(e) => setOtherCss(e.target.value)}
        />
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
