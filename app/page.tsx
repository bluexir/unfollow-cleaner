'use client';

import { useState, useEffect } from 'react';

export default function UnfollowCleaner() {
  const [unfollowers, setUnfollowers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUnfollowing, setIsUnfollowing] = useState<number | null>(null);

  useEffect(() => {
    async function fetchUnfollowers() {
      try {
        console.log("Liste çekiliyor...");
        const response = await fetch('/api/check-unfollowers');
        const data = await response.json();
        
        if (Array.isArray(data)) {
          setUnfollowers(data);
        } else {
          console.error("Gelen veri dizi değil:", data);
        }
      } catch (error) {
        console.error('Liste çekme hatası:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchUnfollowers();
  }, []);

  const handleUnfollow = async (targetFid: number) => {
    setIsUnfollowing(targetFid);
    try {
      const response = await fetch('/api/unfollow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ targetFid }),
      });

      if (response.ok) {
        // Başarılı olursa listeden çıkar
        setUnfollowers(prev => prev.filter(u => u.fid !== targetFid));
        alert('Takipten çıkıldı.');
      } else {
        const errorData = await response.json();
        alert(`Hata: ${errorData.error || 'İşlem başarısız'}`);
      }
    } catch (error) {
      console.error('İşlem hatası:', error);
      alert('Takipten çıkarken bir hata oluştu.');
    } finally {
      setIsUnfollowing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-xl font-semibold text-gray-600">Takip etmeyenler listeleniyor, lütfen bekleyin...</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white min-h-screen shadow-sm">
      <div className="flex items-center justify-between mb-8 border-b pb-4">
        <h1 className="text-2xl font-extrabold text-gray-900">
          Unfollow Cleaner <span className="text-red-500">({unfollowers.length})</span>
        </h1>
        <button 
          onClick={() => window.location.reload()} 
          className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-md transition-colors"
        >
          Yenile
        </button>
      </div>

      <div className="grid gap-4">
        {unfollowers.length === 0 ? (
          <div className="text-center p-12 bg-green-50 rounded-2xl">
            <p className="text-green-700 font-bold text-lg">Mükemmel! Seni takip etmeyen kimse yok.</p>
          </div>
        ) : (
          unfollowers.map((user) => (
            <div
              key={user.fid}
              className="flex items-center justify-between p-4 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-all shadow-sm"
            >
              <div className="flex items-center space-x-4">
                <img
                  src={user.pfp_url || 'https://via.placeholder.com/48'}
                  alt={user.username}
                  className="w-12 h-12 rounded-full border-2 border-white shadow-sm"
                />
                <div>
                  <h2 className="font-bold text-gray-900 leading-tight">{user.display_name}</h2>
                  <p className="text-gray-500 text-sm">@{user.username}</p>
                  <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">FID: {user.fid}</p>
                </div>
              </div>
              <button
                onClick={() => handleUnfollow(user.fid)}
                disabled={isUnfollowing === user.fid}
                className={`px-5 py-2 rounded-xl font-bold text-sm transition-all ${
                  isUnfollowing === user.fid
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-red-500 text-white hover:bg-red-600 active:scale-95 shadow-lg shadow-red-100'
                }`}
              >
                {isUnfollowing === user.fid ? 'İşleniyor...' : 'Takipten Çık'}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
