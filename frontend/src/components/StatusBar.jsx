// src/components/StatusBar.jsx
import { useConnection } from "../context/ConnectionContext";

export default function StatusBar() {
  const { connected, host, port, status } = useConnection();

  let label = "Disconnected";
  let colorClass = "bg-secondary";

  if (status === "connecting") {
    label = "Connecting...";
    colorClass = "bg-warning";
  } else if (status === "connected") {
    label = `Connected to ${host}:${port}`;
    colorClass = "bg-success";
  } else if (status === "error") {
    label = "Connection error";
    colorClass = "bg-danger";
  }

  return (
    <div className="position-absolute top-0 end-0 m-3 text-end">
      <span className={`badge ${colorClass} text-white p-2`}>
        {label}
      </span>
    </div>
  );
}
