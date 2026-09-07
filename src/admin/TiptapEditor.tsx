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
  Bold, Italic, Strikethrough, Code, Link as LinkIcon, Image as ImageIcon, 
  List, ListOrdered, AlignLeft, AlignCenter, AlignRight, AlignJustify, 
  Quote, Minus, Undo, Redo, Palette
} from 'lucide-react';
import './TiptapEditor.css'; // We'll create this to style the prosemirror div to have white background and black text

interface TiptapEditorProps {
  value: string;
  onChange: (content: string) => void;
}

export default function TiptapEditor({ value, onChange }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
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
      onChange(editor.getHTML());
    },
  });

  if (!editor) {
    return null;
  }

  const addImage = () => {
    const url = window.prompt('URL');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) {
      return;
    }
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const toolbarBtnStyle = (isActive: boolean) => ({
    background: isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
    border: 'none',
    color: isActive ? '#4ade80' : 'rgba(255, 255, 255, 0.7)',
    padding: '6px',
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s'
  });

  const dividerStyle = {
    width: '1px',
    height: '24px',
    background: 'rgba(255, 255, 255, 0.1)',
    margin: '0 8px'
  };

  const selectStyle = {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: 'rgba(255, 255, 255, 0.9)',
    padding: '4px 8px',
    borderRadius: '15px',
    fontSize: '0.85rem',
    cursor: 'pointer',
    outline: 'none',
  };

  return (
    <div style={{ borderRadius: '12px', background: '#1a1a1a', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', width: '100%' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', background: '#1e1f22', borderBottom: '1px solid rgba(255,255,255,0.05)', flexWrap: 'wrap', gap: '4px' }}>
        
        {/* Dropdowns */}
        <select style={selectStyle} defaultValue="100%">
          <option>100%</option>
          <option>75%</option>
          <option>50%</option>
        </select>
        
        <select 
          style={selectStyle}
          onChange={(e) => {
            const val = e.target.value;
            if (val === 'p') editor.chain().focus().setParagraph().run();
            else editor.chain().focus().toggleHeading({ level: parseInt(val) as any }).run();
          }}
        >
          <option value="p">Normal text</option>
          <option value="1">Heading 1</option>
          <option value="2">Heading 2</option>
          <option value="3">Heading 3</option>
        </select>

        <select 
          style={selectStyle}
          onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}
        >
          <option value="Inter">Default...</option>
          <option value="Arial">Arial</option>
          <option value="Courier New">Courier</option>
          <option value="Times New Roman">Times</option>
        </select>

        <select style={selectStyle} defaultValue="size">
          <option value="size">Size</option>
        </select>

        <div style={dividerStyle} />

        {/* Formatting */}
        <button onClick={() => editor.chain().focus().toggleBold().run()} style={toolbarBtnStyle(editor.isActive('bold'))} title="Bold"><Bold size={16} /></button>
        <button onClick={() => editor.chain().focus().toggleItalic().run()} style={toolbarBtnStyle(editor.isActive('italic'))} title="Italic"><Italic size={16} /></button>
        <button onClick={() => editor.chain().focus().toggleStrike().run()} style={toolbarBtnStyle(editor.isActive('strike'))} title="Strikethrough"><Strikethrough size={16} /></button>
        <button onClick={() => editor.chain().focus().toggleCode().run()} style={toolbarBtnStyle(editor.isActive('code'))} title="Code"><Code size={16} /></button>
        
        {/* Color */}
        <label style={{ ...toolbarBtnStyle(false), cursor: 'pointer' }} title="Text Color">
          <Palette size={16} />
          <input 
            type="color" 
            onInput={(e: any) => editor.chain().focus().setColor(e.target.value).run()}
            style={{ opacity: 0, width: 0, height: 0, padding: 0, border: 'none', position: 'absolute' }}
          />
        </label>

        <div style={dividerStyle} />

        {/* Media/Links */}
        <button onClick={setLink} style={toolbarBtnStyle(editor.isActive('link'))} title="Link"><LinkIcon size={16} /></button>
        <button onClick={addImage} style={toolbarBtnStyle(false)} title="Image"><ImageIcon size={16} /></button>

        <div style={dividerStyle} />

        {/* Lists */}
        <button onClick={() => editor.chain().focus().toggleBulletList().run()} style={toolbarBtnStyle(editor.isActive('bulletList'))} title="Bullet List"><List size={16} /></button>
        <button onClick={() => editor.chain().focus().toggleOrderedList().run()} style={toolbarBtnStyle(editor.isActive('orderedList'))} title="Ordered List"><ListOrdered size={16} /></button>

        <div style={dividerStyle} />

        {/* Alignment */}
        <button onClick={() => editor.chain().focus().setTextAlign('left').run()} style={toolbarBtnStyle(editor.isActive({ textAlign: 'left' }))} title="Align Left"><AlignLeft size={16} /></button>
        <button onClick={() => editor.chain().focus().setTextAlign('center').run()} style={toolbarBtnStyle(editor.isActive({ textAlign: 'center' }))} title="Align Center"><AlignCenter size={16} /></button>
        <button onClick={() => editor.chain().focus().setTextAlign('right').run()} style={toolbarBtnStyle(editor.isActive({ textAlign: 'right' }))} title="Align Right"><AlignRight size={16} /></button>
        <button onClick={() => editor.chain().focus().setTextAlign('justify').run()} style={toolbarBtnStyle(editor.isActive({ textAlign: 'justify' }))} title="Justify"><AlignJustify size={16} /></button>

        <div style={dividerStyle} />

        {/* Block */}
        <button onClick={() => editor.chain().focus().toggleBlockquote().run()} style={toolbarBtnStyle(editor.isActive('blockquote'))} title="Blockquote"><Quote size={16} /></button>
        <button onClick={() => editor.chain().focus().setHorizontalRule().run()} style={toolbarBtnStyle(false)} title="Horizontal Rule"><Minus size={16} /></button>

        {/* History (Right Aligned) */}
        <div style={{ display: 'flex', marginLeft: 'auto', gap: '4px' }}>
          <button onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} style={{...toolbarBtnStyle(false), opacity: editor.can().undo() ? 1 : 0.5}} title="Undo"><Undo size={16} /></button>
          <button onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} style={{...toolbarBtnStyle(false), opacity: editor.can().redo() ? 1 : 0.5}} title="Redo"><Redo size={16} /></button>
        </div>
      </div>
      
      {/* Editor Area */}
      <div style={{ background: '#ffffff', color: '#000000', minHeight: '300px' }}>
        <EditorContent editor={editor} className="tiptap-white-editor" />
      </div>
    </div>
  );
}
