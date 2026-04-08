import React, { useEffect, useState } from 'react';
import './CinematicStage.css';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

const CinematicStage = () => {
  const [videoUrl, setVideoUrl] = useState(''); // no default

  useEffect(() => {
    // Load directly from Firestore - uploaded videos take priority
    const ref = doc(db, 'siteConfig', 'videos');
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const data = snap.exists() ? snap.data() : {};
        const nextUrl = data?.stageVideoUrl || '';
        console.log('[Stage Video] Firestore data:', data);
        console.log('[Stage Video] Setting URL to:', nextUrl);
        setVideoUrl(nextUrl);
      },
      (error) => {
        console.error('[Stage Video] Error loading from Firestore:', error);
      }
    );

    return () => unsub();
  }, []);

  if (!videoUrl) return null;

  return (
    <main className="stage-root ">
      <video
        key={videoUrl}
        className="stage-video"
        autoPlay
        loop
        muted
        playsInline
        src={videoUrl}
      />
    </main>
  );
};

export default CinematicStage;
