import React from 'react';
import { useNavigate } from 'react-router';

function Draft() {
  const navigate = useNavigate();
  const drafts = JSON.parse(localStorage.getItem("drafts") || "[]");

  const loadDraft = (draft) => {
    navigate('/write', { state: { draft } });
  };

  const deleteDraft = (id) => {
    const updated = drafts.filter(d => d.id !== id);
    localStorage.setItem("drafts", JSON.stringify(updated));
    window.location.reload();
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Your Drafts</h1>
      {drafts.length === 0 && <p>No drafts saved yet.</p>}
      <div className="space-y-4">
        {drafts.map(draft => (
          <div key={draft.id} className="p-4 bg-white rounded shadow flex justify-between items-center">
            <div>
              <h2 className="font-semibold text-lg">{draft.title || "Untitled Draft"}</h2>
              <p className="text-sm text-gray-500">Saved at: {new Date(draft.savedAt).toLocaleString()}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => loadDraft(draft)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Edit</button>
              <button onClick={() => deleteDraft(draft.id)} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Draft;
