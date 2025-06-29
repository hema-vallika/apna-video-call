import React, { createContext, useState, useContext, useRef } from "react";
const MediaContext = createContext();

export const MediaProvider = ({ children }) => {
  const [peer, setPeer] = useState(null);
  const [myPeerId, setMyPeerId] = useState("");
  const [remotePeerId, setRemotePeerId] = useState("");
  
  const localVideo = useRef();
  const remoteVideos = useRef();
  
  const localStream = useRef();
  const [streams, setStreams] = useState({});

  const [duration, setDuration] = useState(0);
  const intervalRef = useRef(null);

  const startTimer = () => {
    setDuration(0);
    intervalRef.current = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    clearInterval(intervalRef.current);
    // setDuration(0);
  };

  return (
    <MediaContext.Provider
      value={{
        peer,
        setPeer,
        myPeerId,
        setMyPeerId,
        remotePeerId,
        setRemotePeerId,
        duration,
        startTimer,
        stopTimer
      }}
    >
      {children}
    </MediaContext.Provider>
  );
};

export const useMedia = () => useContext(MediaContext);