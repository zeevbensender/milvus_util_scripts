import { useState } from 'react';
import { Modal, Button, Form, Spinner, Alert } from 'react-bootstrap';

export default function RenameCollectionModal({ show, onClose, onRename, oldName }) {
  const [newName, setNewName] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError(null);

    if (!newName.trim()) {
      setError('New name cannot be empty.');
      return;
    }
    if (newName.trim() === oldName) {
      setError('New name must be different from the current name.');
      return;
    }

    setSubmitting(true);
    await onRename(newName.trim());
    setSubmitting(false);
  };

  const handleClose = () => {
    setNewName('');
    setError(null);
    setSubmitting(false);
    onClose();
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Rename Collection</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Group className="mb-3">
          <Form.Label>Current Name</Form.Label>
          <Form.Control type="text" value={oldName} disabled />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>New Name</Form.Label>
          <Form.Control
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Enter new collection name"
            disabled={submitting}
          />
        </Form.Group>

        {error && <Alert variant="danger">{error}</Alert>}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose} disabled={submitting}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
          {submitting ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Renaming...
            </>
          ) : (
            'Rename'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
