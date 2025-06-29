import React, { useContext, useState } from "react";
import withAuth from "../utils/wihAuth";
import { useNavigate } from "react-router-dom";
import "../App.css";
import { Button, IconButton, TextField } from "@mui/material";
import RestoreIcon from "@mui/icons-material/Restore";
import { AuthContext } from "../contexts/AuthContext";

function HomeComponent() {
  let navigate = useNavigate();
  const [meetingCode, setMeetingCode] = useState("");

  const { addToUserHistory } = useContext(AuthContext);
  
  let handleJoinVideoCall = async () => {
    await addToUserHistory(meetingCode);
    navigate(`/${meetingCode}`);
  };

  return (
    <>
      <div
        className="navbar"
        style={{ padding: "20px", backgroundColor: "#B8B8B8" }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <h2>Apna Video Call</h2>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <Button
            style={{
              backgroundColor: "#1565C0",
              color: "white",
            }}
            onClick={() => {
              navigate("/history");
            }}
          >
            <RestoreIcon />
            <p>History</p>
          </Button>

          <Button
            style={{
              backgroundColor: "#1565C0",
              color: "white",
            }}
            onClick={() => {
              localStorage.removeItem("token");
              navigate("/auth");
            }}
          >
            Logout
          </Button>
        </div>
      </div>

      <div
        className="home-container"
      >
        <div className="home_left_content">
          <h2 className="home_welcome_text" >
            Providing Quality Video Call Just Like Quality Education
          </h2>

          <div className="input_filds" >
            <TextField
              onChange={(e) => setMeetingCode(e.target.value)}
              id="outlined-basic"
              label="Meeting Code"
              variant="outlined"
              style={{ width: "300px" }}
            />
            <Button
              onClick={handleJoinVideoCall}
              variant="contained"
              style={{ width: "150px" }}
            >
              Join
            </Button>
          </div>
        </div>
        <div className="">
          <img srcSet="/logo3.png" style={{ width: "100%" }} alt="" />
        </div>
      </div>
    </>
  );
}

export default HomeComponent;
