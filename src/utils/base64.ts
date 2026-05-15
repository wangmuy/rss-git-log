export function utf8ToBase64(str: string): string {
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode(parseInt(p1, 16))));
}

export function base64ToUtf8(base64: string): string {
  return decodeURIComponent(Array.prototype.map.call(atob(base64), (c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
}
