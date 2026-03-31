const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

async function request(path, options = {}) {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      ...options,
    });
  } catch {
    throw new Error(
      `Unable to reach AYRA ERP API at ${API_BASE_URL}. Please start the backend server with npm run dev in /backend.`,
    );
  }

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(data?.message || "Request failed");
  }

  return data;
}

export async function loginUser({ tenant, role, username, password }) {
  return request(`/${tenant}/auth/login`, {
    method: "POST",
    body: JSON.stringify({ role, username, password }),
  });
}

export async function getCollection(tenant, endpoint) {
  return request(`/${tenant}${endpoint}`);
}

export async function createCollectionItem(tenant, endpoint, payload) {
  return request(`/${tenant}${endpoint}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateCollectionItem(tenant, endpoint, id, payload) {
  return request(`/${tenant}${endpoint}/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteCollectionItem(tenant, endpoint, id) {
  return request(`/${tenant}${endpoint}/${id}`, {
    method: "DELETE",
  });
}

export { API_BASE_URL };
