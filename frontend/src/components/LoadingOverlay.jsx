import React from 'react';

export default function LoadingOverlay({ show = false, message = 'Loading...' }) {
  if (!show) return null;

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        zIndex: 1050,
      }}
    >
      <div className="text-center text-white">
        <div className="spinner-border mb-2" role="status" />
        <div>{message}</div>
      </div>
    </div>
  );
}
