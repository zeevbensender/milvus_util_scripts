// src/components/LoadCollectionModal.jsx

import { useState, useEffect, useMemo, useRef } from 'react';
import { Modal, Button, Form, Spinner } from 'react-bootstrap';
import { getCollectionDetails, postMilvusLoadCollection } from '../api/backend';

export default function LoadCollectionModal({ show, onClose, collectionName, onLoaded, host, port, setToast }) {
  const [fields, setFields] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const masterRef = useRef(null);

  useEffect(() => {
    if (!show || !collectionName) return;

    setLoading(true);
    getCollectionDetails(collectionName, host, port)
      .then(json => {
        if (json.status === 'success' && Array.isArray(json.schema)) {
          const parsed = json.schema.map(field => ({
            name: field.name,
            type: field.type,
            isPrimary: field.primary === true,
            indexType: field.index_type || '',
          }));
          setFields(parsed);
          const required = parsed.filter(f => f.isPrimary).map(f => f.name);
          setSelected(required); // initially select required only
        } else {
          setToast({ type: 'error', message: 'Failed to load schema' });
          setFields([]);
        }
      })
      .catch(err => {
        console.error(err);
        setToast({ type: 'error', message: 'Error fetching schema' });
        setFields([]);
      })
      .finally(() => setLoading(false));
  }, [show, collectionName, host, port]);

  // Required (non-toggleable) fields
  const requiredFields = useMemo(() => fields.filter(f => f.isPrimary).map(f => f.name), [fields]);

  const optionalFields = useMemo(() => fields.filter(f => !f.isPrimary), [fields]);

  const allOptionalSelected = optionalFields.every(f => selected.includes(f.name));
  const someOptionalSelected = optionalFields.some(f => selected.includes(f.name));

  useEffect(() => {
    if (masterRef.current) {
      masterRef.current.indeterminate = someOptionalSelected && !allOptionalSelected;
    }
  }, [someOptionalSelected, allOptionalSelected]);

  const toggleMaster = () => {
    if (allOptionalSelected) {
      setSelected(requiredFields); // keep only required
    } else {
      setSelected([...requiredFields, ...optionalFields.map(f => f.name)]);
    }
  };

  const toggleField = (name) => {
    if (requiredFields.includes(name)) return;
    setSelected(prev =>
      prev.includes(name)
        ? prev.filter(f => f !== name)
        : [...prev, name]
    );
  };

  const handleConfirm = () => {
    const loadFields = [...selected]; // includes required + selected optional
    postMilvusLoadCollection(collectionName, loadFields, host, port)
      .catch(err => {
        console.error(err);
        setToast({ type: 'error', message: err.message });
      });
    onClose();  // closes immediately
    onLoaded(); // triggers parent refresh
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Load Collection: {collectionName}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading ? (
          <div className="d-flex align-items-center">
            <Spinner animation="border" size="sm" className="me-2" />
            <span>Loading schema...</span>
          </div>
        ) : (
          <>
            <Form.Check
              type="checkbox"
              id="master-checkbox"
              label="Select all fields"
              ref={masterRef}
              checked={allOptionalSelected}
              onChange={toggleMaster}
              className="mb-2"
            />
            <div className="field-list">
              {fields.map(field => (
                <Form.Check
                  key={field.name}
                  type="checkbox"
                  id={`field-${field.name}`}
                  label={
                    <div>
                      <strong>{field.name}</strong>
                      <div className="text-muted small">
                        {field.type}
                        {field.indexType ? ` • Indexed: ${field.indexType}` : ''}
                        {field.isPrimary ? ` • Primary` : ''}
                      </div>
                    </div>
                  }
                  checked={selected.includes(field.name)}
                  disabled={field.isPrimary}
                  onChange={() => toggleField(field.name)}
                  className="mb-2"
                />
              ))}
            </div>
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button
          variant="primary"
          onClick={handleConfirm}
          disabled={selected.length === 0}
        >
          Load
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
