import { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
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
  Quote, Minus, Undo, Redo, Palette, X
} from 'lucide-react';
import { MediaLibrary } from '@zwantum/blog/admin';
import { blogClient } from '../lib/blogClient';
import './TiptapEditor.css';

interface TiptapEditorProps {
  value: string;
  onChange: (content: string) => void;
  minHeight?: string;
}

export default function TiptapEditor({ value, onChange, minHeight = '180px' }: TiptapEditorProps) {
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [isLinkBoxOpen, setIsLinkBoxOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const lastEmittedRef = useRef(value);

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
    ],
    content: value,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      lastEmittedRef.current = html;
      onChange(html);
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (value !== undefined && value !== lastEmittedRef.current) {
      lastEmittedRef.current = value;
      if (editor.getHTML() !== value) {
        editor.commands.setContent(value, false);
      }
    }
  }, [value, editor]);

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
      {/* Light Dashboard Theme Toolbar (NO black background) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '8px 12px',
          background: '#f8fafc',
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

      {/* Clean White Editor Content Area */}
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
