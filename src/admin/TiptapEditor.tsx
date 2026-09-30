import { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { Extension } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import { 
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Code, Link as LinkIcon, Image as ImageIcon, 
  List, ListOrdered, AlignLeft, AlignCenter, AlignRight, AlignJustify, 
  Quote, Minus, Undo, Redo, Palette, X, Eye, Code2, Sparkles, Copy, Check, WrapText
} from 'lucide-react';
import { MediaLibrary } from '@zwantum/blog/admin';
import { blogClient } from '../lib/blogClient';
import './TiptapEditor.css';

interface TiptapEditorProps {
  value: string;
  onChange: (content: string) => void;
  minHeight?: string;
  onReady?: (editor: any) => void;
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

// Custom extension to preserve inline style="..." and class="..." attributes across all standard nodes/marks
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
          'link'
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

export default function TiptapEditor({ value, onChange, minHeight = '180px', onReady }: TiptapEditorProps) {
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [isLinkBoxOpen, setIsLinkBoxOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [isCodeView, setIsCodeView] = useState(false);
  const [rawCode, setRawCode] = useState(() => formatHtml(value || ''));
  const [isCopied, setIsCopied] = useState(false);
  const [isWordWrap, setIsWordWrap] = useState(true);
  const [lineHeights, setLineHeights] = useState<number[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const measureContainerRef = useRef<HTMLDivElement>(null);
  const [textareaWidth, setTextareaWidth] = useState<number>(0);
  const lastEmittedRef = useRef(value);

  // Measure textarea content width so hidden mirror matches width precisely
  useEffect(() => {
    if (!textareaRef.current) return;
    const updateWidth = () => {
      if (textareaRef.current) {
        // clientWidth is width inside borders, excluding scrollbar
        // subtract padding (16px left + 16px right = 32px)
        const w = Math.max(0, textareaRef.current.clientWidth - 32);
        setTextareaWidth(w);
      }
    };
    updateWidth();
    const ro = new ResizeObserver(updateWidth);
    ro.observe(textareaRef.current);
    return () => ro.disconnect();
  }, [isCodeView]);

  // Measure wrapped heights of each line to align line numbers gutter
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

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] }
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Underline,
      Link.configure({ openOnClick: false }),
      Image,
      Color,
      TextStyle,
      FontFamily,
      PreserveStyleAndClass,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      lastEmittedRef.current = html;
      onChange(html);
    },
    onSelectionUpdate: ({ editor }) => {
      const html = editor.getHTML();
      lastEmittedRef.current = html;
      onChange(html);
    },
    onBlur: ({ editor }) => {
      const html = editor.getHTML();
      lastEmittedRef.current = html;
      onChange(html);
    },
  });

  useEffect(() => {
    if (editor && onReady) {
      const proxy = {
        ...editor,
        getHTML: () => (isCodeView ? rawCode : editor.getHTML())
      };
      onReady(proxy);
    }
  }, [editor, onReady, isCodeView, rawCode]);

  useEffect(() => {
    if (!editor) return;
    if (value !== undefined && value !== lastEmittedRef.current) {
      lastEmittedRef.current = value;
      if (editor.getHTML() !== value) {
        editor.commands.setContent(value, false);
      }
      setRawCode(formatHtml(value));
    }
  }, [value, editor]);

  const handleSwitchMode = (toCode: boolean) => {
    if (toCode) {
      const currentHtml = editor ? editor.getHTML() : value;
      const formatted = formatHtml(currentHtml);
      setRawCode(formatted);
      setIsCodeView(true);
    } else {
      if (editor) {
        editor.commands.setContent(rawCode, false);
      }
      lastEmittedRef.current = rawCode;
      onChange(rawCode);
      setIsCodeView(false);
    }
  };

  const handleCodeChange = (newCode: string) => {
    setRawCode(newCode);
    lastEmittedRef.current = newCode;
    onChange(newCode);
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

  if (!editor) {
    return null;
  }

  // Open inline link popover (replaces window.prompt alert)
  const handleToggleLinkBox = () => {
    const previousUrl = editor.getAttributes('link').href || '';
    setLinkUrl(previousUrl);
    setIsLinkBoxOpen(!isLinkBoxOpen);
  };

  const handleApplyLink = () => {
    if (!linkUrl.trim()) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      const finalUrl = linkUrl.startsWith('http://') || linkUrl.startsWith('https://') || linkUrl.startsWith('/') || linkUrl.startsWith('mailto:')
        ? linkUrl
        : `https://${linkUrl}`;
      editor.chain().focus().extendMarkRange('link').setLink({ href: finalUrl }).run();
    }
    setIsLinkBoxOpen(false);
  };

  const handleRemoveLink = () => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    setIsLinkBoxOpen(false);
  };

  const toolbarBtnStyle = (isActive: boolean) => ({
    background: isActive ? '#ffcc00' : 'transparent',
    border: 'none',
    color: isActive ? '#0f172a' : '#475569',
    padding: '7px',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s ease',
    boxShadow: isActive ? '0 1px 3px rgba(255, 204, 0, 0.4)' : 'none'
  });

  const dividerStyle = {
    width: '1px',
    height: '20px',
    background: '#e2e8f0',
    margin: '0 4px'
  };

  const currentHeading = editor.isActive('heading', { level: 1 })
    ? '1'
    : editor.isActive('heading', { level: 2 })
    ? '2'
    : editor.isActive('heading', { level: 3 })
    ? '3'
    : editor.isActive('heading', { level: 4 })
    ? '4'
    : editor.isActive('heading', { level: 5 })
    ? '5'
    : editor.isActive('heading', { level: 6 })
    ? '6'
    : 'p';

  return (
    <div
      style={{
        borderRadius: '10px',
        background: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: '1px solid #cbd5e1',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      {/* Top Header Bar: Mode Switcher [Visual Editor] | [</> HTML Code] */}
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

        {/* Code Mode Quick Actions */}
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

      {/* Code Mode Quick Tag Bar */}
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
          <button type="button" onClick={() => handleInsertTag('<p>', '</p>')} className="tiptap-code-tag-btn">&lt;p&gt;</button>
          <button type="button" onClick={() => handleInsertTag('<strong>', '</strong>')} className="tiptap-code-tag-btn">&lt;strong&gt;</button>
          <button type="button" onClick={() => handleInsertTag('<em>', '</em>')} className="tiptap-code-tag-btn">&lt;em&gt;</button>
          <button type="button" onClick={() => handleInsertTag('<u>', '</u>')} className="tiptap-code-tag-btn">&lt;u&gt;</button>
          <button type="button" onClick={() => handleInsertTag('<s>', '</s>')} className="tiptap-code-tag-btn">&lt;s&gt;</button>
          <button type="button" onClick={() => handleInsertTag('<a href="https://">', '</a>')} className="tiptap-code-tag-btn">&lt;a&gt;</button>
          <button type="button" onClick={() => handleInsertTag('<br/>')} className="tiptap-code-tag-btn">&lt;br/&gt;</button>
          <button type="button" onClick={() => handleInsertTag('<h1>', '</h1>')} className="tiptap-code-tag-btn">&lt;h1&gt;</button>
          <button type="button" onClick={() => handleInsertTag('<h2>', '</h2>')} className="tiptap-code-tag-btn">&lt;h2&gt;</button>
          <button type="button" onClick={() => handleInsertTag('<h3>', '</h3>')} className="tiptap-code-tag-btn">&lt;h3&gt;</button>
          <button type="button" onClick={() => handleInsertTag('<blockquote>', '</blockquote>')} className="tiptap-code-tag-btn">&lt;quote&gt;</button>
        </div>
      )}

      {/* Visual Mode Rich Text Toolbar */}
      {!isCodeView && (
        <>
          <div
            style={{
          display: 'flex',
          alignItems: 'center',
          padding: '8px 12px',
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          flexWrap: 'wrap',
          gap: '4px'
        }}
      >
        {/* Headings (6 options) & Paragraph Selector */}
        <select
          value={currentHeading}
          onChange={(e) => {
            const val = e.target.value;
            if (val === 'p') {
              editor.chain().focus().setParagraph().run();
            } else {
              editor.chain().focus().toggleHeading({ level: parseInt(val) as any }).run();
            }
          }}
          style={{
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            color: '#0f172a',
            padding: '5px 8px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            outline: 'none',
            marginRight: '2px'
          }}
        >
          <option value="p">Paragraph</option>
          <option value="1">Heading 1</option>
          <option value="2">Heading 2</option>
          <option value="3">Heading 3</option>
          <option value="4">Heading 4</option>
          <option value="5">Heading 5</option>
          <option value="6">Heading 6</option>
        </select>

        <div style={dividerStyle} />

        {/* Formatting Actions */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleBold().run()}
          style={toolbarBtnStyle(editor.isActive('bold'))}
          title="Bold (Ctrl+B)"
        >
          <Bold size={15} />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          style={toolbarBtnStyle(editor.isActive('italic'))}
          title="Italic (Ctrl+I)"
        >
          <Italic size={15} />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          style={toolbarBtnStyle(editor.isActive('underline'))}
          title="Underline (Ctrl+U)"
        >
          <UnderlineIcon size={15} />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          style={toolbarBtnStyle(editor.isActive('strike'))}
          title="Strikethrough"
        >
          <Strikethrough size={15} />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleCode().run()}
          style={toolbarBtnStyle(editor.isActive('code'))}
          title="Code"
        >
          <Code size={15} />
        </button>

        {/* Color Palette */}
        <label
          style={{ ...toolbarBtnStyle(false), cursor: 'pointer', position: 'relative' }}
          title="Text Color"
        >
          <Palette size={15} />
          <input
            type="color"
            onInput={(e: any) => editor.chain().focus().setColor(e.target.value).run()}
            style={{ opacity: 0, width: 0, height: 0, padding: 0, border: 'none', position: 'absolute' }}
          />
        </label>

        <div style={dividerStyle} />

        {/* Links (Inline Bar - NO window.prompt alert) */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleToggleLinkBox}
          style={toolbarBtnStyle(editor.isActive('link') || isLinkBoxOpen)}
          title="Insert Link"
        >
          <LinkIcon size={15} />
        </button>

        {/* Image from Blog Media Gallery */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setIsMediaModalOpen(true)}
          style={toolbarBtnStyle(false)}
          title="Choose from Blog Media Gallery"
        >
          <ImageIcon size={15} />
        </button>

        <div style={dividerStyle} />

        {/* Lists */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          style={toolbarBtnStyle(editor.isActive('bulletList'))}
          title="Bullet List"
        >
          <List size={15} />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          style={toolbarBtnStyle(editor.isActive('orderedList'))}
          title="Numbered List"
        >
          <ListOrdered size={15} />
        </button>

        <div style={dividerStyle} />

        {/* Alignment */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          style={toolbarBtnStyle(editor.isActive({ textAlign: 'left' }))}
          title="Align Left"
        >
          <AlignLeft size={15} />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          style={toolbarBtnStyle(editor.isActive({ textAlign: 'center' }))}
          title="Align Center"
        >
          <AlignCenter size={15} />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          style={toolbarBtnStyle(editor.isActive({ textAlign: 'right' }))}
          title="Align Right"
        >
          <AlignRight size={15} />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          style={toolbarBtnStyle(editor.isActive({ textAlign: 'justify' }))}
          title="Justify"
        >
          <AlignJustify size={15} />
        </button>

        <div style={dividerStyle} />

        {/* Blockquote & Horizontal Rule */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          style={toolbarBtnStyle(editor.isActive('blockquote'))}
          title="Blockquote"
        >
          <Quote size={15} />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          style={toolbarBtnStyle(false)}
          title="Horizontal Rule"
        >
          <Minus size={15} />
        </button>

        {/* History: Undo / Redo */}
        <div style={{ display: 'flex', marginLeft: 'auto', gap: '4px' }}>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            style={{ ...toolbarBtnStyle(false), opacity: editor.can().undo() ? 1 : 0.4 }}
            title="Undo (Ctrl+Z)"
          >
            <Undo size={15} />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            style={{ ...toolbarBtnStyle(false), opacity: editor.can().redo() ? 1 : 0.4 }}
            title="Redo (Ctrl+Y)"
          >
            <Redo size={15} />
          </button>
        </div>
      </div>

      {/* Inline Link Toolbar (NO native browser prompt alert) */}
      {isLinkBoxOpen && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 14px',
            background: '#f1f5f9',
            borderBottom: '1px solid #e2e8f0',
            flexWrap: 'wrap',
            animation: 'fadeIn 0.15s ease'
          }}
        >
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>
            Link URL:
          </span>
          <input
            type="text"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleApplyLink();
              } else if (e.key === 'Escape') {
                setIsLinkBoxOpen(false);
              }
            }}
            placeholder="https://example.com"
            autoFocus
            style={{
              flex: 1,
              minWidth: '220px',
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '13px',
              outline: 'none',
              background: '#ffffff',
              color: '#0f172a'
            }}
          />
          <button
            type="button"
            onClick={handleApplyLink}
            style={{
              background: '#ffcc00',
              color: '#0f172a',
              border: 'none',
              padding: '6px 14px',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Apply
          </button>
          {editor.isActive('link') && (
            <button
              type="button"
              onClick={handleRemoveLink}
              style={{
                background: '#fee2e2',
                color: '#ef4444',
                border: '1px solid #fecdd3',
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: 500
              }}
            >
              Remove Link
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsLinkBoxOpen(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Close"
          >
            <X size={16} />
          </button>
        </div>
      )}
      </>
      )}

      {/* Editor Content Area */}
      {!isCodeView ? (
        <div
          style={{ background: '#ffffff', color: '#0f172a', minHeight, cursor: 'text' }}
          onClick={() => {
            if (editor && !editor.isFocused) {
              editor.commands.focus();
            }
          }}
        >
          <EditorContent editor={editor} className="tiptap-white-editor" style={{ minHeight }} />
        </div>
      ) : (
        /* Raw HTML Code Editor with Line Numbers */
        <div
          style={{
            display: 'flex',
            minHeight,
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
              minHeight,
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

      {/* Blog Media Gallery Modal */}
      {isMediaModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 100005,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px'
          }}
          onClick={() => setIsMediaModalOpen(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '980px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)'
            }}
          >
            <div
              style={{
                padding: '16px 24px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#ffffff'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: '#ffcc00',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <ImageIcon size={16} color="#0f172a" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
                    Blog Media Gallery
                  </h3>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                    Select an existing image or upload a new one to insert into content
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsMediaModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#64748b',
                  padding: '6px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
              <MediaLibrary
                client={blogClient}
                onSelectMedia={(media: any) => {
                  const url = typeof media === 'string' ? media : (media?.url || '');
                  if (url) {
                    editor.chain().focus().setImage({ src: url }).run();
                    setIsMediaModalOpen(false);
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
