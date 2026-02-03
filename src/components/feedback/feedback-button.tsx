'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { submitFeedback, type FeedbackResult } from '@/lib/actions/feedback';

type FormState = 'idle' | 'submitting' | 'success' | 'error';

export function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [formState, setFormState] = useState<FormState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [issueUrl, setIssueUrl] = useState('');

  // Form fields
  const [type, setType] = useState<'bug' | 'feature'>('bug');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  function resetForm() {
    setType('bug');
    setTitle('');
    setDescription('');
    setFormState('idle');
    setErrorMessage('');
    setIssueUrl('');
  }

  function handleClose() {
    setIsOpen(false);
    // Reset after close animation
    setTimeout(resetForm, 200);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormState('submitting');
    setErrorMessage('');

    const result: FeedbackResult = await submitFeedback({
      type,
      title,
      description,
      currentUrl: window.location.href,
      browserInfo: navigator.userAgent,
    });

    if (result.success) {
      setFormState('success');
      setIssueUrl(result.issueUrl);
    } else {
      setFormState('error');
      setErrorMessage(result.error);
    }
  }

  return (
    <>
      {/* Floating Action Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-4 sm:bottom-6 sm:right-6
          w-12 h-12 rounded-full bg-black dark:bg-white text-white dark:text-black
          shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200
          flex items-center justify-center z-50"
        aria-label="Feedback geben"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </button>

      {/* Feedback Modal */}
      <Modal isOpen={isOpen} onClose={handleClose} title="Feedback geben">
        {formState === 'success' ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-gray-900 dark:text-white font-medium mb-1">
              Vielen Dank!
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Ihr Feedback wurde erfolgreich übermittelt.
            </p>
            {issueUrl && (
              <a
                href={issueUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Issue auf GitHub ansehen
              </a>
            )}
            <div className="mt-4">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium rounded-lg
                  bg-gray-900 dark:bg-white text-white dark:text-gray-900
                  hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
              >
                Schliessen
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type Select */}
            <div>
              <label htmlFor="feedback-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Typ
              </label>
              <select
                id="feedback-type"
                value={type}
                onChange={(e) => setType(e.target.value as 'bug' | 'feature')}
                disabled={formState === 'submitting'}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                  px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="bug">Fehlermeldung</option>
                <option value="feature">Funktionswunsch</option>
              </select>
            </div>

            {/* Title Input */}
            <div>
              <label htmlFor="feedback-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Titel
              </label>
              <input
                id="feedback-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={formState === 'submitting'}
                required
                minLength={5}
                placeholder="Kurze Zusammenfassung..."
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                  px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
            </div>

            {/* Description Textarea */}
            <div>
              <label htmlFor="feedback-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Beschreibung
              </label>
              <textarea
                id="feedback-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={formState === 'submitting'}
                required
                minLength={10}
                rows={4}
                placeholder="Beschreiben Sie das Problem oder den Wunsch..."
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                  px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  placeholder:text-gray-400 dark:placeholder:text-gray-500 resize-none"
              />
            </div>

            {/* Error Message */}
            {formState === 'error' && errorMessage && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-700 dark:text-red-400">{errorMessage}</p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={formState === 'submitting'}
                className="px-4 py-2 text-sm font-medium rounded-lg
                  text-gray-700 dark:text-gray-300
                  hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={formState === 'submitting'}
                className="px-4 py-2 text-sm font-medium rounded-lg
                  bg-gray-900 dark:bg-white text-white dark:text-gray-900
                  hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {formState === 'submitting' ? 'Senden...' : 'Absenden'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
