export const normalizeUrl = url =>
  url.startsWith('http') ? url : `http://${url}`;
