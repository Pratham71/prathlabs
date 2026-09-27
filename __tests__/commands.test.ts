import { EGGS, complete, run } from "@/lib/commands";

test("navigation commands resolve projects by slug, name or man ref", () => {
  expect(run("open vessel").action).toEqual({ type: "nav", href: "/projects/vessel" });
  expect(run("man homelab(7)").action).toEqual({ type: "nav", href: "/projects/homelab" });
  expect(run("cd ~").action).toEqual({ type: "nav", href: "/" });
  expect(run("open nope").out[0]).toMatch(/No manual entry/);
});

test("settings commands emit actions; bad args list the options", () => {
  expect(run("sound off").action).toEqual({ type: "sound", on: false });
  expect(run("theme matrix").action).toEqual({ type: "theme", name: "matrix" });
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
  expect(run("reboot").action).toEqual({ type: "reboot" });
  expect(run("intro").action).toEqual({ type: "reboot" });
  expect(run("radio next").action).toEqual({ type: "radio", op: "next" });
  expect(run("cat hobbies.txt").out.join()).toMatch(/--gym/);
  expect(run("coffee").out[0]).toMatch(/pre-workout/);
  expect(run("uptime").out[0]).toMatch(/gym/);
});

test("game eggs switch themes or play an effect", () => {
  expect(run("hesoyam").action).toEqual({ type: "theme", name: "gtav" });
  expect(run("gta6").action).toEqual({ type: "theme", name: "gtavi" });
  expect(run("daywalker").action).toEqual({ type: "theme", name: "blade" });
  expect(run("bluepill").action).toEqual({ type: "theme", name: "amber" });
  expect(run("creeper").action).toEqual({ type: "theme", name: "minecraft" });
  expect(run("wasted").action).toEqual({ type: "fx", name: "wasted" });
  expect(run("gg").action).toEqual({ type: "fx", name: "victory" });
});

test("unknown commands point at help", () => {
  expect(run("florp").out[0]).toBe("command not found: florp. Try: help");
});

test("tab completion covers commands and arguments", () => {
  expect(complete("pro")).toEqual(["projects"]);
  expect(complete("open ve")).toEqual(["open vessel"]);
  expect(complete("theme m")).toEqual(["theme matrix", "theme minecraft"]);
  expect(complete("theme gta")).toEqual(["theme gtav", "theme gtavi"]);
});

test("egg hunt: commands report their egg, eggs counts, hint skips found ones", () => {
  expect(EGGS).toHaveLength(32);
  expect(new Set(EGGS.map(([n]) => n)).size).toBe(32);
  expect(run("creeper").egg).toBe("creeper");
  expect(run("minecraft").egg).toBe("creeper");
  expect(run("sudo make me a sandwich").egg).toBe("sandwich");
  expect(run("sudo reboot").egg).toBe("sudo");
  expect(run("sudo su").egg).toBeUndefined();
  expect(run("rm -rf /").egg).toBe("rm -rf");
  expect(run("rm notes.txt").egg).toBeUndefined();
  expect(run("help").egg).toBeUndefined();
  const eggs = run("eggs", undefined, ["gg", "sl"]).out;
  expect(eggs[0]).toBe("found 2/32");
  expect(eggs.join(" ")).toContain("gg");
  expect(eggs.join(" ")).not.toContain("hesoyam");
  const all = EGGS.map(([n]) => n);
  expect(run("hint", undefined, all.slice(1)).out[0]).toBe(`hint: ${EGGS[0][1]}`);
  expect(run("hint", undefined, all).out[0]).toMatch(/all found/);
});

test("egg names complete only after the first find, from 3 letters", () => {
  expect(complete("hes")).toEqual([]);
  expect(complete("hes", ["gg"])).toEqual(["hesoyam"]);
  expect(complete("he", ["gg"])).toEqual(["help"]);
});
