import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ContentProvider, useContent } from './context/ContentContext';
import { SiteHeader } from './components/SiteHeader';
import { PageTransition } from './components/PageTransition';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import CategoryPage from './pages/CategoryPage';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';

function CustomCssInjector() {
  const { content } = useContent();

  useEffect(() => {
    const id = 'custom-overrides';
    let tag = document.getElementById(id) as HTMLStyleElement | null;
    if (!tag) {
      tag = document.createElement('style');
      tag.id = id;
      document.head.appendChild(tag);
    }
    tag.textContent = content?.customCss ?? '';
  }, [content?.customCss]);

  return null;
}

function AppShell() {
  const location = useLocation();
  const { content } = useContent();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <>
      <CustomCssInjector />
      {!isAdmin && (
        <SiteHeader
          name={content?.home.name ?? ''}
          categories={content?.categories ?? []}
          email={content?.home.email}
        />
      )}
      <AnimatePresence mode="wait" initial={false}>
        <PageTransition>
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/projects/:slug" element={<CategoryPage />} />
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </PageTransition>
      </AnimatePresence>
    </>
  );
}

export default function App() {
  return (
    <ContentProvider>
      <AppShell />
    </ContentProvider>
  );
}
