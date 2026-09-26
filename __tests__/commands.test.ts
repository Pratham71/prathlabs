import { complete, run } from "@/lib/commands";

test("navigation commands resolve projects by slug, name or man ref", () => {
  expect(run("open vessel").action).toEqual({ type: "nav", href: "/projects/vessel" });
  expect(run("man homelab(7)").action).toEqual({ type: "nav", href: "/projects/homelab" });
  expect(run("cd ~").action).toEqual({ type: "nav", href: "/" });
  expect(run("open nope").out[0]).toMatch(/No manual entry/);
});

test("settings commands emit actions; bad args list the options", () => {
  expect(run("sound off").action).toEqual({ type: "sound", on: false });
  expect(run("theme phosphor").action).toEqual({ type: "theme", name: "phosphor" });
  expect(run("theme gtavi").action).toEqual({ type: "theme", name: "gtavi" });
  const bad = run("theme pink");
  expect(bad.action).toBeUndefined();
  expect(bad.out.at(-1)).toMatch(/usage/);
  expect(bad.out.join()).toContain("fortnite");
});

test("easter eggs", () => {
  expect(run("sudo rm -rf /").out[0]).toMatch(/sudoers/);
  expect(run("sudo make me a sandwich").out[0]).toBe("okay.");
  expect(run("make me a sandwich").out[0]).toMatch(/yourself/);
  expect(run("rm -rf /").action).toEqual({ type: "shake" });
  expect(run("rm -fr /").action).toEqual({ type: "shake" });
  expect(run("rm notes.txt").action).toBeUndefined();
  expect(run(":q").action).toEqual({ type: "close" });
  expect(run("coffee").out[0]).toMatch(/pre-workout/);
  expect(run("uptime").out[0]).toMatch(/gym/);
});

test("game eggs switch themes or play an effect", () => {
  expect(run("hesoyam").action).toEqual({ type: "theme", name: "gtav" });
  expect(run("gta6").action).toEqual({ type: "theme", name: "gtavi" });
  expect(run("wasted").action).toEqual({ type: "fx", name: "wasted" });
  expect(run("gg").action).toEqual({ type: "fx", name: "victory" });
});

test("unknown commands point at help", () => {
  expect(run("florp").out[0]).toBe("command not found: florp. Try: help");
});

test("tab completion covers commands and arguments", () => {
  expect(complete("pro")).toEqual(["projects"]);
  expect(complete("open ve")).toEqual(["open vessel"]);
  expect(complete("theme p")).toEqual(["theme phosphor"]);
  expect(complete("theme gta")).toEqual(["theme gtav", "theme gtavi"]);
});
