import React, { useState, useEffect } from "react";

import { Stack, Alert, Snackbar } from "@mui/material";
import Router from "./routes";
import ScrollToTop from "./components/scroll-to-top";
import { useSocket } from "./contexts/SocketContext";

export default function App() {
  const socket = useSocket();
  const [wsResponse, setWsResponse] = useState(null);

  useEffect(() => {
    socket.on("hello", (msg) => {
      console.log("hello", msg);
      setWsResponse(
        `Video ${msg.title} HLS conversion completed as ${msg.originalname}`
      );
    });
  }, [socket]);

  return (
    <>
      <ScrollToTop />
      <Router />
      <Stack>
        <Snackbar
          open={wsResponse}
          autoHideDuration={5000}
          onClose={() => {
            setWsResponse(null);
          }}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert
            onClose={() => {
              setWsResponse(null);
            }}
            severity={"success"}
          >
            {wsResponse}
          </Alert>
        </Snackbar>
      </Stack>
    </>
  );
}
