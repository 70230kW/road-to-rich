import { useEffect, useState } from 'react';
import { CloudOff } from 'lucide-react';

export function OnlineStatusBar() {
  const [online, setOnline] = useState(() => typeof navigator === 'undefined' || navigator.onLine);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  if (online) return null;
  return (
    <div className="offline-status" role="status">
      <CloudOff size={15} />
      <span>オフラインです。入力途中の内容はこの端末に一時保存されます。</span>
    </div>
  );
}
