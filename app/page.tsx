'use client';
import { useEffect, useState } from 'react';

export default function UnfollowCleaner() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const fetchList = async () => {
    try {
      const res = await fetch('/api/check-unfollowers');
      const data = await res.json();
      setList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Liste yüklenemedi", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchList(); }, []);

  const handleUnfollow = async (targetFid: number) => {
    setProcessingId(targetFid);
    try {
      const res = await fetch('/api/unfollow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetFid }),
      });

      if (res.ok) {
        setList(prev => prev.filter(user => user.fid !== targetFid));
      } else {
        alert('Takipten çıkılamadı.');
      }
    } catch (err) {
      alert('Bir hata oluştu.');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <div className="p-10 text-center">Yükleniyor...</div>;

  return (
    <div className="max-w-xl mx-auto p-5">
      <h1 className="text-2xl font-bold mb-5 text-red-600 underline">Takip Etmeyenler ({list.length})</h1>
      <div className="space-y-4">
        {list.map((user) => (
          <div key={user.fid} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
            <div className="flex items-center gap-3">
              <img src={user.pfp_url} className="w-10 h-10 rounded-full" alt="" />
              <div>
                <p className="font-bold">{user.display_name}</p>
                <p className="text-xs text-gray-500">@{user.username}</p>
              </div>
            </div>
            <button 
              disabled={processingId === user.fid}
              onClick={() => handleUnfollow(user.fid)}
              className="bg-black text-white px-4 py-2 rounded text-xs font-bold disabled:bg-gray-400"
            >
              {processingId === user.fid ? 'Siliniyor...' : 'Takipten Çık'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
