import { useParams, useSearchParams, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Alert, Spinner, Table, Tabs, Tab, Button, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { getCollectionDetails, dropIndex , getSegmentInfo} from '../api/backend';
import { useMilvusConnection } from '../hooks/useMilvusConnection';
import { ConnectionState } from '../context/ConnectionContext';
import 'bootstrap-icons/font/bootstrap-icons.css';
import ToastManager from './ToastManager';
import LoadingOverlay from './LoadingOverlay';

export default function CollectionDetailsPanel() {
  const { name } = useParams();
  const { host, port, status } = useMilvusConnection();

  if (status === ConnectionState.CONNECTING || status === ConnectionState.IDLE) {
     return <Spinner animation="border" className="m-3" />;
  }


   if (status === ConnectionState.DISCONNECTED || status === ConnectionState.FAILED) {
     return <Navigate to="/" replace />;
   }

  const [segments, setSegments] = useState([])
  const [details, setDetails] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const allowedTabs = ['overview', 'schema', 'indexes'];
  const tabFromUrl = allowedTabs.includes(searchParams.get('tab')) ? searchParams.get('tab') : 'overview';
  const [droppingField, setDroppingField] = useState(null);
  const [toast, setToast] = useState(null);

  const fetchData = async () => {
    try {
      const data = await getCollectionDetails(name, host, port);
      setDetails(data);
      if(data.load_state === 3) {
        const segmentsData = await getSegmentInfo(name, host, port);
        setSegments(segmentsData.segments)
        console.log("Num of segments: " + segmentsData.segments.length)
      }
      setError(null);
    } catch (err) {
      console.error('Failed to fetch collection details:', err);
      setError('Failed to fetch collection details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let timer;
    if (host && port) {
      fetchData();
      timer = setInterval(fetchData, 5000);
    }
    return () => clearInterval(timer);
  }, [name, host, port]);

  if (error) return <Alert variant="danger" className="m-3">{error}</Alert>;
  if (!details) return <Alert variant="warning" className="m-3">No collection data available.</Alert>;

  return (
    <div className="px-3">
      <p className="text-muted mb-2 fw-semibold">Collection: {details.name}</p>
      <div className="d-inline-block">
        <Tabs
          activeKey={tabFromUrl}
          onSelect={(k) => setSearchParams({ tab: k })}
          id="collection-tabs"
          className="mb-3"
        >
          <Tab eventKey="overview" title="Overview">
            <div className="p-3 border rounded bg-white shadow-sm">
              {getCollectionData(details, segments)}
            </div>
          </Tab>
          <Tab eventKey="schema" title="Schema">
            <div className="p-3 border rounded bg-white shadow-sm">
              {getCollectionSchema(details.schema)}
            </div>
          </Tab>
          <Tab eventKey="indexes" title="Indexes">
            <div className="p-3 border rounded bg-white shadow-sm">
              {getCollectionIndex(details.index_info, name, host, port, droppingField, setDroppingField, fetchData, setToast)}
            </div>
          </Tab>
        </Tabs>
        <ToastManager toast={toast} setToast={setToast} />
        <LoadingOverlay show={loading} />
      </div>
    </div>
  );
}

function getSegmentsData(segments) {
  if (segments.length === 0 ) {
    return(<div></div>)
  }
  return (
    <div className="mb-4">
      <h6 className="mb-4">Number of Segments: {segments.length}</h6>
      
      <Table striped bordered hover responsive style={{ maxWidth: 'fit-content' }}>
        <thead>
          <tr>
            <th>Segment ID</th>
            <th>State</th>
            <th>Index Name</th>
            <th>Rows</th>
          </tr>
        </thead>
        <tbody>
        {segments.map((seg) => (
                <tr key={seg.id}>
                  <td>{seg.id}</td>
                  <td>{seg.state}</td>
                  <td>{seg.indexName}</td>
                  <td>{seg.numRows}</td>
                </tr>
                ))}
        </tbody>
      </Table>
      
    </div>
  )
}

function getCollectionData(details, segments) {
  return (
    <div className="mb-4">
      <Table striped bordered hover responsive style={{ maxWidth: 'fit-content' }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Collection ID</th>
            <th>Description</th>
            <th>Entities</th>
            <th>Load State</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{details.name}</td>
            <td>{details.collection_id}</td>
            <td>{details.description || ''}</td>
            <td>{details.entity_count.toLocaleString()}</td>
            <td>{['NotExist', 'NotLoaded', 'Loading', 'Loaded'][details.load_state] || 'Unknown'}</td>
          </tr>
        </tbody>
      </Table>
      { getSegmentsData(segments) }
    </div>
  );
}

function getCollectionSchema(schema) {
  if (!schema?.length) return <Alert variant="info">No schema data available.</Alert>;

  const hasAutoId = schema.some((field) => field.auto_id != null);
  const hasDesc = schema.some((field) => field.description);

  return (
    <div className="mb-4">
      <Table striped bordered hover responsive style={{ maxWidth: 'fit-content' }}>
        <thead>
          <tr>
            <th>Field Name</th>
            <th>Type</th>
            <th>Primary</th>
            {hasAutoId && <th>Auto ID</th>}
            <th>Dimension</th>
            {hasDesc && <th>Description</th>}
          </tr>
        </thead>
        <tbody>
          {schema.map((field, idx) => (
            <tr key={idx}>
              <td>{field.name}</td>
              <td>{field.type}</td>
              <td>{field.primary ? 'Yes' : ''}</td>
              {hasAutoId && <td>{field.auto_id ? 'Yes' : ''}</td>}
              <td>{field.dimension ?? ''}</td>
              {hasDesc && <td>{field.description || '—'}</td>}
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

function getCollectionIndex(indexInfo, collectionName, host, port, droppingField, setDroppingField, fetchData, setToast) {
  if (!indexInfo?.length) return <Alert variant="info">No index information available.</Alert>;

  const sorted = [...indexInfo].sort((a, b) => (b.field || '').localeCompare(a.field || ''));

  return (
    <div className="mb-4">
      {sorted.map((idx, i) => (
        <Table striped bordered hover responsive key={i} style={{ maxWidth: 'fit-content' }}>
          <thead>
            <tr>
              <th>Field Name</th>
              <th>Index Type</th>
              <th>Metric Type</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{idx.field}</td>
              <td>{idx.index_param.index_type}</td>
              <td>{idx.index_param.metric_type}</td>
              <td>
                <OverlayTrigger placement="top" overlay={<Tooltip>Drop Index</Tooltip>}>
                <button
                  className="btn btn-sm btn-outline-danger"
                  disabled={droppingField === idx.field}
                  onClick={async () => {
                    const confirmed = window.confirm(`Are you sure you want to drop index on field '${idx.field}'?`);
                    if (!confirmed) return;
                    setDroppingField(idx.field);
                    try {
                      const res = await dropIndex(collectionName, idx.field, host, port);
                      setToast({
                          type: res.status === 'success' ? 'success' : 'error',
                          message: res.message
                        });
                      await fetchData();
                    } catch (err) {
                      alert("Failed to drop index " + err);
                      console.log(err)
                    } finally {
                      setDroppingField(null);
                    }
                  }}
                >
                  {droppingField === idx.field ? (
                    <span className="spinner-border spinner-border-sm" role="status" />
                  ) : (
                    <i className="bi bi-trash" />
                  )}
                </button>
                </OverlayTrigger>
              </td>
            </tr>
            {idx.index_name !== idx.field && (
              <tr key="index_name">
                <th>Index Name</th>
                <td colSpan={3}>{idx.index_name}</td>
              </tr>
            )}
            {idx.progress && (
              <tr key="progress">
                <td colSpan={4}>
                  Progress: {(idx.progress.indexed_rows / idx.progress.total_rows * 100).toFixed(2)}%
                  (Pending Rows: {idx.progress.pending_index_rows.toLocaleString()})
                </td>
              </tr>
            )}
            {idx.index_param.params && (
              <>
                <tr><th colSpan={4}>Index Parameters</th></tr>
                {Object.entries(idx.index_param.params).map(([key, value]) => (
                  <tr key={key}>
                    <th>{key}</th>
                    <td colSpan={3}>
                      {typeof value === 'object'
                        ? JSON.stringify(value)
                        : value?.toString?.() ?? ''}
                    </td>
                  </tr>
                ))}
              </>
            )}
          </tbody>
        </Table>
      ))}
    </div>
  );
}
