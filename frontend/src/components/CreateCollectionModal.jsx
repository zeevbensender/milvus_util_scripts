// same imports as before
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
  const [fieldErrors, setFieldErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const updateField = (index, key, value) => {
    const updated = [...fields];
    updated[index][key] = value;
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
    setFieldErrors(fieldErrors.filter((_, i) => i !== index));
  };

    const validateFields = () => {
      const errors = fields.map((f) => {
        const err = {
          name: !f.name,
          type: !f.type,
          dim: false,
          max_length: false,
          element_type: false
        };

        if ((f.type === 'float_vector' || f.type === 'binary_vector') && (!f.dim || isNaN(f.dim))) {
          err.dim = true;
        }

        if (f.type === 'varchar' && (!f.max_length || isNaN(f.max_length))) {
          err.max_length = true;
        }

        if (f.type === 'array' && !f.element_type) {
          err.element_type = true;
        }

        return err;
      });

      setFieldErrors(errors);
      return errors.every(err =>
        !err.name && !err.type && !err.dim && !err.max_length && !err.element_type
      );
    };

  const handleSubmit = async () => {
    if (!collectionName.trim()) {
      setToast({ type: 'error', message: 'Collection name is required' });
      return;
    }

    if (!validateFields()) {
      setToast({ type: 'error', message: 'Please fill in all required fields' });
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
        {fields.map((f, i) => {
          const errors = fieldErrors[i] || {};
          return (
            <Row className="mb-3" key={i}>
              <Col md={3}>
                <Form.Control
                  placeholder="Field Name"
                  value={f.name}
                  isInvalid={errors.name}
                  onChange={(e) => updateField(i, 'name', e.target.value)}
                  disabled={submitting}
                />
                {errors.name && (
                  <Form.Control.Feedback type="invalid">
                    Name is required
                  </Form.Control.Feedback>
                )}
              </Col>
              <Col md={2}>
                <Form.Select
                  value={f.type}
                  isInvalid={errors.type}
                  onChange={(e) => updateField(i, 'type', e.target.value)}
                  disabled={submitting}
                >
                  {(i === 0 ? pkAllowedTypes : allTypes).map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </Form.Select>
                {errors.type && (
                  <Form.Control.Feedback type="invalid">
                    Type is required
                  </Form.Control.Feedback>
                )}
              </Col>
              <Col md={2}>
                {f.type.includes('vector') && (
                    <div>
                    <Form.Control
                      placeholder="dim"
                      value={f.dim}
                      onChange={(e) => updateField(i, 'dim', e.target.value)}
                      isInvalid={errors.dim}
                      disabled={submitting}
                    />
                    {errors.dim && (
                      <Form.Control.Feedback type="invalid">
                        Dimension is invalid or missing
                      </Form.Control.Feedback>
                    )}
                    </div>
                )}
                {f.type === 'varchar' && (
                    <div>

                    <Form.Control
                      placeholder="max_length"
                      value={f.max_length}
                      onChange={(e) => updateField(i, 'max_length', e.target.value)}
                      isInvalid={errors.max_length}
                      disabled={submitting}
                    />
                    {errors.max_length && (
                      <Form.Control.Feedback type="invalid">
                        Max length is invalid or missing
                      </Form.Control.Feedback>
                    )}
                    </div>

                )}
                {f.type === 'array' && (
                    <div>

                    <Form.Control
                      placeholder="element_type"
                      value={f.element_type}
                      onChange={(e) => updateField(i, 'element_type', e.target.value)}
                      isInvalid={errors.element_type}
                      disabled={submitting}
                    />
                    {errors.element_type && (
                      <Form.Control.Feedback type="invalid">
                        Element type is invalid or missing
                      </Form.Control.Feedback>
                    )}
                    </div>

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
          );
        })}

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
