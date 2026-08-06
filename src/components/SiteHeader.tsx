import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import type { Category } from '../types';
import './SiteHeader.css';

interface SiteHeaderProps {
  name: string;
  categories: Category[];
}

export function SiteHeader({ name, categories }: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the mobile menu on any route change / resize back to desktop
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 900) setMenuOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <header className="site-header">
      <div className="container site-header__row">
        <Link to="/" className="site-header__brand" onClick={() => setMenuOpen(false)}>
          <span className="site-header__name">{name}</span>
        </Link>

        {/* Desktop nav — hover-driven, only shown at desktop widths */}
        <nav className="site-header__nav-desktop" aria-label="Primary">
          <NavLink to="/" end className="site-header__link">
            Home
          </NavLink>
          <NavLink to="/about" className="site-header__link">
            About
          </NavLink>
          {categories.map((cat) => (
            <NavLink key={cat.id} to={`/projects/${cat.slug}`} className="site-header__link">
              <span className="catalog-code">{cat.code}</span> {cat.name}
            </NavLink>
          ))}
        </nav>

        {/* Mobile trigger — only shown at mobile widths */}
        <button
          type="button"
          className="site-header__burger"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span className={`site-header__burger-line ${menuOpen ? 'is-open' : ''}`} />
          <span className={`site-header__burger-line ${menuOpen ? 'is-open' : ''}`} />
        </button>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            className="site-header__nav-mobile"
            aria-label="Primary"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            <NavLink to="/" end onClick={() => setMenuOpen(false)} className="site-header__link-mobile">
              Home
            </NavLink>
            <NavLink to="/about" onClick={() => setMenuOpen(false)} className="site-header__link-mobile">
              About
            </NavLink>
            {categories.map((cat) => (
              <NavLink
                key={cat.id}
                to={`/projects/${cat.slug}`}
                onClick={() => setMenuOpen(false)}
                className="site-header__link-mobile"
              >
                <span className="catalog-code">{cat.code}</span> {cat.name}
              </NavLink>
            ))}
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
