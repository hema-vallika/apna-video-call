import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import { Badge, IconButton, TextField } from "@mui/material";
import { Button } from "@mui/material";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import CallEndIcon from "@mui/icons-material/CallEnd";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import StopScreenShareIcon from "@mui/icons-material/StopScreenShare";
import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import VideoStream from "../components/VideoStream";
import ChatIcon from "@mui/icons-material/Chat";
import { useParams } from "react-router-dom";

const server_url = process.env.REACT_APP_BACKEND_URL;
var connections = {};

const peerConfigConnections = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export default function VideoMeetComponent() {
  let socket = useRef();
  let socketId = useRef();
  let localStream = useRef();
  let localVideoRef = useRef();
  let [videoAvailable, setVideoAvailable] = useState(false); // Is video permission available
  let [audioAvailable, setAudioAvailable] = useState(false); // Is audio permission available
  let [video, setVideo] = useState(videoAvailable); // toggle video on/off
  let [audio, setAudio] = useState(audioAvailable); // toggle audio on/off
  let [screen, setScreen] = useState(false); 
  let [showModal, setShowModal] = useState(false); 
  let [screenAvailable, setScreenAvailable] = useState(); 
  let [message, setMessage] = useState(""); 
  let [messages, setMessages] = useState([]); 
  let [newMessages, setNewMessages] = useState(0); 
  let [askForUsername, setAskForUsername] = useState(true); 
  let [username, setUsername] = useState(""); 
  let [videos, setVideos] = useState([]); 
  let videoRef = useRef([]);
  const { roomId } = useParams();

  const getPermissions = async () => {
    try {
      // Check if screen share is available
      setScreenAvailable(!!navigator.mediaDevices.getDisplayMedia);

      // Try to get both audio and video at once
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      // Check what was actually granted
      const videoAvailable = mediaStream.getVideoTracks().length > 0;
      const audioAvailable = mediaStream.getAudioTracks().length > 0;

      setVideoAvailable(videoAvailable);
      setAudioAvailable(audioAvailable);

      if (videoAvailable || audioAvailable) {
        // localStream.current = mediaStream;
        localStream.current = mediaStream;

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream.current;
        }
      }
    } catch (error) {
      console.log("Error in getPermissions: ", error);
      setVideoAvailable(false);
      setAudioAvailable(false);
      setScreenAvailable(false);
    }
  };

  const toggleAudio = () => {
    setAudio(!audio);
    const audioTrack = localStream.current.getAudioTracks()[0];
    audioTrack.enabled = !audioTrack.enabled;
  };

  const toggleVideo = () => {
    setVideo(!video);
    const videoTrack = localStream.current.getVideoTracks()[0];
    videoTrack.enabled = !videoTrack.enabled;
  };

  useEffect(() => {
    getPermissions();
  }, []);

  const gotSignalFromServer = (fromId, message) => {
    let signal = JSON.parse(message);
    //neha se reply
    if (fromId !== socketId.current) {
      //fromId hein wo mein nhi hun mein apne aap ko kaise msg karu
      if (signal.sdp) {
        //sdp means session description protocol fromId meand id2
        connections[fromId]
          .setRemoteDescription(new RTCSessionDescription(signal.sdp))
          .then(() => {
            //sessionDescription yaha padh rhe hein
            if (signal.sdp.type === "offer") {
              connections[fromId]
                .createAnswer()
                .then((description) => {
                  connections[fromId]
                    .setLocalDescription(description)
                    .then(() => {
                      socket.current.emit(
                        "signal",
                        fromId,
                        JSON.stringify({
                          sdp: connections[fromId].localDescription,
                        })
                      );
                    })
                    .catch((e) => console.log(e));
                })
                .catch((e) => console.log(e));
            }
          })
          .catch((e) => console.log(e));
      }

      if (signal.ice) {
        //initial connection establishment ke liye
        connections[fromId]
          .addIceCandidate(new RTCIceCandidate(signal.ice))
          .catch((e) => console.log(e));
      }
    }
  };

  // Connect to the socket server
  let connectToSocketServer = () => {
    socket.current = io.connect(server_url, { secure: false });

    socket.current.on("signal", gotSignalFromServer);

    socket.current.on("connect", () => {
      socket.current.emit("join-call", roomId);
      socketId.current = socket.current.id;

      socket.current.on("chat-message", addMessage);

      socket.current.on("user-left", (id) => {
        setVideos((videos) => videos.filter((video) => video.socketId !== id));
      });

      socket.current.on("user-joined", (id, clients) => {
        clients.forEach((socketListId) => {
          connections[socketListId] = new RTCPeerConnection(
            peerConfigConnections
          );
          // Wait for their ice candidate
          connections[socketListId].onicecandidate = function (event) {
            //ice meant protocol ye asal mein ek client and dusre client ke beech mein direct connection banane mein madad karta hai
            if (event.candidate != null) {
              socket.current.emit(
                "signal",
                socketListId,
                JSON.stringify({ ice: event.candidate })
              );
            }
          };

          // Wait for their video stream
          connections[socketListId].onaddstream = (event) => {
            // console.log("BEFORE:", videoRef.current);
            // console.log("FINDING ID: ", socketListId);

            let videoExists = videoRef.current.find(
              (video) => video.socketId === socketListId
            ); //agar video exist karta hein toh uska stream update karenge nhi toh naya video create karenge

            if (videoExists) {
              //   console.log("FOUND EXISTING");

              // Update the stream of the existing video
              setVideos((videos) => {
                const updatedVideos = videos.map(
                  (video) =>
                    video.socketId === socketListId
                      ? { ...video, stream: event.stream }
                      : video //ye async function hein toh ismein setVideos use karna padega aur hum direct nhi kar sakte videoRef ka use karni padegi
                );
                videoRef.current = updatedVideos; //ye instantaneous update hoga
                return updatedVideos;
              });
            } else {
              // Create a new video
              //   console.log("CREATING NEW");
              let newVideo = {
                socketId: socketListId,
                stream: event.stream,
                autoplay: true,
                playsinline: true,
              };

              setVideos((videos) => {
                const updatedVideos = [...videos, newVideo];
                videoRef.current = updatedVideos;
                return updatedVideos;
              });
            }
          };

          // Add the local video stream
          if (
            localStream.current !== undefined &&
            localStream.current !== null
          ) {
            connections[socketListId].addStream(localStream.current);
          } else {
            //jab bhikoi video off karega black screen dikhane ke liye
            // let blackSilence = (...args) =>
            //   new MediaStream([black(...args), silence()]);
            // localStream.current = blackSilence();
            connections[socketListId].addStream(localStream.current);
          }
        });

        if (id === socketId.current) {
          for (let id2 in connections) {
            //connections mein sabka socket id list ho rha hein
            if (id2 === socketId.current) continue; //khud ke sath kya hin connect karungi

            try {
              connections[id2].addStream(localStream.current);
            } catch (e) {}

            connections[id2].createOffer().then((description) => {
              connections[id2]
                .setLocalDescription(description)
                .then(() => {
                  socket.current.emit(
                    "signal",
                    id2,
                    JSON.stringify({ sdp: connections[id2].localDescription })
                  );
                })
                .catch((e) => console.log(e));
            });
          }
        }
      });
    });
  };

  const getUserMediaSuccess = (stream) => {
    // Stop any existing local stream
    try {
      localStream.current?.getTracks().forEach((track) => track.stop());
    } catch (err) {
      console.log("Error stopping previous stream:", err);
    }

    // Set and display new stream
    localStream.current = stream;
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }

    // Send stream to all peers except self
    for (const id in connections) {
      if (id === socketId.current) continue;
      const peer = connections[id];

      try {
        peer.addStream(localStream.current);
        peer
          .createOffer()
          .then((desc) => peer.setLocalDescription(desc))
          .then(() => {
            socket.current.emit(
              "signal",
              id,
              JSON.stringify({ sdp: peer.localDescription })
            );
          })
          .catch((err) => console.error("Offer/SDP error:", err));
      } catch (err) {
        console.error("Error adding stream to peer:", err);
      }
    }

    // Handle when stream ends (e.g., camera unplugged or permission revoked)
    stream.getTracks().forEach((track) => {
      track.onended = () => {
        setVideo(false);
        setAudio(false);

        toggleAudio();
        toggleVideo();
      };
    });
  };

  let getUserMedia = () => {
    const shouldGetMedia =
      (video && videoAvailable) || (audio && audioAvailable);

    if (shouldGetMedia) {
      navigator.mediaDevices
        .getUserMedia({ video, audio })
        .then((stream) => {
          getUserMediaSuccess(stream);
        })
        .catch((error) => {
          console.error("Error getting user media:", error);
        });
    } else {
      // Stop any existing media stream if video/audio is turned off
      const videoElement = localVideoRef.current;
      if (videoElement?.srcObject) {
        const tracks = videoElement.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
        videoElement.srcObject = null;
      }
    }
  };

  // Custom function to handle screen sharing
  let getDisplayMediaSuccess = (stream) => {
    try {
      // Stop previous local stream
      if (localStream.current) {
        localStream.current.getTracks().forEach((track) => track.stop());
      }
    } catch (e) {
      console.log("Error stopping previous stream:", e);
    }

    localStream.current = stream;
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }

    for (let id in connections) {
      if (id === socketId.current) continue;

      // Replace existing stream with new screen stream
      connections[id].addStream(localStream.current);

      connections[id].createOffer().then((description) => {
        connections[id]
          .setLocalDescription(description)
          .then(() => {
            socket.current.emit(
              "signal",
              id,
              JSON.stringify({ sdp: connections[id].localDescription })
            );
          })
          .catch((e) => console.log("Error setting local description:", e));
      });
    }

    // When screen share ends, revert to camera
    stream.getTracks().forEach((track) => {
      track.onended = () => {
        setScreen(false);

        try {
          localVideoRef.current?.srcObject
            ?.getTracks()
            .forEach((t) => t.stop());
        } catch (e) {
          console.log("Error cleaning up after screen share ends:", e);
        }

        // Revert to webcam/mic
        getUserMedia();
      };
    });
  };

  // Check if the browser supports screen sharing
  let getDisplayMedia = () => {
    if (screen) {
      navigator.mediaDevices
        .getDisplayMedia({ video: true, audio: true })
        .then((stream) => {
          getDisplayMediaSuccess(stream); // Your custom function to handle screen sharing
        })
        .catch((e) => {
          console.log("Error getting display media:", e);
        });
    } else {
      // Stop screen sharing and revert to local camera/mic
      getUserMedia();
    }
  };

  useEffect(() => {
    getDisplayMedia();
  }, [screen]);

  const handleEndCall = () => {
    try {
      // 1. Stop all media tracks
      const videoElement = localVideoRef.current;
      if (videoElement?.srcObject) {
        videoElement.srcObject.getTracks().forEach((track) => track.stop());
        videoElement.srcObject = null;
      }

      // 2. Close all peer connections
      for (const id in connections) {
        try {
          connections[id].close();
        } catch (e) {
          console.warn(`Error closing connection ${id}:`, e);
        }
        delete connections[id]; // clean up
      }

      // 3. Inform other peers (optional)
      socket.current.emit("leave-call", socketId.current); // Backend should handle and broadcast if needed

      // 4. Reset localStream
      if (localStream.current) {
        localStream.current.getTracks().forEach((track) => track.stop());
        localStream.current = null;
      }

      // 5. Redirect
      window.location.href = "/";
    } catch (error) {
      console.error("Error ending call:", error);
    }
  };

  const addMessage = (data, sender, socketIdSender) => {
    console.log("Received message:", data, "from:", sender, "socketIdSender:", socketIdSender);
    setMessages((prevMessages) => [
      ...prevMessages,
      { sender: sender, data: data },
    ]);
    console.log();
    
    
    if(showModal){
      setNewMessages(0);
    } else {
      setNewMessages((prevCount) => prevCount + 1);
    }
  };


  let sendMessage = (e) => {
    // console.log(socket.current);
    e.preventDefault()
    socket.current.emit("chat-message", message, username);
    setMessage("");

    // this.setState({ message: "", sender: username })
  };

  let connect = () => {
    setAskForUsername(false);
    console.log(
      "Connecting with username: ",
      username,
      videoAvailable,
      audioAvailable
    );

    setVideo(videoAvailable);
    setAudio(audioAvailable);
    connectToSocketServer();
  };
  

  return (
    <div className="username_lobby">
      {askForUsername === true ? (
        <div className="username_lobby_container">
          <div className="username_lobby_left_container ">
            <div className="">
              <video
                className="video_box"
                ref={localVideoRef}
                autoPlay
                muted
              ></video>
            </div>
            <div className="">
              <IconButton onClick={toggleVideo} style={{ color: "black" }}>
                {video === true ? <VideocamOffIcon /> : <VideocamIcon />}
              </IconButton>
              <IconButton onClick={toggleAudio} style={{ color: "black" }}>
                {audio === true ? <MicOffIcon /> : <MicIcon />}
              </IconButton>
            </div>
          </div>

          <div className="username_lobby_right_container">
            <h2 className="username_input_label">Enter into Lobby </h2>
            <div className="username_input_box">
              <TextField
                id="outlined-basic"
                label="Enter Your Username..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                variant="outlined"
              />
              <Button type="button" variant="contained" onClick={connect}>
                Connect
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="meetVideoContainer">
          <div className="conference_container">
            <div className="conferenceView ">
              
                <video
                 className="meetUserVideo"
                  ref={localVideoRef}
                  autoPlay
                  muted
                ></video>
             

              <div className="otherSide">
                <div className="otherSideVideo">
                  {videos.map((video) => (
                    <VideoStream
                      key={video.socketId}
                      stream={video.stream}
                      socketId={video.socketId}
                    />
                  ))}
              

                </div>
              </div>
            </div>
            {showModal && (
              <div className="chatRoom">
                <h1 className="chat_title">Chat</h1>
                <div className="chatContainer">
                  <div className="chattingDisplay">
                    {messages.length !== 0 ? (
                      messages.map((item, index) => {
                        // console.log(messages)
                        return (
                          <div style={{ marginBottom: "20px" }} key={index}>
                            <p style={{ fontWeight: "bold", color: "brown" }}>
                              {item.sender}
                            </p>
                            <p>{item.data}</p>
                          </div>
                        );
                      })
                    ) : (
                      <p>No Messages Yet</p>
                    )}
                  </div>
                </div>
                <div className="chattingArea">
                <form onSubmit={sendMessage}>
                  <TextField
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    id="outlined-basic"
                    label="Enter Your chat"
                    variant="outlined"
                  />
                  <Button variant="contained" type="submit">
                    Send
                  </Button>
                  </form>
                </div>
              </div>
            )}
          </div>

          <div className="buttonContainers">
            <IconButton onClick={toggleVideo} style={{ color: "white" }}>
              {video === true ? <VideocamIcon /> : <VideocamOffIcon />}
            </IconButton>
            <IconButton onClick={toggleAudio} style={{ color: "white" }}>
              {audio === true ? <MicIcon /> : <MicOffIcon />}
            </IconButton>
            <IconButton onClick={handleEndCall} style={{ color: "red" }}>
              <CallEndIcon />
            </IconButton>

            {screenAvailable && (
              <IconButton
                onClick={() => setScreen((screen) => !screen)}
                style={{ color: "white" }}
              >
                {screen === true ? (
                  <ScreenShareIcon />
                ) : (
                  <StopScreenShareIcon />
                )}
              </IconButton>
            )}

            <Badge badgeContent={newMessages} max={999} color="secondary">
              <IconButton
                onClick={() => {
                  setShowModal(!showModal)
                  setNewMessages(0); // Reset new messages count when chat is opened
                }}
                style={{ color: "white" }}
              >
                <ChatIcon />{" "}
              </IconButton>
            </Badge>
          </div>
        </div>
      )}
    </div>
  );
}
