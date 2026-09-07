import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Trash2 } from 'lucide-react';

export default function FactsManager() {
  const [facts, setFacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [bulkInput, setBulkInput] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchFacts();
  }, []);

  const fetchFacts = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    const { data, error } = await supabase.from('facts').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      setFacts(data);
    }
    setLoading(false);
  };

  const handleBulkAdd = async () => {
    if (!supabase || !bulkInput.trim()) return;

    const newFacts = bulkInput
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(content => ({ content }));

    if (newFacts.length === 0) return;

    const { error } = await supabase.from('facts').insert(newFacts);
    if (!error) {
      setBulkInput('');
      setIsAdding(false);
      fetchFacts();
    } else {
      alert('Error adding facts: ' + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!supabase) return;
    if (confirm('Are you sure you want to delete this fact?')) {
      await supabase.from('facts').delete().eq('id', id);
      fetchFacts();
    }
  };

  if (isAdding) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Bulk Add Facts</h2>
          <button onClick={() => setIsAdding(false)} style={{ background: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '8px 16px', borderRadius: '5px', cursor: 'pointer' }}>Cancel</button>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>Paste multiple facts here, each on a new line.</p>
        <textarea
          value={bulkInput}
          onChange={e => setBulkInput(e.target.value)}
          placeholder="Fact 1\nFact 2\nFact 3"
          style={{
            width: '100%',
            height: '200px',
            padding: '12px',
            borderRadius: '5px',
            border: '1px solid rgba(255,255,255,0.2)',
            background: 'rgba(0,0,0,0.2)',
            color: 'white',
            outline: 'none',
            fontFamily: 'inherit',
            resize: 'vertical'
          }}
        />
        <button onClick={handleBulkAdd} style={{ background: 'var(--brand-purple)', color: 'white', border: 'none', padding: '12px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Add Facts</button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Existing Facts</h2>
        <button onClick={() => setIsAdding(true)} style={{ background: 'var(--brand-purple)', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '5px', cursor: 'pointer' }}>
          Bulk Add
        </button>
      </div>

      {loading ? (
        <p>Loading facts...</p>
      ) : facts.length === 0 ? (
        <p style={{ color: 'rgba(255,255,255,0.5)' }}>No facts found.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {facts.map((fact, index) => (
            <div key={fact.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-dark-purple)', padding: '15px', borderRadius: '5px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ flex: 1, paddingRight: '20px' }}>
                <span style={{ color: 'var(--brand-purple)', marginRight: '10px', fontWeight: 'bold' }}>#{index + 1}</span>
                {fact.content}
              </div>
              <button onClick={() => handleDelete(fact.id)} style={{ background: 'transparent', border: 'none', color: '#ff6b6b', cursor: 'pointer', padding: '5px' }}>
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
