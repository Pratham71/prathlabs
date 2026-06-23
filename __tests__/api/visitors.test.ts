import { GET, POST } from "@/app/api/visitors/route";
import { NextRequest } from "next/server";

jest.mock("@/lib/redis", () => ({
  redis: {
    incr: jest.fn().mockResolvedValue(42),
    get: jest.fn().mockResolvedValue(42),
  },
}));

describe("GET /api/visitors", () => {
  it("returns current count", async () => {
    const req = new NextRequest("http://localhost/api/visitors");
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data).toEqual({ count: 42 });
  });
});

describe("POST /api/visitors", () => {
  it("increments and returns new count", async () => {
    const req = new NextRequest("http://localhost/api/visitors", {
      method: "POST",
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data).toEqual({ count: 42 });
  });
});
