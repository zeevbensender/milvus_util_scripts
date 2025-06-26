// src/components/Header.jsx
import { useConnection } from '../context/ConnectionContext';

export default function Header() {
  const { connected, host, port, status } = useConnection();

  let badgeClass = "bg-secondary";
  let label = "Disconnected";

  if (status === "connecting") {
    badgeClass = "bg-warning text-dark";
    label = "Connecting...";
  } else if (status === "connected") {
    badgeClass = "bg-success";
    label = `Connected to ${host}:${port}`;
  } else if (status === "error") {
    badgeClass = "bg-danger";
    label = "Connection error";
  }

  return (
    <div className="d-flex justify-content-between align-items-center px-4 py-2 border-bottom shadow-sm bg-white">
      <h4 className="m-0 text-primary">Milvus Admin Panel</h4>
      <span className={`badge ${badgeClass} p-2`}>
        {label}
      </span>
    </div>
  );
}
