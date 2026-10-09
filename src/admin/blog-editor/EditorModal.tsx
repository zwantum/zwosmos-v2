import React, { useState, useEffect, useRef } from 'react';
import { Editor } from '@tiptap/react';

export type ActiveDialogType = 'link' | 'video' | 'cta' | 'faq' | 'image' | 'citation' | null;

export interface EditorModalProps {
  type: ActiveDialogType;
  editor: Editor;
  onClose: () => void;
}

export const EditorModal: React.FC<EditorModalProps> = ({ type, editor, onClose }) => {
  if (!type) return null;

  const firstInputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Link state
  const isLinkActive = editor.isActive('link');
  const [linkUrl, setLinkUrl] = useState(() => (editor.getAttributes('link').href as string) || '');
  const [linkText, setLinkText] = useState(() => {
    const { from, to } = editor.state.selection;
    return editor.state.doc.textBetween(from, to, ' ');
  });
  const [openInNewTab, setOpenInNewTab] = useState(true);

  // Citation state
  const isCitationActive = editor.isActive('blogCitation');
  const [citationUrl, setCitationUrl] = useState(() => (editor.getAttributes('blogCitation').href as string) || '');
  const [citationText, setCitationText] = useState(() => {
    const { from, to } = editor.state.selection;
    return editor.state.doc.textBetween(from, to, ' ');
  });
  const [citationOpenInNewTab, setCitationOpenInNewTab] = useState(() => {
    const target = editor.getAttributes('blogCitation').target;
    return target === undefined ? true : target === '_blank';
  });
  const [citationRelType, setCitationRelType] = useState<'dofollow' | 'nofollow'>(() => {
    const rel = (editor.getAttributes('blogCitation').rel as string) || '';
    return rel.includes('nofollow') ? 'nofollow' : 'dofollow';
  });

  // Video state
  const [videoUrl, setVideoUrl] = useState('');

  // CTA state
  const [ctaTitle, setCtaTitle] = useState('Consult Our Specialists');
  const [ctaDescription, setCtaDescription] = useState('Speak with our team to find the ideal customized solution.');
  const [ctaButtonText, setCtaButtonText] = useState('Book Consultation');
  const [ctaButtonUrl, setCtaButtonUrl] = useState('#');

  // FAQ state
  const [faqQuestion, setFaqQuestion] = useState('');
  const [faqAnswer, setFaqAnswer] = useState('');

  // Image state
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');

  // Initialize values when dialog opens or changes
  useEffect(() => {
    if (type === 'citation') {
      const attrs = editor.getAttributes('blogCitation');
      const { from, to } = editor.state.selection;
      const selected = editor.state.doc.textBetween(from, to, ' ');
      setCitationUrl((attrs.href as string) || '');
      setCitationText(selected || '');
      setCitationOpenInNewTab(attrs.target === undefined ? true : attrs.target === '_blank');
      const relStr = (attrs.rel as string) || '';
      setCitationRelType(relStr.includes('nofollow') ? 'nofollow' : 'dofollow');
    } else if (type === 'link') {
      const attrs = editor.getAttributes('link');
      const { from, to } = editor.state.selection;
      const selected = editor.state.doc.textBetween(from, to, ' ');
      setLinkUrl((attrs.href as string) || '');
      setLinkText(selected || '');
      setOpenInNewTab(attrs.target === undefined ? true : attrs.target === '_blank');
    }
  }, [type, editor]);

  // Focus the first input automatically on modal mount
  useEffect(() => {
    const timer = setTimeout(() => {
      firstInputRef.current?.focus();
    }, 50);
    return () => clearTimeout(timer);
  }, [type]);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Submit handlers
  const handleLinkSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const url = linkUrl.trim();
    if (!url) {
      if (isLinkActive) {
        editor.chain().focus().extendMarkRange('link').unsetLink().run();
      }
      onClose();
      return;
    }

    const target = openInNewTab ? '_blank' : null;
    const { selection } = editor.state;

    if (selection.empty && linkText.trim()) {
      editor
        .chain()
        .focus()
        .insertContent({
          type: 'text',
          text: linkText.trim(),
          marks: [{ type: 'link', attrs: { href: url, target } }],
        })
        .run();
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: url, target })
        .run();
    }
    onClose();
  };

  const handleLinkRemove = () => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    onClose();
  };

  const handleCitationSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const url = citationUrl.trim();
    const text = citationText.trim();

    if (!url) {
      if (isCitationActive) {
        editor.chain().focus().extendMarkRange('blogCitation').unsetCitation().run();
      }
      onClose();
      return;
    }

    const target = citationOpenInNewTab ? '_blank' : null;
    const rel = citationRelType === 'nofollow' 
      ? (target === '_blank' ? 'nofollow noopener noreferrer' : 'nofollow') 
      : (target === '_blank' ? 'noopener noreferrer' : null);

    const { selection } = editor.state;

    if (selection.empty) {
      if (editor.isActive('blogCitation')) {
        editor
          .chain()
          .focus()
          .extendMarkRange('blogCitation')
          .setCitation({ href: url, target, rel })
          .run();
      } else if (text) {
        editor
          .chain()
          .focus()
          .insertContent({
            type: 'text',
            text: text,
            marks: [{
              type: 'blogCitation',
              attrs: {
                href: url,
                target,
                rel,
                'data-citation': 'true',
                class: 'zw-blog-citation'
              }
            }]
          })
          .run();
      }
    } else {
      const selectedText = editor.state.doc.textBetween(selection.from, selection.to, ' ');
      if (text && text !== selectedText) {
        editor
          .chain()
          .focus()
          .insertContent({
            type: 'text',
            text: text,
            marks: [{
              type: 'blogCitation',
              attrs: {
                href: url,
                target,
                rel,
                'data-citation': 'true',
                class: 'zw-blog-citation'
              }
            }]
          })
          .run();
      } else {
        const chain = editor.chain().focus().unsetLink();
        if (editor.isActive('blogCitation')) {
          chain.extendMarkRange('blogCitation');
        }
        chain.setCitation({
          href: url,
          target,
          rel,
        }).run();
      }
    }

    onClose();
  };

  const handleCitationRemove = () => {
    editor.chain().focus().extendMarkRange('blogCitation').unsetCitation().run();
    onClose();
  };

  const handleVideoSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const url = videoUrl.trim();
    if (url) {
      (editor.chain().focus() as any).setYoutubeVideo({ src: url }).run();
    }
    onClose();
  };

  const handleCtaSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!ctaTitle.trim()) return;

    (editor.chain().focus() as any)
      .insertContent({
        type: 'blogCTA',
        attrs: {
          title: ctaTitle.trim(),
          description: ctaDescription.trim(),
          buttonText: ctaButtonText.trim() || 'Learn More',
          buttonUrl: ctaButtonUrl.trim() || '#',
        },
      })
      .run();
    onClose();
  };

  const handleFaqSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!faqQuestion.trim() || !faqAnswer.trim()) return;

    (editor.chain().focus() as any)
      .insertContent({
        type: 'blogFAQ',
        attrs: {
          question: faqQuestion.trim(),
          answer: faqAnswer.trim(),
        },
      })
      .run();
    onClose();
  };

  const handleImageSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const url = imageUrl.trim();
    if (url) {
      editor
        .chain()
        .focus()
        .setImage({ src: url, alt: imageAlt.trim() || undefined })
        .run();
    }
    onClose();
  };

  return (
    <div
      className="zw-blog-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="zw-blog-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* ========================================================
            CITATION DIALOG
            ======================================================== */}
        {type === 'citation' && (
          <form onSubmit={handleCitationSubmit}>
            <div className="zw-blog-modal-header">
              <h3 className="zw-blog-modal-title">
                <span>🔖</span> {isCitationActive ? 'Edit Reference Citation' : 'Insert Reference Citation'}
              </h3>
              <button type="button" className="zw-blog-modal-close" onClick={onClose} title="Close (Esc)">
                ✕
              </button>
            </div>
            <div className="zw-blog-modal-body">
              <div className="zw-blog-modal-field">
                <label className="zw-blog-modal-label">Citation Label / Text</label>
                <input
                  ref={firstInputRef as React.RefObject<HTMLInputElement>}
                  type="text"
                  className="zw-blog-modal-input"
                  placeholder="e.g. NASA black-hole guide"
                  value={citationText}
                  onChange={(e) => setCitationText(e.target.value)}
                  required
                />
                <span className="zw-blog-modal-hint">
                  Displays as a reference badge pill matching your article formatting.
                </span>
              </div>

              <div className="zw-blog-modal-field">
                <label className="zw-blog-modal-label">Reference Link / URL</label>
                <input
                  type="url"
                  className="zw-blog-modal-input"
                  placeholder="https://example.com/source"
                  value={citationUrl}
                  onChange={(e) => setCitationUrl(e.target.value)}
                  required
                />
              </div>

              {/* Open in new tab checkbox */}
              <label className="zw-blog-modal-checkbox-row">
                <input
                  type="checkbox"
                  checked={citationOpenInNewTab}
                  onChange={(e) => setCitationOpenInNewTab(e.target.checked)}
                />
                <span>Open link in a new tab (<code>target="_blank"</code>)</span>
              </label>

              {/* SEO / Follow vs NoFollow */}
              <div className="zw-blog-modal-field" style={{ marginTop: '4px' }}>
                <label className="zw-blog-modal-label">Search Engine Link Relation (SEO)</label>
                <div style={{ display: 'flex', gap: '20px', marginTop: '6px' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer', color: '#334155' }}>
                    <input
                      type="radio"
                      name="citationRel"
                      value="dofollow"
                      checked={citationRelType === 'dofollow'}
                      onChange={() => setCitationRelType('dofollow')}
                    />
                    <span><strong>DoFollow</strong> (Standard citation)</span>
                  </label>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer', color: '#334155' }}>
                    <input
                      type="radio"
                      name="citationRel"
                      value="nofollow"
                      checked={citationRelType === 'nofollow'}
                      onChange={() => setCitationRelType('nofollow')}
                    />
                    <span><strong>NoFollow</strong> (<code>rel="nofollow"</code>)</span>
                  </label>
                </div>
              </div>

              {/* Live Preview Box */}
              {citationText.trim() && (
                <div style={{ marginTop: '6px', padding: '10px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Live Preview:
                  </span>
                  <span className="zw-blog-citation" style={{ pointerEvents: 'none' }}>
                    {citationText}
                  </span>
                </div>
              )}
            </div>
            <div className="zw-blog-modal-footer">
              {isCitationActive && (
                <button
                  type="button"
                  className="zw-blog-modal-btn-danger"
                  onClick={handleCitationRemove}
                  title="Remove this citation"
                >
                  Remove Citation
                </button>
              )}
              <button type="button" className="zw-blog-modal-btn-cancel" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="zw-blog-modal-btn-primary">
                {isCitationActive ? 'Update Citation' : 'Insert Citation'}
              </button>
            </div>
          </form>
        )}

        {/* ========================================================
            FAQ DIALOG
            ======================================================== */}
        {type === 'faq' && (
          <form onSubmit={handleFaqSubmit}>
            <div className="zw-blog-modal-header">
              <h3 className="zw-blog-modal-title">
                <span>❓</span> Insert FAQ Accordion
              </h3>
              <button type="button" className="zw-blog-modal-close" onClick={onClose} title="Close (Esc)">
                ✕
              </button>
            </div>
            <div className="zw-blog-modal-body">
              <div className="zw-blog-modal-field">
                <label className="zw-blog-modal-label">FAQ Question</label>
                <input
                  ref={firstInputRef as React.RefObject<HTMLInputElement>}
                  type="text"
                  className="zw-blog-modal-input"
                  placeholder="e.g. What are the key architectural principles?"
                  value={faqQuestion}
                  onChange={(e) => setFaqQuestion(e.target.value)}
                  required
                />
              </div>
              <div className="zw-blog-modal-field">
                <label className="zw-blog-modal-label">FAQ Answer</label>
                <textarea
                  className="zw-blog-modal-textarea"
                  rows={4}
                  placeholder="e.g. The design highlights clarity, morning sunlight, and spatial flow..."
                  value={faqAnswer}
                  onChange={(e) => setFaqAnswer(e.target.value)}
                  required
                />
                <span className="zw-blog-modal-hint">
                  Displays as an expandable accordion block in your published article.
                </span>
              </div>
            </div>
            <div className="zw-blog-modal-footer">
              <button type="button" className="zw-blog-modal-btn-cancel" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="zw-blog-modal-btn-primary">
                Insert FAQ Block
              </button>
            </div>
          </form>
        )}

        {/* ========================================================
            CTA DIALOG
            ======================================================== */}
        {type === 'cta' && (
          <form onSubmit={handleCtaSubmit}>
            <div className="zw-blog-modal-header">
              <h3 className="zw-blog-modal-title">
                <span>🎯</span> Insert Call-to-Action (CTA) Banner
              </h3>
              <button type="button" className="zw-blog-modal-close" onClick={onClose} title="Close (Esc)">
                ✕
              </button>
            </div>
            <div className="zw-blog-modal-body">
              <div className="zw-blog-modal-field">
                <label className="zw-blog-modal-label">Headline / Title</label>
                <input
                  ref={firstInputRef as React.RefObject<HTMLInputElement>}
                  type="text"
                  className="zw-blog-modal-input"
                  placeholder="e.g. Consult Our Specialists"
                  value={ctaTitle}
                  onChange={(e) => setCtaTitle(e.target.value)}
                  required
                />
              </div>
              <div className="zw-blog-modal-field">
                <label className="zw-blog-modal-label">Description (Optional)</label>
                <input
                  type="text"
                  className="zw-blog-modal-input"
                  placeholder="e.g. Speak with our team to find the ideal customized solution."
                  value={ctaDescription}
                  onChange={(e) => setCtaDescription(e.target.value)}
                />
              </div>
              <div className="zw-blog-modal-field">
                <label className="zw-blog-modal-label">Button Label</label>
                <input
                  type="text"
                  className="zw-blog-modal-input"
                  placeholder="e.g. Book Consultation"
                  value={ctaButtonText}
                  onChange={(e) => setCtaButtonText(e.target.value)}
                  required
                />
              </div>
              <div className="zw-blog-modal-field">
                <label className="zw-blog-modal-label">Button Target URL</label>
                <input
                  type="text"
                  className="zw-blog-modal-input"
                  placeholder="e.g. https://example.com/contact or #contact"
                  value={ctaButtonUrl}
                  onChange={(e) => setCtaButtonUrl(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="zw-blog-modal-footer">
              <button type="button" className="zw-blog-modal-btn-cancel" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="zw-blog-modal-btn-primary">
                Insert CTA Banner
              </button>
            </div>
          </form>
        )}

        {/* ========================================================
            LINK DIALOG
            ======================================================== */}
        {type === 'link' && (
          <form onSubmit={handleLinkSubmit}>
            <div className="zw-blog-modal-header">
              <h3 className="zw-blog-modal-title">
                <span>🔗</span> {isLinkActive ? 'Edit Link' : 'Insert Link'}
              </h3>
              <button type="button" className="zw-blog-modal-close" onClick={onClose} title="Close (Esc)">
                ✕
              </button>
            </div>
            <div className="zw-blog-modal-body">
              <div className="zw-blog-modal-field">
                <label className="zw-blog-modal-label">Destination URL</label>
                <input
                  ref={firstInputRef as React.RefObject<HTMLInputElement>}
                  type="text"
                  className="zw-blog-modal-input"
                  placeholder="https://example.com"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  required
                />
              </div>
              {editor.state.selection.empty && (
                <div className="zw-blog-modal-field">
                  <label className="zw-blog-modal-label">Display Text</label>
                  <input
                    type="text"
                    className="zw-blog-modal-input"
                    placeholder="Text to display"
                    value={linkText}
                    onChange={(e) => setLinkText(e.target.value)}
                  />
                </div>
              )}
              <label className="zw-blog-modal-checkbox-row">
                <input
                  type="checkbox"
                  checked={openInNewTab}
                  onChange={(e) => setOpenInNewTab(e.target.checked)}
                />
                <span>Open link in a new tab (<code>target="_blank"</code>)</span>
              </label>
            </div>
            <div className="zw-blog-modal-footer">
              {isLinkActive && (
                <button
                  type="button"
                  className="zw-blog-modal-btn-danger"
                  onClick={handleLinkRemove}
                  title="Remove this link"
                >
                  Unlink
                </button>
              )}
              <button type="button" className="zw-blog-modal-btn-cancel" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="zw-blog-modal-btn-primary">
                {isLinkActive ? 'Update Link' : 'Save Link'}
              </button>
            </div>
          </form>
        )}

        {/* ========================================================
            YOUTUBE VIDEO DIALOG
            ======================================================== */}
        {type === 'video' && (
          <form onSubmit={handleVideoSubmit}>
            <div className="zw-blog-modal-header">
              <h3 className="zw-blog-modal-title">
                <span>▶️</span> Embed YouTube Video
              </h3>
              <button type="button" className="zw-blog-modal-close" onClick={onClose} title="Close (Esc)">
                ✕
              </button>
            </div>
            <div className="zw-blog-modal-body">
              <div className="zw-blog-modal-field">
                <label className="zw-blog-modal-label">YouTube Video URL</label>
                <input
                  ref={firstInputRef as React.RefObject<HTMLInputElement>}
                  type="text"
                  className="zw-blog-modal-input"
                  placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  required
                />
                <span className="zw-blog-modal-hint">
                  Supports standard YouTube URLs, Shorts links, and youtu.be shortlinks.
                </span>
              </div>
            </div>
            <div className="zw-blog-modal-footer">
              <button type="button" className="zw-blog-modal-btn-cancel" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="zw-blog-modal-btn-primary">
                Embed Video
              </button>
            </div>
          </form>
        )}

        {/* ========================================================
            IMAGE URL DIALOG
            ======================================================== */}
        {type === 'image' && (
          <form onSubmit={handleImageSubmit}>
            <div className="zw-blog-modal-header">
              <h3 className="zw-blog-modal-title">
                <span>🖼️</span> Insert Image by URL
              </h3>
              <button type="button" className="zw-blog-modal-close" onClick={onClose} title="Close (Esc)">
                ✕
              </button>
            </div>
            <div className="zw-blog-modal-body">
              <div className="zw-blog-modal-field">
                <label className="zw-blog-modal-label">Image Source URL</label>
                <input
                  ref={firstInputRef as React.RefObject<HTMLInputElement>}
                  type="text"
                  className="zw-blog-modal-input"
                  placeholder="https://images.unsplash.com/... or https://..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  required
                />
              </div>
              <div className="zw-blog-modal-field">
                <label className="zw-blog-modal-label">Alt Text (Accessibility & SEO)</label>
                <input
                  type="text"
                  className="zw-blog-modal-input"
                  placeholder="Brief description of the image"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                />
              </div>
            </div>
            <div className="zw-blog-modal-footer">
              <button type="button" className="zw-blog-modal-btn-cancel" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="zw-blog-modal-btn-primary">
                Insert Image
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
