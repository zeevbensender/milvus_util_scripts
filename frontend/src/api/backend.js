const DEFAULT_BACKEND_PORT = 8080;

// Get backend URL based on current frontend URL
const getBackendUrl = () => {
  const { protocol, hostname } = window.location;
  return `${protocol}//${hostname}:8080`; // backend always exposed on same host
};

export async function getHealthStatus() {
  try {
    const response = await fetch(`${getBackendUrl()}/health`);
    if (!response.ok) throw new Error("Request failed");
    return await response.json();
  } catch (err) {
    console.error("Failed to fetch health:", err);
    return null;
  }
}

export async function getCollections(host = 'localhost', port = 19530) {
  try {
    const response = await fetch(`${getBackendUrl()}/api/milvus/collections?host=${host}&port=${port}`);
    if (!response.ok) throw new Error("Failed to fetch collections");
    const json = await response.json();
    return json;
  } catch (err) {
    console.error("Error fetching collections:", err);
    return { status: 'error', collections: [] };
  }
}

export async function getIsIndexing(host = 'localhost', port = 19530) {
  try {
    const response = await fetch(`${getBackendUrl()}/api/milvus/indexing?host=${host}&port=${port}`);
    if (!response.ok) throw new Error("Failed to verify indexing");
    const json = await response.json();
    return json;
  } catch (err) {
    console.error("Error fetching collections:", err);
    return { status: 'error'};
  }
}

export async function postMilvusAction(action, name, host, port) {
  const response = await fetch(`${getBackendUrl()}/api/milvus/collections/${action}?name=${name}&host=${host}&port=${port}`, {
    method: action === 'drop' ? 'DELETE' : 'POST',
  });
  return await response.json();
}


export async function postMilvusLoadCollection(name, fields, host, port) {
  console.log("POSTING LOAD COLLECTION")
  const payload = { name };
  if (fields && Array.isArray(fields) && fields.length > 0) {
    payload.fields = fields;
  }

  const res = await fetch(`${getBackendUrl()}/api/milvus/collections/load?host=${host}&port=${port}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Server error: ${res.status} ${text}`);
  }

  return await res.json();
}

export async function getCollectionDetails(name, host, port) {
  const the_url = `${getBackendUrl()}/api/milvus/collections/${encodeURIComponent(name)}/details?host=${host}&port=${port}`

  try {
    const response = await fetch(the_url);
    if (!response.ok) throw new Error("Failed to fetch the " + name + " collection details");
    const json = await response.json();
    return json;
  } catch (err) {
    console.error("Error fetching collections:", err);
    return { status: 'error', collections: [] };
  }
}

export async function getSegmentInfo(name, host, port) {
  const the_url = `${getBackendUrl()}/api/milvus/collections/${encodeURIComponent(name)}/segments?host=${host}&port=${port}`

  try {
    const response = await fetch(the_url);
    if (!response.ok) throw new Error("Failed to fetch the " + name + " collection segments info");
    const json = await response.json();
    return json;
  } catch (err) {
    console.error("Error fetching collections:", err);
    return { status: 'error', segments: [] };
  }
}

export async function dropIndex(collectionName, fieldName, host, port) {
  const res = await fetch(`${getBackendUrl()}/api/milvus/index/drop?host=${host}&port=${port}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ collection_name: collectionName, field_name: fieldName }),
  });
  return res.json();
}

export async function postMilvusRenameCollection(oldName, newName, host, port) {
  const res = await fetch(`${getBackendUrl()}/api/milvus/collection/rename?host=${host}&port=${port}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ old_name: oldName, new_name: newName }),
  });
  return res.json();
}

export async function postMilvusCreateCollection(payload, host, port) {
  const url = `${getBackendUrl()}/api/milvus/collection/create?host=${host}&port=${port}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return res.json();
}