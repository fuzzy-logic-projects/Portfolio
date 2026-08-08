import { useState } from 'react';
import type { Category, Project } from '../types';
import { api } from '../lib/api';

export function ProjectsEditor({
  initial,
  categories,
  onSaved,
}: {
  initial: Project[];
  categories: Category[];
  onSaved: () => void;
}) {
  const [projects, setProjects] = useState<Project[]>(initial);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  function updateProject(id: string, patch: Partial<Project>) {
    setProjects((ps) => ps.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  function addProject() {
    setProjects((ps) => [
      ...ps,
      {
        id: crypto.randomUUID(),
        categoryId: categories[0]?.id ?? '',
        title: '',
        summary: '',
        description: '',
        link: '',
        date: '',
        files: [],
        articleType: '',
      },
    ]);
  }

  function removeProject(id: string) {
    setProjects((ps) => ps.filter((p) => p.id !== id));
  }

  function removeFile(projectId: string, url: string) {
    setProjects((ps) =>
      ps.map((p) => (p.id === projectId ? { ...p, files: p.files.filter((f) => f.url !== url) } : p)),
    );
  }

  async function handleFileUpload(projectId: string, fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    setUploadingId(projectId);
    setStatus(null);
    try {
      const { url } = await api.uploadFile(file);
      setProjects((ps) =>
        ps.map((p) => (p.id === projectId ? { ...p, files: [...p.files, { name: file.name, url }] } : p)),
      );
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploadingId(null);
    }
  }

  async function handleSave() {
    setSaving(true);
    setStatus(null);
    try {
      await api.updateProjects(projects);
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
      {categories.length === 0 && (
        <p className="admin-panel__hint">Add at least one category first, on the Categories tab.</p>
      )}

      {projects.map((project) => (
        <div key={project.id} className="admin-project-card">
          <div className="admin-grid-2">
            <div>
              <label className="field-label">Title</label>
              <input
                className="field-input"
                value={project.title}
                onChange={(e) => updateProject(project.id, { title: e.target.value })}
              />
            </div>
            <div>
              <label className="field-label">Category</label>
              <select
                className="field-input"
                value={project.categoryId}
                onChange={(e) => updateProject(project.id, { categoryId: e.target.value })}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="field-label">Summary (shown collapsed)</label>
            <input
              className="field-input"
              value={project.summary}
              onChange={(e) => updateProject(project.id, { summary: e.target.value })}
            />
          </div>

          <div>
            <label className="field-label">Full description</label>
            <textarea
              className="field-input"
              rows={3}
              value={project.description}
              onChange={(e) => updateProject(project.id, { description: e.target.value })}
            />
          </div>

          <div className="admin-grid-2">
            <div>
              <label className="field-label">External link (optional)</label>
              <input
                className="field-input"
                placeholder="https://…"
                value={project.link}
                onChange={(e) => updateProject(project.id, { link: e.target.value })}
              />
            </div>
            <div>
              <label className="field-label">Date (optional)</label>
              <input
                className="field-input"
                placeholder="e.g. 2026"
                value={project.date}
                onChange={(e) => updateProject(project.id, { date: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="field-label">Article type (optional — content writing only)</label>
            <input
              className="field-input"
              placeholder="e.g. SEO Article, Essay, News"
              value={project.articleType ?? ''}
              onChange={(e) => updateProject(project.id, { articleType: e.target.value })}
            />
          </div>

          <div>
            <label className="field-label">Files</label>
            {project.files.length > 0 && (
              <ul className="admin-file-list">
                {project.files.map((f) => (
                  <li key={f.url}>
                    <span>{f.name}</span>
                    <button type="button" className="admin-file-remove" onClick={() => removeFile(project.id, f.url)}>
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <input
              type="file"
              onChange={(e) => handleFileUpload(project.id, e.target.files)}
              disabled={uploadingId === project.id}
            />
            {uploadingId === project.id && <span className="admin-panel__hint">Uploading…</span>}
          </div>

          <button type="button" className="btn admin-row-remove" onClick={() => removeProject(project.id)}>
            Remove project
          </button>
        </div>
      ))}

      <button type="button" className="btn" onClick={addProject} disabled={categories.length === 0}>
        + Add project
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
