"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { Section } from "@/components/Man";
import { MUSIC, REBOOT_SOUNDS } from "@/content/music";
import { THEMES, THEME_LABEL, type Theme } from "@/lib/theme";
import type { Settings } from "@/lib/settings";

// /admin, logged out: same password as the palette's `sudo su`.
export function AdminLogin({ configured }: { configured: boolean }) {
  const [err, setErr] = useState("");
  if (!configured) return <p>Set ADMIN_PASSWORD and ADMIN_SECRET in the environment, then redeploy.</p>;
  return (
    <form
      className="admin-form"
      onSubmit={async (e) => {
        e.preventDefault();
        const password = new FormData(e.currentTarget).get("password");
        const r = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
        if (r.ok) location.reload(); // full load so the page renders with the new session cookie
        else setErr((await r.json().catch(() => ({}))).error ?? "Sorry, try again.");
      }}
    >
      <label>
        [sudo] password for pratham: <input name="password" type="password" autoComplete="current-password" autoFocus required />
      </label>
      <button type="submit">login</button>
      {err && <p role="alert">{err}</p>}
    </form>
  );
}

const slug = (name: string) =>
  name
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || "file";
const ext = (name: string) => (name.match(/\.[a-z0-9]{2,4}$/i)?.[0] ?? ".mp3").toLowerCase();

type Ready = { redis: boolean; blob: boolean; spotify: boolean };

// Every change saves right away (PUT /api/admin/settings) and reaches visitors on their next page load.
export function AdminPanel({ initial, ready }: { initial: Settings; ready: Ready }) {
  const router = useRouter();
  const [s, setS] = useState(initial);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [theme, setTheme] = useState<Theme>("gtav");

  const save = async (next: Settings, msg = "saved") => {
    setBusy(true);
    setStatus("saving...");
    const r = await fetch("/api/admin/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(next) }).catch(() => null);
    setBusy(false);
    if (r?.ok) {
      setS(await r.json());
      setStatus(msg);
    } else setStatus(`error: ${r ? ((await r.json().catch(() => ({}))).error ?? r.status) : "network"}`);
  };

  const put = async (file: File, dir: "music" | "sfx", onPct: (n: number) => void) =>
    (
      await upload(`${dir}/${theme}/${slug(file.name)}${ext(file.name)}`, file, {
        access: "public",
        handleUploadUrl: "/api/admin/upload",
        multipart: file.size > 8 * 1024 * 1024,
        onUploadProgress: (p) => onPct(Math.round(p.percentage)),
      })
    ).url;

  // nothing can be saved without Redis; uploads also need Blob
  const locked = busy || !ready.redis;
  const noUpload = locked || !ready.blob;
  const why = !ready.redis ? "connect Upstash Redis in Vercel (Storage) and redeploy to change this" : !ready.blob ? "connect Vercel Blob with a read-write token and redeploy to upload" : "";

  const songs = s.music[theme] ?? [];
  const reboot = s.reboot[theme];

  return (
    <>
      <Section name="STATUS">
        <p>
          redis {ready.redis ? "ok" : "missing: settings can't be saved"} · blob {ready.blob ? "ok" : "missing: uploads off"} · spotify{" "}
          {ready.spotify ? "ok" : "not configured"}
        </p>
        <p className="admin-status" role="status" aria-live="polite">
          {status || "changes save instantly and show on the next page load"}
        </p>
        <p>
          <button
            type="button"
            onClick={async () => {
              await fetch("/api/admin/login", { method: "DELETE" });
              router.push("/");
            }}
          >
            logout
          </button>
        </p>
      </Section>

      <Section name="THEMES">
        {!ready.redis && <p className="admin-why">{why}</p>}
        <label className="admin-row">
          default for new visitors{" "}
          <select value={s.defaultTheme} disabled={locked} onChange={(e) => save({ ...s, defaultTheme: e.target.value as Theme })}>
            {s.themes.map((t) => (
              <option key={t} value={t}>
                {THEME_LABEL[t]}
              </option>
            ))}
          </select>
        </label>
        <fieldset className="admin-checks" disabled={locked}>
          <legend>in the dock&apos;s theme button</legend>
          {THEMES.map((t) => (
            <label key={t}>
              <input
                type="checkbox"
                checked={s.themes.includes(t)}
                disabled={t === "amber"}
                onChange={(e) => save({ ...s, themes: e.target.checked ? [...s.themes, t] : s.themes.filter((x) => x !== t) })}
              />{" "}
              {THEME_LABEL[t]}
            </label>
          ))}
        </fieldset>
      </Section>

      <Section name="SPOTIFY">
        {!ready.redis && <p className="admin-why">{why}</p>}
        <label className="admin-row">
          <input type="checkbox" checked={s.spotify} disabled={locked} onChange={(e) => save({ ...s, spotify: e.target.checked }, e.target.checked ? "spotify on" : "spotify off")} />{" "}
          show what i&apos;m listening to
        </label>
      </Section>

      <Section name="MUSIC">
        {why && <p className="admin-why">{why}</p>}
        <label className="admin-row">
          station{" "}
          <select value={theme} onChange={(e) => setTheme(e.target.value as Theme)}>
            {THEMES.filter((t) => t !== "amber").map((t) => (
              <option key={t} value={t}>
                {THEME_LABEL[t]}
              </option>
            ))}
          </select>
        </label>

        <p className="muted">uploaded (play first)</p>
        {songs.length ? (
          <ol className="admin-list">
            {songs.map((song, i) => (
              <li key={song.src}>
                {song.title} · <span className="muted">{song.artist}</span>
                {song.start ? <span className="muted"> · from {song.start}s</span> : null}{" "}
                <label>
                  vol{" "}
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    defaultValue={song.volume ?? 1}
                    disabled={locked}
                    aria-label={`${song.title} volume`}
                    onPointerUp={(e) => save({ ...s, music: { ...s.music, [theme]: songs.map((x) => (x === song ? { ...x, volume: Number(e.currentTarget.value) } : x)) } })}
                    onKeyUp={(e) => save({ ...s, music: { ...s.music, [theme]: songs.map((x) => (x === song ? { ...x, volume: Number(e.currentTarget.value) } : x)) } })}
                  />
                </label>{" "}
                <button type="button" disabled={locked || i === 0} onClick={() => save({ ...s, music: { ...s.music, [theme]: songs.map((x, j) => (j === i - 1 ? song : j === i ? songs[i - 1] : x)) } })} aria-label={`Move ${song.title} up`}>
                  up
                </button>{" "}
                <button
                  type="button"
                  disabled={locked}
                  onClick={() => confirm(`Remove "${song.title}"? The file is deleted.`) && save({ ...s, music: { ...s.music, [theme]: songs.filter((x) => x !== song) } }, "removed")}
                >
                  remove
                </button>
              </li>
            ))}
          </ol>
        ) : (
          <p>none yet</p>
        )}

        <p className="muted">in the repo (public/music, see AUDIO.md; edit content/music.ts to change)</p>
        <ul className="admin-list">
          {(MUSIC[theme] ?? []).map((m) => (
            <li key={m.src}>
              {m.title} · <span className="muted">{m.artist}</span>
            </li>
          ))}
        </ul>

        <form
          className="admin-form"
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            const file = f.get("file") as File;
            if (!file?.size) return;
            setBusy(true);
            try {
              const src = await put(file, "music", (n) => setStatus(`uploading ${n}%`));
              const start = Number(f.get("start")) || undefined;
              const volume = Number(f.get("volume") ?? 1);
              const track = { title: String(f.get("title")).trim(), artist: String(f.get("artist")).trim(), src, ...(start ? { start } : {}), ...(volume !== 1 ? { volume } : {}) };
              (e.target as HTMLFormElement).reset();
              await save({ ...s, music: { ...s.music, [theme]: [...songs, track] } }, "song added");
            } catch (err) {
              setBusy(false);
              setStatus(`upload failed: ${(err as Error).message}`);
            }
          }}
        >
          <fieldset disabled={noUpload}>
            <legend>add a song to {THEME_LABEL[theme]}</legend>
            <label>
              file <input name="file" type="file" accept="audio/*" required />
            </label>
            <label>
              title <input name="title" required maxLength={120} />
            </label>
            <label>
              artist <input name="artist" maxLength={120} placeholder="M83 (https://youtu.be/...) links the song" />
            </label>
            <label>
              start at (seconds) <input name="start" type="number" min={0} step={1} inputMode="numeric" />
            </label>
            <label>
              volume <input name="volume" type="range" min={0} max={1} step={0.05} defaultValue={1} />
            </label>
            <button type="submit">upload</button>
          </fieldset>
        </form>
      </Section>

      <Section name="REBOOT SOUND">
        {why && <p className="admin-why">{why}</p>}
        <p>
          {THEME_LABEL[theme]}: {reboot ? `uploaded file, volume ${reboot.volume ?? 0.6}` : REBOOT_SOUNDS[theme] ? `repo default ${REBOOT_SOUNDS[theme]!.src}` : "synth"}
        </p>
        {reboot && (
          <p>
            <label>
              volume{" "}
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                defaultValue={reboot.volume ?? 0.6}
                disabled={locked}
                onPointerUp={(e) => save({ ...s, reboot: { ...s.reboot, [theme]: { ...reboot, volume: Number(e.currentTarget.value) } } })}
                onKeyUp={(e) => save({ ...s, reboot: { ...s.reboot, [theme]: { ...reboot, volume: Number(e.currentTarget.value) } } })}
              />
            </label>{" "}
            <button type="button" disabled={locked} onClick={() => new Audio(reboot.src).play()}>
              play
            </button>{" "}
            <button
              type="button"
              disabled={locked}
              onClick={() => {
                const { [theme]: _gone, ...rest } = s.reboot;
                void _gone;
                void save({ ...s, reboot: rest }, "back to the default");
              }}
            >
              reset
            </button>
          </p>
        )}
        <label className="admin-row">
          replace with{" "}
          <input
            type="file"
            accept="audio/*"
            disabled={noUpload}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setBusy(true);
              try {
                const src = await put(file, "sfx", (n) => setStatus(`uploading ${n}%`));
                e.target.value = "";
                await save({ ...s, reboot: { ...s.reboot, [theme]: { src, volume: reboot?.volume ?? 0.6 } } }, "reboot sound set");
              } catch (err) {
                setBusy(false);
                setStatus(`upload failed: ${(err as Error).message}`);
              }
            }}
          />
        </label>
      </Section>
    </>
  );
}
