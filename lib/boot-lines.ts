export type BootNode = { id: string; city: string; lat: number; lon: number };

// Edge regions the intro "probes". Latencies are derived from great-circle distance, so they read plausibly
// for wherever the visitor is.
export const NODES: BootNode[] = [
  { id: "fra1", city: "frankfurt", lat: 50.1, lon: 8.7 },
  { id: "lhr1", city: "london", lat: 51.5, lon: -0.1 },
  { id: "iad1", city: "washington", lat: 38.9, lon: -77.0 },
  { id: "sfo1", city: "san francisco", lat: 37.8, lon: -122.4 },
  { id: "gru1", city: "sao paulo", lat: -23.6, lon: -46.6 },
  { id: "dxb1", city: "dubai", lat: 25.2, lon: 55.3 },
  { id: "bom1", city: "mumbai", lat: 19.1, lon: 72.9 },
  { id: "sin1", city: "singapore", lat: 1.35, lon: 103.8 },
  { id: "hnd1", city: "tokyo", lat: 35.7, lon: 139.7 },
  { id: "syd1", city: "sydney", lat: -33.9, lon: 151.2 },
];

// Line timings (ms from boot start). Probe rows land PROBE + row * STEP; the globe draws arcs on the same clock.
export const BOOT_T = { resolve: 240, probeHead: 440, probe: 560, step: 100, route: 1160, tls: 1380, auth: 1600, ok: 1860, last: 2060 };

export type BootLine = { t: number; text: string; ok?: boolean };

// Self-contained on purpose: it is serialized into an inline script that fills in the visitor's timezone before
// paint, so no imports, object spreads or outer references.
export function bootLines(nodes: BootNode[], tz: string, now: Date, T: typeof BOOT_T) {
  const rules = [
    ["America/Sao_Paulo", "gru1"], ["America/Argentina", "gru1"], ["America/Los_Angeles", "sfo1"],
    ["America/Vancouver", "sfo1"], ["America/", "iad1"], ["Europe/London", "lhr1"], ["Europe/Dublin", "lhr1"],
    ["Europe/Lisbon", "lhr1"], ["Europe/", "fra1"], ["Africa/", "fra1"], ["Asia/Dubai", "dxb1"],
    ["Asia/Muscat", "dxb1"], ["Asia/Riyadh", "dxb1"], ["Asia/Qatar", "dxb1"], ["Asia/Kolkata", "bom1"],
    ["Asia/Calcutta", "bom1"], ["Asia/Karachi", "bom1"], ["Asia/Tokyo", "hnd1"], ["Asia/Seoul", "hnd1"],
    ["Asia/", "sin1"], ["Australia/", "syd1"], ["Pacific/Auckland", "syd1"],
  ];
  let homeId = "fra1";
  for (let i = 0; i < rules.length; i++) {
    if (tz.indexOf(rules[i][0]) === 0) {
      homeId = rules[i][1];
      break;
    }
  }
  const home = nodes.filter((n) => n.id === homeId)[0];
  const rad = Math.PI / 180;
  const rtt = (n: BootNode) => {
    const a =
      Math.sin(((n.lat - home.lat) * rad) / 2) ** 2 +
      Math.cos(home.lat * rad) * Math.cos(n.lat * rad) * Math.sin(((n.lon - home.lon) * rad) / 2) ** 2;
    return Math.round(2 + (12742 * Math.asin(Math.sqrt(a))) / 95);
  };
  const probe = (n: BootNode) => n.id + String(rtt(n)).padStart(5) + " ms";
  const pad = (x: number) => String(x).padStart(2, "0");
  const lines: BootLine[] = [
    { t: 0, text: "$ ssh pratham@prathlab.com" },
    { t: T.resolve, text: "resolving prathlab.com ... anycast, " + nodes.length + " edge regions" },
    { t: T.probeHead, text: "probing edges (rtt)" },
  ];
  for (let i = 0; i < nodes.length; i += 2) {
    lines.push({
      t: T.probe + (i / 2) * T.step,
      text: "  " + probe(nodes[i]) + (nodes[i + 1] ? "     " + probe(nodes[i + 1]) : ""),
    });
  }
  lines.push(
    { t: T.route, text: "route  " + home.id + " (" + home.city + "), " + rtt(home) + " ms" },
    { t: T.tls, text: "tls 1.3 · x25519 · handshake ok" },
    { t: T.auth, text: "auth pratham (ed25519) ... accepted" },
    { t: T.ok, text: "session opened on " + home.id, ok: true },
    {
      t: T.last,
      text: "Last login: " + now.toDateString() + " " + pad(now.getHours()) + ":" + pad(now.getMinutes()) + " from " + tz,
    },
  );
  return { home: home.id, lines };
}
