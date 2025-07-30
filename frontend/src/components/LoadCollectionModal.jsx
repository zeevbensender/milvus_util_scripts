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
            isVector: field.type.toLowerCase().includes('vector'),
            indexType: field.index_type || '',
          }));
          setFields(parsed);
          setSelected(parsed.map(f => f.name)); // select all by default
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

  // Non-toggleable fields (always selected, cannot be unchecked)
  const nonToggleableFields = useMemo(
    () => fields.filter(f => f.isPrimary || f.isVector).map(f => f.name),
    [fields]
  );

  // Fields the user can toggle via checkboxes
  const toggleableFields = useMemo(
    () => fields.filter(f => !nonToggleableFields.includes(f.name)).map(f => f.name),
    [fields, nonToggleableFields]
  );

  const allToggleableSelected = toggleableFields.every(f => selected.includes(f));
  const someToggleableSelected = toggleableFields.some(f => selected.includes(f));

  useEffect(() => {
    if (masterRef.current) {
      masterRef.current.indeterminate = someToggleableSelected && !allToggleableSelected;
    }
  }, [someToggleableSelected, allToggleableSelected]);

  const toggleMaster = () => {
    if (allToggleableSelected) {
      setSelected(nonToggleableFields); // keep only locked fields
    } else {
      setSelected([...nonToggleableFields, ...toggleableFields]); // select all
    }
  };

  const toggleField = (name) => {
    if (nonToggleableFields.includes(name)) return;
    setSelected(prev =>
      prev.includes(name)
        ? prev.filter(f => f !== name)
        : [...prev, name]
    );
  };

  const handleConfirm = () => {
    const allFieldNames = fields.map(f => f.name);
    const sendAll = selected.length === allFieldNames.length;
    
    postMilvusLoadCollection(collectionName, sendAll ? [] : selected, host, port)
      .catch(err => {
        console.error(err);
        setToast({ type: 'error', message: err.message });
      });
    onClose();  // closes immediately
    onLoaded(); // parent refresh
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
              checked={allToggleableSelected}
              onChange={toggleMaster}
              className="mb-2"
            />
            <div className="field-list">
              {fields.map(field => {
                const isDisabled = nonToggleableFields.includes(field.name);
                const isChecked = selected.includes(field.name);
                return (
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
                    checked={isChecked}
                    disabled={isDisabled}
                    onChange={() => toggleField(field.name)}
                    className="mb-2"
                  />
                );
              })}
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
