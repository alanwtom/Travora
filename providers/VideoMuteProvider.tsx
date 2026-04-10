import React, { createContext, useContext, useState } from 'react';

type VideoMuteContextValue = {
  isMuted: boolean;
  toggleMute: () => void;
  setMuted: (muted: boolean) => void;
};

const VideoMuteContext = createContext<VideoMuteContextValue>({
  isMuted: false,
  toggleMute: () => {},
  setMuted: () => {},
});

export function VideoMuteProvider({ children }: { children: React.ReactNode }) {
  const [isMuted, setIsMuted] = useState(false);

  const toggleMute = () => setIsMuted((prev) => !prev);
  const setMuted = (muted: boolean) => setIsMuted(muted);

  return (
    <VideoMuteContext.Provider value={{ isMuted, toggleMute, setMuted }}>
      {children}
    </VideoMuteContext.Provider>
  );
}

export function useVideoMute() {
  return useContext(VideoMuteContext);
}
