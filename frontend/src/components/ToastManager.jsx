import { useEffect } from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';

export default function ToastManager({ toast, setToast }) {
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000); // auto-dismiss
      return () => clearTimeout(timer);
    }
  }, [toast, setToast]);

  if (!toast) return null;

  const bgMap = {
    success: 'success',
    error: 'danger',
    warning: 'warning',
    info: 'info',
  };

  return (
    <ToastContainer position="top-end" className="p-3">
      <Toast
        bg={bgMap[toast.type] || 'light'}
        onClose={() => setToast(null)}
        show
        delay={4000}
        autohide
      >
        <Toast.Header>
          <strong className="me-auto text-capitalize">{toast.type || 'Notice'}</strong>
        </Toast.Header>
        <Toast.Body className="text-white">{toast.message}</Toast.Body>
      </Toast>
    </ToastContainer>
  );
}
