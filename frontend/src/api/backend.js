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

export async function postMilvusAction(action, name, host, port) {
  const response = await fetch(`${getBackendUrl()}/api/milvus/collections/${action}?name=${name}&host=${host}&port=${port}`, {
    method: action === 'drop' ? 'DELETE' : 'POST',
  });
  return await response.json();
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