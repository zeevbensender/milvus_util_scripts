// src/components/StatusBar.jsx
import { useConnection } from "../context/ConnectionContext";

export default function StatusBar() {
  const { connected, host, port, status } = useConnection();

  let text = "Disconnected";
  let bgColor = "#ccc"; // neutral gray

  if (status === "connecting") {
    text = "Connecting...";
    bgColor = "#ffcc00"; // amber
  } else if (status === "connected") {
    text = `Connected (${host}:${port})`;
    bgColor = "#28a745"; // green
  } else if (status === "error") {
    text = "Connection Error";
    bgColor = "#dc3545"; // red
  }

  return (
    <div
      style={{
        position: "absolute",
        top: "10px",
        right: "20px",
        backgroundColor: bgColor,
        color: "white",
        fontSize: "13px",
        fontWeight: "bold",
        padding: "6px 12px",
        borderRadius: "20px",
        boxShadow: "0 2px 6px rgba(0, 0, 0, 0.2)",
        maxWidth: "240px",
        textAlign: "center",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}
      title={text}
    >
      {text}
    </div>
  );
}
