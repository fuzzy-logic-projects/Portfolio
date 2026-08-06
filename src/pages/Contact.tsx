import { useState, type FormEvent } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { api } from '../lib/api';
import './Contact.css';

const sectionTransition = { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const };
const hiddenSection = { opacity: 0, y: 24 };

export default function Contact() {
  const reduce = useReducedMotion();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [company, setCompany] = useState(''); // honeypot — kept empty by real visitors
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.sendContact({ name, email, message, company });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container contact-page">
      <div className="contact-page__inner">
        <motion.h1
          className="contact-page__headline"
          initial={reduce ? undefined : hiddenSection}
          animate={{ opacity: 1, y: 0 }}
          transition={sectionTransition}
        >
          Get in touch
        </motion.h1>

        <motion.div
          initial={reduce ? undefined : hiddenSection}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...sectionTransition, delay: reduce ? 0 : 0.1 }}
        >
          {sent ? (
            <p className="contact-page__success">
              Thanks — your message is on its way. I'll get back to you soon.
            </p>
          ) : (
            <form className="contact-page__form" onSubmit={handleSubmit} noValidate>
              <div>
                <label className="field-label" htmlFor="name">
                  Name
                </label>
                <input
                  id="name"
                  className="field-input"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="field-label" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  className="field-input"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="field-label" htmlFor="message">
                  Message
                </label>
                <textarea
                  id="message"
                  className="field-input"
                  rows={6}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />
              </div>

              {/* Honeypot: invisible to real visitors, bots fill every input they find */}
              <input
                type="text"
                name="company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                className="contact-page__honeypot"
                aria-hidden="true"
              />

              {error && <p className="contact-page__error">{error}</p>}

              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Sending…' : 'Send message'}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}
