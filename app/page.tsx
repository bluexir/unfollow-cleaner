'use client';
import { useEffect, useState } from 'react';

export default function UnfollowCleaner() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<number | null>(null);

  // Listeyi yükleme fonksiyonu
  const loadList = async () => {
    setLoading(true);
    const res = await fetch('/api/check-unfollowers');
    const data = await res.json();
    setList(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { loadList(); }, []);

  // Takipten çıkma buton fonksiyonu
  const handleUnfollow = async (targetFid: number) => {
    setIsProcessing(targetFid);
    const res = await fetch('/api/unfollow', {
      method: 'POST',
      body: JSON.stringify({ targetFid }),
    });

    if (res.ok) {
      // Başarılıysa listeden o kişiyi kaldır
      setList(prev => prev.filter(user => user.fid !== targetFid));
    } else {
      alert('Takipten çıkma işlemi başarısız oldu.');
    }
    setIsProcessing(null);
  };

  if (loading) return <div className="p-10 text-center font-bold">Liste Hazırlanıyor...</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 font-sans">
      <h1 className="text-3xl font-bold mb-4">Takip Etmeyenler ({list.length})</h1>
      <div className="space-y-3">
        {list.length === 0 ? (
          <p className="text-center p-10 text-green-600 font-bold">Tebrikler! Takip etmeyen kimse kalmadı.</p>
        ) : (
          list.map((user) => (
            <div key={user.fid} className="flex items-center justify-between p-4 bg-white border rounded-xl shadow-sm">
              <div className="flex items-center gap-3">
                <img src={user.pfp_url} className="w-12 h-12 rounded-full shadow-sm" alt="" />
                <div>
                  <p className="font-bold">{user.display_name}</p>
                  <p className="text-gray-500 text-sm">@{user.username}</p>
                </div>
              </div>
              <button 
                disabled={isProcessing === user.fid}
                className={`${isProcessing === user.fid ? 'bg-gray-400' : 'bg-red-500 hover:bg-red-600'} text-white px-4 py-2 rounded-lg text-sm font-bold transition-all`}
                onClick={() => handleUnfollow(user.fid)}
              >
                {isProcessing === user.fid ? 'İşleniyor...' : 'Takipten Çık'}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
