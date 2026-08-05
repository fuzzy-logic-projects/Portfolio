import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContent } from '../context/ContentContext';
import { api } from '../lib/api';
import { HomeEditor } from '../admin/HomeEditor';
import { CategoriesEditor } from '../admin/CategoriesEditor';
import { ProjectsEditor } from '../admin/ProjectsEditor';
import { CustomCssEditor } from '../admin/CustomCssEditor';
import './AdminDashboard.css';

type Tab = 'home' | 'categories' | 'projects' | 'css';

const TABS: { id: Tab; label: string }[] = [
  { id: 'home', label: 'Home content' },
  { id: 'categories', label: 'Categories' },
  { id: 'projects', label: 'Projects' },
  { id: 'css', label: 'Custom CSS' },
];

export default function AdminDashboard() {
  const { content, loading, refresh } = useContent();
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState<Tab>('home');
  const navigate = useNavigate();

  useEffect(() => {
    api
      .checkSession()
      .then((res) => {
        if (!res.authenticated) navigate('/admin', { replace: true });
      })
      .finally(() => setChecking(false));
  }, [navigate]);

  async function handleLogout() {
    await api.logout();
    navigate('/admin', { replace: true });
  }

  if (checking || loading || !content) return null;

  return (
    <div className="admin-dashboard">
      <div className="container admin-dashboard__row">
        <div>
          <span className="eyebrow">Admin</span>
          <h1 className="admin-dashboard__title">Dashboard</h1>
        </div>
        <button type="button" className="btn" onClick={handleLogout}>
          Sign out
        </button>
      </div>

      <div className="container admin-dashboard__tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`admin-dashboard__tab ${tab === t.id ? 'is-active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="container admin-dashboard__content">
        {tab === 'home' && <HomeEditor initial={content.home} onSaved={refresh} />}
        {tab === 'categories' && <CategoriesEditor initial={content.categories} onSaved={refresh} />}
        {tab === 'projects' && (
          <ProjectsEditor initial={content.projects} categories={content.categories} onSaved={refresh} />
        )}
        {tab === 'css' && <CustomCssEditor initial={content.customCss} onSaved={refresh} />}
      </div>
    </div>
  );
}
