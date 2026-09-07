import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

export default function BlogsManager() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [desc, setDesc] = useState('');
  const [img, setImg] = useState('');

  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
  });

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    const { data, error } = await supabase.from('blogs').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      setBlogs(data);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!supabase) return;
    
    const content = editor?.getHTML();
    const newBlog = { title, category, desc, img, content };

    const { error } = await supabase.from('blogs').insert([newBlog]);
    if (!error) {
      setIsEditing(false);
      resetForm();
      fetchBlogs();
    } else {
      alert('Error saving blog: ' + error.message);
    }
  };

  const resetForm = () => {
    setTitle('');
    setCategory('');
    setDesc('');
    setImg('');
    editor?.commands.setContent('');
  };

  if (isEditing) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Create New Blog</h2>
          <button onClick={() => setIsEditing(false)} style={{ background: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '8px 16px', borderRadius: '5px', cursor: 'pointer' }}>Cancel</button>
        </div>

        <input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} />
        <input placeholder="Category" value={category} onChange={e => setCategory(e.target.value)} style={inputStyle} />
        <textarea placeholder="Short Description" value={desc} onChange={e => setDesc(e.target.value)} style={{...inputStyle, height: '80px'}} />
        <input placeholder="Image URL (or implement uploader)" value={img} onChange={e => setImg(e.target.value)} style={inputStyle} />
        
        <div style={{ border: '1px solid rgba(255,255,255,0.2)', borderRadius: '5px', minHeight: '300px', padding: '10px', background: 'rgba(0,0,0,0.2)' }}>
          <EditorContent editor={editor} style={{ outline: 'none', color: 'white' }} />
        </div>

        <button onClick={handleSave} style={{ background: 'var(--brand-purple)', color: 'white', border: 'none', padding: '12px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Save Blog</button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Existing Blogs</h2>
        <button onClick={() => setIsEditing(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--brand-purple)', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '5px', cursor: 'pointer' }}>
          <Plus size={18} /> New Blog
        </button>
      </div>

      {loading ? (
        <p>Loading blogs...</p>
      ) : blogs.length === 0 ? (
        <p style={{ color: 'rgba(255,255,255,0.5)' }}>No blogs found. Create one!</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {blogs.map(blog => (
            <div key={blog.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-dark-purple)', padding: '15px', borderRadius: '5px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div>
                <h3 style={{ margin: '0 0 5px 0' }}>{blog.title}</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--brand-purple)' }}>{blog.category}</span>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}><Edit2 size={18} /></button>
                <button style={{ background: 'transparent', border: 'none', color: '#ff6b6b', cursor: 'pointer' }}><Trash2 size={18} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '12px',
  borderRadius: '5px',
  border: '1px solid rgba(255,255,255,0.2)',
  background: 'rgba(0,0,0,0.2)',
  color: 'white',
  outline: 'none',
  boxSizing: 'border-box' as const
};
