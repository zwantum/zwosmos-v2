import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, Strikethrough, List, ListOrdered, Quote, Heading2 } from 'lucide-react';

interface TiptapEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export default function TiptapEditor({ value, onChange }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) {
    return null;
  }

  const toolbarBtnStyle = (isActive: boolean) => ({
    background: isActive ? 'var(--brand-purple)' : 'transparent',
    border: '1px solid rgba(255,255,255,0.2)',
    color: 'white',
    padding: '6px',
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  });

  return (
    <div style={{ border: '1px solid rgba(255,255,255,0.2)', borderRadius: '5px', background: 'rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', gap: '5px', padding: '10px', borderBottom: '1px solid rgba(255,255,255,0.2)', flexWrap: 'wrap' }}>
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          style={toolbarBtnStyle(editor.isActive('bold'))}
          type="button"
          title="Bold"
        >
          <Bold size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          style={toolbarBtnStyle(editor.isActive('italic'))}
          type="button"
          title="Italic"
        >
          <Italic size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          style={toolbarBtnStyle(editor.isActive('strike'))}
          type="button"
          title="Strikethrough"
        >
          <Strikethrough size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          style={toolbarBtnStyle(editor.isActive('heading', { level: 2 }))}
          type="button"
          title="Heading 2"
        >
          <Heading2 size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          style={toolbarBtnStyle(editor.isActive('bulletList'))}
          type="button"
          title="Bullet List"
        >
          <List size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          style={toolbarBtnStyle(editor.isActive('orderedList'))}
          type="button"
          title="Ordered List"
        >
          <ListOrdered size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          style={toolbarBtnStyle(editor.isActive('blockquote'))}
          type="button"
          title="Blockquote"
        >
          <Quote size={16} />
        </button>
      </div>
      
      <div style={{ padding: '15px', minHeight: '150px', color: 'white' }}>
        <EditorContent editor={editor} style={{ outline: 'none' }} />
      </div>
    </div>
  );
}
