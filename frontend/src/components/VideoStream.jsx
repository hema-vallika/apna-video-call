import { useRef } from "react";
import { useEffect } from "react";

function VideoStream({ stream, socketId }) {
  const videoRef = useRef();
  //   console.log("VideoStream component rendered", video);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]); 

  return (
    <div className="peers_video_container">
      <video ref={videoRef} autoPlay playsInline />
      <div className="peer_name">{socketId}</div>
    </div>
  );
}

export default VideoStream;
