// src/components/StatusBar.jsx
import { useConnection } from "../context/ConnectionContext";

export default function StatusBar() {
  const { connected, host, port, status } = useConnection();

  let text = "Disconnected";
  let color = "gray";

  if (status === "connecting") {
    text = "Connecting...";
    color = "orange";
  } else if (status === "connected") {
    text = `Connected (${host}:${port})`;
    color = "green";
  } else if (status === "error") {
    text = "Connection Error";
    color = "red";
  }

  return (
    <div style={{
      position: "absolute",
      top: "10px",
      right: "20px",
      fontSize: "14px",
      fontWeight: "bold",
      color
    }}>
      {text}
    </div>
  );
}
