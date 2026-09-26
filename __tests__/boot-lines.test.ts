import { BOOT_T, NODES, bootLines } from "@/lib/boot-lines";

const now = new Date(2026, 8, 26, 9, 5);

test("routes to the region nearest the visitor's timezone at ~2ms", () => {
  const { home, lines } = bootLines(NODES, "Asia/Dubai", now, BOOT_T);
  expect(home).toBe("dxb1");
  expect(lines.find((l) => l.text.startsWith("route"))?.text).toBe("route  dxb1 (dubai), 2 ms");
  expect(lines.at(-1)?.text).toBe("Last login: Sat Sep 26 2026 09:05 from Asia/Dubai");
});

test("far regions report more latency than near ones; unknown timezones fall back to fra1", () => {
  const { home, lines } = bootLines(NODES, "UTC", now, BOOT_T);
  expect(home).toBe("fra1");
  const all = lines.map((l) => l.text).join(" ");
  const rtt = (id: string) => Number(all.match(new RegExp(`${id}\\s+(\\d+) ms`))?.[1]);
  expect(rtt("lhr1")).toBeLessThan(rtt("syd1"));
});

test("line count is fixed, so server markup and the inline fill always line up", () => {
  expect(bootLines(NODES, "America/New_York", now, BOOT_T).lines).toHaveLength(bootLines(NODES, "UTC", now, BOOT_T).lines.length);
});

test("serializes into a working standalone function", () => {
  const revived = new Function(`return (${bootLines.toString()})`)() as typeof bootLines;
  expect(revived(NODES, "Asia/Kolkata", now, BOOT_T).home).toBe("bom1");
});
