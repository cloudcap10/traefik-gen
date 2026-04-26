/**
 * GitHub API Client for TraefikGen
 */

export interface GitHubPushConfig {
  token: string;
  owner: string;
  repo: string;
  path: string;
}

export async function pushToGitHub(
  config: GitHubPushConfig,
  content: string,
  message: string = 'feat: update docker-compose.yml via TraefikGen'
) {
  const { token, owner, repo, path } = config;
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  
  // 1. Try to get the existing file to get its SHA if it exists
  let sha: string | undefined;
  try {
    const getResponse = await fetch(url, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });
    if (getResponse.ok) {
      const data = await getResponse.json();
      sha = data.sha;
    }
  } catch (e) {
    // File probably doesn't exist, proceed without SHA
    console.log('File not found or error fetching SHA, assuming new file.');
  }

  // 2. Prepare content (Base64 encoding)
  // btoa handles string to base64. For UTF-8, we use the encodeURIComponent/unescape trick.
  const base64Content = btoa(unescape(encodeURIComponent(content)));
  
  const body: any = {
    message,
    content: base64Content,
  };
  if (sha) {
    body.sha = sha;
  }

  // 3. PUT the content
  const putResponse = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!putResponse.ok) {
    const errorData = await putResponse.json();
    throw new Error(errorData.message || `GitHub API error: ${putResponse.status}`);
  }

  return await putResponse.json();
}
