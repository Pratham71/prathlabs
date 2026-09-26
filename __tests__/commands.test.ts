import { complete, run } from "@/lib/commands";

test("navigation commands resolve projects by slug, name or man ref", () => {
  expect(run("open vessel").action).toEqual({ type: "nav", href: "/projects/vessel" });
  expect(run("man homelab(7)").action).toEqual({ type: "nav", href: "/projects/homelab" });
  expect(run("cd ~").action).toEqual({ type: "nav", href: "/" });
  expect(run("open nope").out[0]).toMatch(/No manual entry/);
});

test("settings commands emit actions; bad args print usage", () => {
  expect(run("sound off").action).toEqual({ type: "sound", on: false });
  expect(run("theme phosphor").action).toEqual({ type: "theme", name: "phosphor" });
  expect(run("theme pink").out[0]).toMatch(/usage/);
});

test("easter eggs", () => {
  expect(run("sudo make me a sandwich").out[0]).toMatch(/sudoers/);
  expect(run("rm -rf /").action).toEqual({ type: "shake" });
  expect(run("rm -fr /").action).toEqual({ type: "shake" });
  expect(run("rm notes.txt").action).toBeUndefined();
  expect(run(":q").action).toEqual({ type: "close" });
});

test("unknown commands point at help", () => {
  expect(run("florp").out[0]).toBe("command not found: florp. Try: help");
});

test("tab completion covers commands and arguments", () => {
  expect(complete("pro")).toEqual(["projects"]);
  expect(complete("open ve")).toEqual(["open vessel"]);
  expect(complete("theme p")).toEqual(["theme phosphor"]);
});
