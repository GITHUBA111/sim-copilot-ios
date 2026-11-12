/**
 * Fast LAN Auto-Discovery for Native iOS / Android `.ipa` & `.apk` builds.
 * Probes the current subnet prefix + common home router subnets on port 8765 for `/ping`.
 */

const COMMON_SUBNETS = [
  '192.168.3',
  '192.168.1',
  '192.168.31',
  '192.168.0',
  '192.168.50',
  '192.168.2',
  '192.168.10',
  '172.20.10',
  '10.0.0',
];

async function probeHost(ip: string, port: string, timeoutMs: number): Promise<string | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`http://${ip}:${port}/ping`, {
      method: 'GET',
      signal: ctrl.signal,
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (json && json.app === 'sim-copilot') {
      return ip;
    }
    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function discoverPcCompanion(
  hintHost: string,
  port = '8765'
): Promise<string | null> {
  const cleanHint = (hintHost || '').trim();
  // 1. Try current hint host immediately first
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(cleanHint)) {
    const direct = await probeHost(cleanHint, port, 450);
    if (direct) return direct;
  }

  // Build ordered list of /24 prefixes starting with hint's /24
  const prefixes: string[] = [];
  const m = cleanHint.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3})\.\d{1,3}$/);
  if (m && m[1]) prefixes.push(m[1]);
  for (const s of COMMON_SUBNETS) {
    if (!prefixes.includes(s)) prefixes.push(s);
  }

  // 2. Scan primary hint subnet thoroughly (1..254) in fast batches of 45
  const primaryPrefix = prefixes[0];
  if (primaryPrefix) {
    const ips: string[] = [];
    for (let i = 2; i <= 254; i++) ips.push(`${primaryPrefix}.${i}`);
    for (let i = 0; i < ips.length; i += 45) {
      const batch = ips.slice(i, i + 45);
      const hits = await Promise.all(batch.map((ip) => probeHost(ip, port, 380)));
      const found = hits.find(Boolean);
      if (found) return found;
    }
  }

  // 3. Scan common DHCP host ranges (.2 .. .60, .100 .. .160) across remaining common router subnets
  const candidates: string[] = [];
  for (const pfx of prefixes.slice(1, 6)) {
    for (let i = 2; i <= 45; i++) candidates.push(`${pfx}.${i}`);
    for (let i = 100; i <= 145; i++) candidates.push(`${pfx}.${i}`);
  }

  for (let i = 0; i < candidates.length; i += 60) {
    const batch = candidates.slice(i, i + 60);
    const hits = await Promise.all(batch.map((ip) => probeHost(ip, port, 360)));
    const found = hits.find(Boolean);
    if (found) return found;
  }

  return null;
}
