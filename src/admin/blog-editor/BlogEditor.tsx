import { useEffect, useMemo, useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { Extension } from '@tiptap/core';
import { BlogEditorConfig } from '@zwantum/blog-types';
import { Eye, Code2, WrapText, Sparkles, Copy, Check } from 'lucide-react';

// Import supporting components and utilities from blog-editor package
import { 
  EditorToolbar, 
  EditorBubbleMenu, 
  getBlogEditorExtensions, 
  useAutosave 
} from '../../../node_modules/@zwantum/blog-editor/dist/index.mjs';

import '@zwantum/blog-editor/styles.css';
import '@zwantum/blog-editor/content.css';

export interface BlogEditorHandle {
  flush: () => { html: string; json: Record<string, unknown>; isEmpty: boolean };
  getHTML: () => string;
  getJSON: () => Record<string, unknown>;
  focus: () => void;
  isEmpty: () => boolean;
  insertImage: (src: string, alt?: string) => void;
}

export interface BlogEditorProps {
  content?: Record<string, unknown> | string;
  onChange?: (contentJson: Record<string, unknown>, contentHtml: string) => void;
  config?: BlogEditorConfig;
  placeholder?: string;
  readOnly?: boolean;
  onOpenMediaLibrary?: () => void;
  onAutosave?: (contentJson: Record<string, unknown>) => Promise<void> | void;
  enableAutosave?: boolean;
  className?: string;
}

export function formatHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/></g, '>\n<')
    .replace(/(<\/(?:p|h[1-6]|div|blockquote|ul|ol|li|hr|figure|table|tr|td|th)>)/gi, '$1\n')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .join('\n');
}

// Preserve inline style="..." and class="..." attributes across marks and nodes
const PreserveStyleAndClass = Extension.create({
  name: 'preserveStyleAndClass',
  addGlobalAttributes() {
    return [
      {
        types: [
          'heading',
          'paragraph',
          'textStyle',
          'bold',
          'italic',
          'underline',
          'strike',
          'blockquote',
          'listItem',
          'bulletList',
          'orderedList',
          'image',
          'link',
          'table',
          'tableRow',
          'tableCell',
          'tableHeader'
        ],
        attributes: {
          style: {
            default: null,
            parseHTML: element => element.getAttribute('style'),
            renderHTML: attributes => {
              if (!attributes.style) return {};
              return { style: attributes.style };
            }
          },
          class: {
            default: null,
            parseHTML: element => element.getAttribute('class'),
            renderHTML: attributes => {
              if (!attributes.class) return {};
              return { class: attributes.class };
            }
          }
        }
      }
    ];
  }
});

export const BlogEditor = forwardRef<BlogEditorHandle, BlogEditorProps>(({
  content,
  onChange,
  config,
  readOnly = false,
  onOpenMediaLibrary,
  onAutosave,
  enableAutosave = true,
  className = '',
}, ref) => {
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  // HTML Code Editor states
  const [isCodeView, setIsCodeView] = useState(false);
  const [rawCode, setRawCode] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isWordWrap, setIsWordWrap] = useState(true);
  const [lineHeights, setLineHeights] = useState<number[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const measureContainerRef = useRef<HTMLDivElement>(null);
  const [textareaWidth, setTextareaWidth] = useState<number>(0);

  const extensions = useMemo(() => {
    const baseExtensions = getBlogEditorExtensions(config);
    return [...baseExtensions, PreserveStyleAndClass];
  }, [config]);

  const initialContent = useMemo(() => {
    if (!content) return { type: 'doc', content: [{ type: 'paragraph' }] };
    return content;
  }, [content]);

  const editor = useEditor({
    extensions,
    content: initialContent,
    editable: !readOnly,
    editorProps: {
      attributes: {
        class: 'tiptap ProseMirror focus:outline-none',
        style: 'min-height: 320px; outline: none;',
      },
    },
    onUpdate: ({ editor }) => {
      const json = editor.getJSON() as Record<string, unknown>;
      const html = editor.getHTML();

      const text = editor.getText();
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      setWordCount(words);
      setCharCount(text.length);

      setCurrentJson(json);

      if (onChange) {
        onChange(json, html);
      }
    },
  });

  // Keep content in sync if incoming content changes while not focused
  useEffect(() => {
    if (editor && content && !editor.isFocused && !isCodeView) {
      const currentStr = JSON.stringify(editor.getJSON());
      const incomingStr = JSON.stringify(content);
      if (currentStr !== incomingStr) {
        editor.commands.setContent(content, false);
      }
    }
  }, [content, editor, isCodeView]);

  // Track width of textarea for accurate word-wrap height calculation
  useEffect(() => {
    if (!textareaRef.current) return;
    const updateWidth = () => {
      if (textareaRef.current) {
        const w = Math.max(0, textareaRef.current.clientWidth - 32);
        setTextareaWidth(w);
      }
    };
    updateWidth();
    const ro = new ResizeObserver(updateWidth);
    ro.observe(textareaRef.current);
    return () => ro.disconnect();
  }, [isCodeView]);

  // Dynamically sync gutter line heights with wrapped visual lines
  useEffect(() => {
    if (!isCodeView || !isWordWrap || !measureContainerRef.current) return;
    const children = measureContainerRef.current.children;
    const heights: number[] = [];
    for (let i = 0; i < children.length; i++) {
      const el = children[i] as HTMLElement;
      heights.push(el.offsetHeight || 21);
    }
    setLineHeights(heights);
  }, [rawCode, textareaWidth, isWordWrap, isCodeView]);

  // Mode switcher handler
  const handleSwitchMode = (toCode: boolean) => {
    if (toCode) {
      const currentHtml = editor ? editor.getHTML() : '';
      const formatted = formatHtml(currentHtml);
      setRawCode(formatted);
      setIsCodeView(true);
    } else {
      if (editor) {
        try {
          editor.commands.setContent(rawCode, false);
          const json = editor.getJSON() as Record<string, unknown>;
          const text = editor.getText();
          const words = text.trim() ? text.trim().split(/\s+/).length : 0;
          setWordCount(words);
          setCharCount(text.length);
          setCurrentJson(json);
          if (onChange) {
            onChange(json, rawCode);
          }
        } catch (e) {
          console.error('Error parsing HTML into editor:', e);
        }
      }
      setIsCodeView(false);
    }
  };

  const handleCodeChange = (newCode: string) => {
    setRawCode(newCode);

    // Extract word count from typed HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = newCode;
    const text = tempDiv.textContent || tempDiv.innerText || '';
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    setWordCount(words);
    setCharCount(text.length);

    if (editor) {
      if (onChange) {
        onChange(editor.getJSON() as Record<string, unknown>, newCode);
      }
    }
  };

  const handleCodeScroll = () => {
    if (textareaRef.current && gutterRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handleInsertTag = (openTag: string, closeTag: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = rawCode.substring(start, end);
    const replacement = closeTag ? `${openTag}${selected || 'text'}${closeTag}` : openTag;
    const newCode = rawCode.substring(0, start) + replacement + rawCode.substring(end);
    handleCodeChange(newCode);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + openTag.length, start + openTag.length + (selected ? selected.length : 4));
    }, 10);
  };

  const handleFormatCode = () => {
    const formatted = formatHtml(rawCode);
    handleCodeChange(formatted);
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(rawCode);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {}
  };

  // Expose imperative handle for synchronous flush & snapshot extraction
  useImperativeHandle(ref, () => ({
    flush: () => {
      if (isCodeView) {
        if (editor) {
          try {
            editor.commands.setContent(rawCode, false);
          } catch {}
        }
        const isEmpty = !rawCode.trim() || rawCode === '<p></p>' || rawCode === '';
        return {
          html: rawCode,
          json: editor ? (editor.getJSON() as Record<string, unknown>) : { type: 'doc', content: [{ type: 'paragraph' }] },
          isEmpty,
        };
      }
      if (!editor) {
        return {
          html: '',
          json: { type: 'doc', content: [{ type: 'paragraph' }] },
          isEmpty: true,
        };
      }
      const json = editor.getJSON() as Record<string, unknown>;
      const html = editor.getHTML();
      const text = editor.getText();
      const isEmpty = !text.trim() || html === '<p></p>' || html === '';
      return { html, json, isEmpty };
    },
    getHTML: () => (isCodeView ? rawCode : (editor ? editor.getHTML() : '')),
    getJSON: () => {
      if (isCodeView && editor) {
        try {
          editor.commands.setContent(rawCode, false);
        } catch {}
      }
      return editor ? (editor.getJSON() as Record<string, unknown>) : { type: 'doc', content: [{ type: 'paragraph' }] };
    },
    focus: () => {
      if (isCodeView) {
        textareaRef.current?.focus();
      } else {
        editor?.commands.focus();
      }
    },
    isEmpty: () => {
      if (isCodeView) {
        return !rawCode.trim() || rawCode === '<p></p>' || rawCode === '';
      }
      if (!editor) return true;
      const text = editor.getText();
      const html = editor.getHTML();
      return !text.trim() || html === '<p></p>' || html === '';
    },
    insertImage: (src: string, alt?: string) => {
      if (isCodeView) {
        handleInsertTag(`<img src="${src}" alt="${alt || ''}" />`);
        return;
      }
      if (!editor || !src) return;
      let ran = false;
      try {
        ran = editor
          .chain()
          .focus()
          .setImage({ src, alt: alt || '' })
          .run();
      } catch {
        ran = false;
      }
      if (!ran) {
        try {
          editor
            .chain()
            .focus()
            .insertContent({
              type: 'image',
              attrs: { src, alt: alt || '' },
            })
            .run();
        } catch {
          editor.commands.insertContent(`<img src="${src}" alt="${alt || ''}" class="zw-blog-editor-image" />`);
        }
      }
    },
  }), [editor, isCodeView, rawCode]);

  const readingTime = Math.max(1, Math.ceil(wordCount / 200));
  const [currentJson, setCurrentJson] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (editor) {
      setCurrentJson(editor.getJSON() as Record<string, unknown>);
    }
  }, [editor]);

  const { isSaving, lastSaved } = useAutosave({
    data: currentJson,
    onSave: async (json) => {
      if (onAutosave) {
        await onAutosave(json);
      }
    },
    enabled: enableAutosave && !!onAutosave && !readOnly,
    debounceMs: 3000,
  });

  const quickTags = [
    { label: '<p>', open: '<p>', close: '</p>' },
    { label: '<strong>', open: '<strong>', close: '</strong>' },
    { label: '<em>', open: '<em>', close: '</em>' },
    { label: '<u>', open: '<u>', close: '</u>' },
    { label: '<s>', open: '<s>', close: '</s>' },
    { label: '<a>', open: '<a href="https://">', close: '</a>' },
    { label: '<br/>', open: '<br/>', close: '' },
    { label: '<h1>', open: '<h1>', close: '</h1>' },
    { label: '<h2>', open: '<h2>', close: '</h2>' },
    { label: '<h3>', open: '<h3>', close: '</h3>' },
    { label: '<blockquote>', open: '<blockquote>', close: '</blockquote>' },
    { label: '<code>', open: '<code>', close: '</code>' },
    { label: '<pre>', open: '<pre><code>', close: '</code></pre>' },
    { label: '<div>', open: '<div>', close: '</div>' },
  ];

  return (
    <div className={`zw-blog-editor-container ${className}`} style={{ borderRadius: '12px', border: '1px solid #cbd5e1', overflow: 'hidden', background: '#ffffff', display: 'flex', flexDirection: 'column' }}>
      {!readOnly && (
        <>
          {/* Top Header Mode Switcher Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              background: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              flexWrap: 'wrap',
              gap: '8px'
            }}
          >
            {/* Toggle Pills */}
            <div style={{ display: 'inline-flex', background: '#e2e8f0', borderRadius: '8px', padding: '3px', gap: '3px' }}>
              <button
                type="button"
                onClick={() => handleSwitchMode(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: !isCodeView ? '#ffffff' : 'transparent',
                  color: !isCodeView ? '#0f172a' : '#64748b',
                  fontWeight: !isCodeView ? 700 : 500,
                  fontSize: '12px',
                  cursor: 'pointer',
                  boxShadow: !isCodeView ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <Eye size={14} color={!isCodeView ? '#eab308' : '#64748b'} />
                <span>Visual Editor</span>
              </button>
              <button
                type="button"
                onClick={() => handleSwitchMode(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: isCodeView ? '#0f172a' : 'transparent',
                  color: isCodeView ? '#ffcc00' : '#64748b',
                  fontWeight: isCodeView ? 700 : 500,
                  fontSize: '12px',
                  cursor: 'pointer',
                  boxShadow: isCodeView ? '0 1px 4px rgba(0,0,0,0.25)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <Code2 size={14} color={isCodeView ? '#ffcc00' : '#64748b'} />
                <span>HTML Code</span>
              </button>
            </div>

            {/* Quick Actions in Code Mode */}
            {isCodeView ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setIsWordWrap(!isWordWrap)}
                  title={isWordWrap ? 'Word wrap is ON (lines break naturally). Click to disable.' : 'Word wrap is OFF. Click to wrap long lines.'}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '5px 10px',
                    background: isWordWrap ? '#f1f5f9' : '#ffffff',
                    border: isWordWrap ? '1px solid #94a3b8' : '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: isWordWrap ? '#0f172a' : '#64748b',
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <WrapText size={13} color={isWordWrap ? '#0f172a' : '#64748b'} />
                  <span>{isWordWrap ? 'Wrap: On' : 'Wrap: Off'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleFormatCode}
                  title="Beautify and indent HTML code"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '5px 10px',
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#334155',
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                  }}
                >
                  <Sparkles size={13} color="#eab308" />
                  <span>Format HTML</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  title="Copy raw HTML to clipboard"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '5px 10px',
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: isCopied ? '#166534' : '#334155',
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                  }}
                >
                  {isCopied ? <Check size={13} color="#16a34a" /> : <Copy size={13} />}
                  <span>{isCopied ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>
            ) : (
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                Visual mode • Switch to <strong>HTML Code</strong> to view &amp; edit raw code directly
              </span>
            )}
          </div>

          {/* Quick Tag Helper Bar in Code Mode */}
          {isCodeView && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '6px 12px',
                background: '#ffffff',
                borderBottom: '1px solid #e2e8f0',
                flexWrap: 'wrap',
                gap: '6px'
              }}
            >
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', marginRight: '4px' }}>
                Quick Tags:
              </span>
              {quickTags.map((tag) => (
                <button
                  key={tag.label}
                  type="button"
                  onClick={() => handleInsertTag(tag.open, tag.close)}
                  style={{
                    padding: '2px 7px',
                    fontSize: '11px',
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace",
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    borderRadius: '4px',
                    color: '#334155',
                    cursor: 'pointer',
                    transition: 'all 0.1s ease'
                  }}
                >
                  {tag.label}
                </button>
              ))}
            </div>
          )}

          {/* Visual Editor Toolbar & Bubble Menu */}
          {!isCodeView && (
            <>
              <EditorToolbar editor={editor} onOpenMediaLibrary={onOpenMediaLibrary} />
              <EditorBubbleMenu editor={editor} />
            </>
          )}
        </>
      )}

      {/* Editor Body */}
      {!isCodeView ? (
        <div
          className="zw-blog-editor-content"
          onClick={() => {
            if (editor && !editor.isFocused) {
              editor.commands.focus('end');
            }
          }}
          style={{ cursor: 'text', minHeight: '320px', background: '#ffffff' }}
        >
          <EditorContent editor={editor} />
        </div>
      ) : (
        /* Raw HTML Code Editor with Line Numbers */
        <div
          style={{
            display: 'flex',
            minHeight: '360px',
            background: '#ffffff',
            borderTop: 'none',
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          {/* Hidden Mirror to measure wrapped heights of each line */}
          {isCodeView && isWordWrap && (
            <div
              ref={measureContainerRef}
              aria-hidden="true"
              style={{
                position: 'absolute',
                visibility: 'hidden',
                top: 0,
                left: 0,
                width: textareaWidth > 0 ? `${textareaWidth}px` : '100%',
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace",
                fontSize: '13px',
                lineHeight: '21px',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
                boxSizing: 'content-box',
                pointerEvents: 'none',
                zIndex: -9999
              }}
            >
              {rawCode.split('\n').map((line, idx) => (
                <div key={idx} style={{ lineHeight: '21px', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                  {line || '\u00A0'}
                </div>
              ))}
            </div>
          )}

          {/* Line Numbers Gutter */}
          <div
            ref={gutterRef}
            style={{
              padding: '16px 10px',
              background: '#f8fafc',
              borderRight: '1px solid #cbd5e1',
              color: '#94a3b8',
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace",
              fontSize: '13px',
              lineHeight: '21px',
              textAlign: 'right',
              userSelect: 'none',
              overflowY: 'hidden',
              minWidth: '44px',
              boxSizing: 'border-box'
            }}
          >
            {rawCode.split('\n').map((_, i) => (
              <div
                key={i + 1}
                style={{
                  height: isWordWrap && lineHeights[i] ? `${lineHeights[i]}px` : '21px',
                  lineHeight: '21px',
                  boxSizing: 'border-box'
                }}
              >
                {i + 1}
              </div>
            ))}
          </div>

          {/* Textarea Code Input */}
          <textarea
            ref={textareaRef}
            value={rawCode}
            onChange={(e) => handleCodeChange(e.target.value)}
            onScroll={handleCodeScroll}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            placeholder="Type or paste HTML code here..."
            style={{
              flex: 1,
              padding: '16px',
              border: 'none',
              outline: 'none',
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace",
              fontSize: '13px',
              lineHeight: '21px',
              color: '#0f172a',
              background: '#ffffff',
              minHeight: '360px',
              whiteSpace: isWordWrap ? 'pre-wrap' : 'pre',
              wordBreak: isWordWrap ? 'break-word' : 'normal',
              overflowWrap: isWordWrap ? 'break-word' : 'normal',
              overflowX: isWordWrap ? 'hidden' : 'auto',
              overflowY: 'auto',
              resize: 'vertical',
              boxSizing: 'border-box'
            }}
          />
        </div>
      )}

      {/* Editor Footer */}
      <div className="zw-blog-editor-footer" style={{ borderTop: '1px solid #e2e8f0', background: '#f8fafc', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="zw-blog-editor-stats" style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#64748b' }}>
          <span>{wordCount} words</span>
          <span>{charCount} characters</span>
          <span>~{readingTime} min read</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {enableAutosave && onAutosave && (
            <div className="zw-blog-editor-autosave" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#64748b' }}>
              <span className={`zw-autosave-dot ${isSaving ? 'saving' : ''}`} />
              <span>
                {isSaving
                  ? 'Autosaving changes...'
                  : lastSaved
                  ? `Saved at ${lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
                  : 'All changes saved'}
              </span>
            </div>
          )}

          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
            Powered by <strong style={{ color: '#475569' }}>Zwantum</strong>
          </span>
        </div>
      </div>
    </div>
  );
});

BlogEditor.displayName = 'BlogEditor';
