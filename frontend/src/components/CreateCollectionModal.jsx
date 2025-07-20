import { useState, useContext } from 'react';
import { Modal, Button, Form, Row, Col, Spinner } from 'react-bootstrap';
import { postMilvusCreateCollection } from '../api/backend';
import { ConnectionContext } from '../context/ConnectionContext';

const getDefaultFields = () => ([
  {
    name: 'id',
    type: 'int64',
    is_primary: true,
    auto_id: false,
    dim: '',
    max_length: '',
    element_type: ''
  },
  {
    name: 'embedding',
    type: 'float_vector',
    is_primary: false,
    auto_id: false,
    dim: '768',
    max_length: '',
    element_type: ''
  }
]);

const allTypes = [
  'int64', 'float', 'double', 'bool', 'varchar',
  'float_vector', 'binary_vector', 'array', 'json'
];

const pkAllowedTypes = ['int64', 'varchar'];

export default function CreateCollectionModal({ show, onClose, onCreated, setToast }) {
  const { host, port } = useContext(ConnectionContext);
  const [collectionName, setCollectionName] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState(getDefaultFields());
  const [submitting, setSubmitting] = useState(false);

  const updateField = (index, key, value) => {
    const updated = [...fields];
    updated[index][key] = value;

    // Only allow PK + auto_id on first field
    if (index !== 0 && (key === 'is_primary' || key === 'auto_id')) return;

    setFields(updated);
  };

  const addField = () => {
    setFields([...fields, {
      name: '',
      type: 'int64',
      is_primary: false,
      auto_id: false,
      dim: '',
      max_length: '',
      element_type: ''
    }]);
  };

  const removeField = (index) => {
    if (index === 0) return; // prevent removing first field
    setFields(fields.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!collectionName.trim()) {
      setToast({ type: 'error', message: 'Collection name is required' });
      return;
    }

    const primaryCount = fields.filter(f => f.is_primary).length;
    if (primaryCount !== 1) {
      setToast({ type: 'error', message: 'Exactly one primary field is required.' });
      return;
    }

    const payload = {
      name: collectionName,
      description,
      fields: fields.map(f => {
        const base = {
          name: f.name,
          type: f.type,
          is_primary: f.is_primary,
          auto_id: f.auto_id
        };
        if (f.type.includes('vector') && f.dim) base.dim = parseInt(f.dim);
        if (f.type === 'varchar' && f.max_length) base.max_length = parseInt(f.max_length);
        if (f.type === 'array' && f.element_type) base.element_type = f.element_type;
        return base;
      })
    };

    setSubmitting(true);
    const res = await postMilvusCreateCollection(payload, host, port);
    setSubmitting(false);

    setToast({ type: res.status, message: res.message });
    if (res.status === 'success') onCreated();
  };

  return (
    <Modal show={show} onHide={onClose} size="lg" centered scrollable>
      <Modal.Header closeButton>
        <Modal.Title>Create New Collection</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Group className="mb-3">
          <Form.Label>Collection Name</Form.Label>
          <Form.Control
            value={collectionName}
            onChange={(e) => setCollectionName(e.target.value)}
            placeholder="e.g. articles_index"
            disabled={submitting}
          />
        </Form.Group>

        <Form.Group className="mb-4">
          <Form.Label>Description</Form.Label>
          <Form.Control
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
            disabled={submitting}
          />
        </Form.Group>

        <h6>Fields</h6>
        {fields.map((f, i) => (
          <Row className="mb-3" key={i}>
            <Col md={3}>
              <Form.Control
                placeholder="Field Name"
                value={f.name}
                onChange={(e) => updateField(i, 'name', e.target.value)}
                disabled={submitting}
              />
            </Col>
            <Col md={2}>
              <Form.Select
                value={f.type}
                onChange={(e) => updateField(i, 'type', e.target.value)}
                disabled={submitting}
              >
                {(i === 0 ? pkAllowedTypes : allTypes).map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={2}>
              {f.type.includes('vector') && (
                <Form.Control
                  placeholder="dim"
                  value={f.dim}
                  onChange={(e) => updateField(i, 'dim', e.target.value)}
                  disabled={submitting}
                />
              )}
              {f.type === 'varchar' && (
                <Form.Control
                  placeholder="max_length"
                  value={f.max_length}
                  onChange={(e) => updateField(i, 'max_length', e.target.value)}
                  disabled={submitting}
                />
              )}
              {f.type === 'array' && (
                <Form.Control
                  placeholder="element_type"
                  value={f.element_type}
                  onChange={(e) => updateField(i, 'element_type', e.target.value)}
                  disabled={submitting}
                />
              )}
            </Col>
            <Col md={2}>
              {i === 0 && (
                <>
                  <Form.Check
                    type="checkbox"
                    label="Primary"
                    checked={f.is_primary}
                    onChange={(e) => updateField(i, 'is_primary', e.target.checked)}
                    disabled={submitting}
                  />
                  <Form.Check
                    type="checkbox"
                    label="Auto ID"
                    checked={f.auto_id}
                    onChange={(e) => updateField(i, 'auto_id', e.target.checked)}
                    disabled={submitting}
                  />
                </>
              )}
            </Col>
            <Col md={1}>
              {i > 1 && (
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => removeField(i)}
                  disabled={submitting}
                >
                  ✕
                </Button>
              )}
            </Col>
          </Row>
        ))}

        <Button variant="outline-secondary" onClick={addField} disabled={submitting}>
          ➕ Add Field
        </Button>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose} disabled={submitting}>Cancel</Button>
        <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
          {submitting && <Spinner animation="border" size="sm" className="me-2" />}
          Create
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
