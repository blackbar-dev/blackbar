// Minimal GitHub REST client for the crew runner (no extra dependencies).
const API = 'https://api.github.com';

export function github(token, repo) {
  async function call(method, path, body) {
    const res = await fetch(`${API}${path.replace('{repo}', repo)}`, {
      method,
      headers: {
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        accept: 'application/vnd.github+json',
        'x-github-api-version': '2022-11-28',
        ...(body ? { 'content-type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.status === 404 && method === 'GET') return null;
    if (!res.ok) throw new Error(`${method} ${path}: ${res.status} ${await res.text()}`);
    return res.status === 204 ? null : res.json();
  }
  return {
    get: (p) => call('GET', p),
    post: (p, b) => call('POST', p, b),
    patch: (p, b) => call('PATCH', p, b),
    put: (p, b) => call('PUT', p, b),
  };
}

/**
 * Creates one commit on `branch` through the API, so GitHub records the app as committer
 * and the character as author. `files` maps path -> Buffer (or null to delete).
 */
export async function commitFiles(gh, { branch, baseSha, message, author, files }) {
  const base = await gh.get(`/repos/{repo}/git/commits/${baseSha}`);
  const tree = [];
  for (const [path, content] of Object.entries(files)) {
    if (content === null) {
      tree.push({ path, mode: '100644', type: 'blob', sha: null });
      continue;
    }
    const blob = await gh.post('/repos/{repo}/git/blobs', {
      content: content.toString('base64'),
      encoding: 'base64',
    });
    tree.push({ path, mode: '100644', type: 'blob', sha: blob.sha });
  }
  const newTree = await gh.post('/repos/{repo}/git/trees', { base_tree: base.tree.sha, tree });
  const commit = await gh.post('/repos/{repo}/git/commits', {
    message,
    tree: newTree.sha,
    parents: [baseSha],
    author: { ...author, date: new Date().toISOString() },
  });
  const ref = await gh.get(`/repos/{repo}/git/ref/heads/${branch}`);
  if (ref) await gh.patch(`/repos/{repo}/git/refs/heads/${branch}`, { sha: commit.sha });
  else await gh.post('/repos/{repo}/git/refs', { ref: `refs/heads/${branch}`, sha: commit.sha });
  return commit.sha;
}
