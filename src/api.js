export async function api(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...((sessionStorage.getItem("ksr-admin-token") || sessionStorage.getItem("ksr-google-credential"))
        ? { Authorization: `Bearer ${sessionStorage.getItem("ksr-admin-token") || sessionStorage.getItem("ksr-google-credential")}` }
        : {}),
      ...(options.headers || {})
    }
  });
  let data;
  try { data = await res.json(); } catch { data = {}; }
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}
