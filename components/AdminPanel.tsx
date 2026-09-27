"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { Section } from "@/components/Man";
import { MUSIC, REBOOT_SOUNDS, fmtTime, isSoundCloud, parseTime } from "@/content/music";
import { THEMES, THEME_LABEL, type Theme } from "@/lib/theme";
import { EGG_SOUNDS, SCENE_SOUNDS, type EggSound, type SceneSound, type Settings } from "@/lib/settings";

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

const SCENE_LABEL: Record<SceneSound, string> = { siren: "police siren", heli: "helicopter", jet: "jets", boom: "explosion" };
const EGG_LABEL: Record<EggSound, string> = { storm: "storm", greatpower: "with great power", wanted: "wanted (five stars)" };

// A volume typed as 0-100. Saves on Enter or when the field loses focus, only if it changed.
function Vol({ value, onSave, disabled }: { value: number; onSave: (v: number) => void; disabled?: boolean }) {
  const pct = Math.round(value * 100);
  const commit = (el: HTMLInputElement) => {
    const n = Math.round(Number(el.value));
    if (el.value === "" || !Number.isFinite(n) || n < 0 || n > 100) return void (el.value = String(pct));
    if (n !== pct) onSave(n / 100);
  };
  return (
    <label>
      vol{" "}
      <input
        key={pct}
        className="admin-vol"
        type="number"
        min={0}
        max={100}
        step={1}
        inputMode="numeric"
        defaultValue={pct}
        disabled={disabled}
        onBlur={(e) => commit(e.currentTarget)}
        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), e.currentTarget.blur())}
      />
      %
    </label>
  );
}

// Where a song starts, typed as 1:23 (or 83, or 1:02:03); blank starts it at 0:00. Saves on blur or Enter.
function Start({ value, onSave, disabled }: { value?: number; onSave: (sec: number | undefined) => void; disabled?: boolean }) {
  const shown = value ? fmtTime(value) : "";
  const commit = (el: HTMLInputElement) => {
    const t = el.value.trim();
    const sec = t ? parseTime(t) : undefined;
    if (t && sec === undefined) return void (el.value = shown); // not a time: put it back
    if ((sec || undefined) !== (value || undefined)) onSave(sec || undefined);
  };
  return (
    <label>
      from{" "}
      <input
        key={shown}
        className="admin-vol admin-start"
        inputMode="numeric"
        placeholder="0:00"
        aria-label="Start at (m:ss)"
        defaultValue={shown}
        disabled={disabled}
        onBlur={(e) => commit(e.currentTarget)}
        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), e.currentTarget.blur())}
      />
    </label>
  );
}

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

  const put = async (file: File, dir: "music" | "sfx", onPct: (n: number) => void, folder: string = theme) =>
    (
      await upload(`${dir}/${folder}/${slug(file.name)}${ext(file.name)}`, file, {
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

        <p className="admin-row">
          default volume for new uploads: <Vol value={s.uploadVolume} disabled={locked} onSave={(v) => save({ ...s, uploadVolume: v })} />
        </p>
        <p className="muted">uploaded (play first)</p>
        {songs.length ? (
          <ol className="admin-list">
            {songs.map((song, i) => (
              <li key={song.src}>
                {song.title} · <span className="muted">{song.artist}</span>
                {isSoundCloud(song.src) && <span className="muted"> · soundcloud</span>}{" "}
                <Start
                  value={song.start}
                  disabled={locked}
                  onSave={(sec) => {
                    const { start: _old, ...rest } = song;
                    void _old;
                    void save({ ...s, music: { ...s.music, [theme]: songs.map((x) => (x === song ? { ...rest, ...(sec ? { start: sec } : {}) } : x)) } }, sec ? `starts at ${fmtTime(sec)}` : "starts at 0:00");
                  }}
                />{" "}
                <Vol value={song.volume ?? 1} disabled={locked} onSave={(v) => save({ ...s, music: { ...s.music, [theme]: songs.map((x) => (x === song ? { ...x, volume: v } : x)) } })} />{" "}
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

        <p className="muted">in the repo (content/music.ts; start times set here override its)</p>
        <ul className="admin-list">
          {(MUSIC[theme] ?? []).map((m) => (
            <li key={m.src}>
              {m.title} · <span className="muted">{m.artist}</span>
              {isSoundCloud(m.src) && <span className="muted"> · soundcloud</span>}{" "}
              <Start
                value={s.starts[m.src] ?? m.start}
                disabled={locked}
                onSave={(sec) => {
                  const { [m.src]: _old, ...rest } = s.starts;
                  void _old;
                  void save({ ...s, starts: sec ? { ...rest, [m.src]: sec } : rest }, sec ? `starts at ${fmtTime(sec)}` : "starts at 0:00");
                }}
              />
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
              const start = parseTime(String(f.get("start") ?? "")) || undefined;
              const volume = Math.min(100, Math.max(0, Number(f.get("volume") ?? 100))) / 100;
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
              start at <input name="start" inputMode="numeric" placeholder="1:23" pattern="\d+(:[0-5]?\d){0,2}" title="seconds, m:ss or h:mm:ss" />
            </label>
            <label>
              volume <input key={s.uploadVolume} className="admin-vol" name="volume" type="number" min={0} max={100} step={1} inputMode="numeric" defaultValue={Math.round(s.uploadVolume * 100)} />%
            </label>
            <button type="submit">upload</button>
          </fieldset>
        </form>

        {/* nothing hosted here: the song plays in SoundCloud's own player inside the radio card */}
        <form
          className="admin-form"
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            const src = String(f.get("url")).trim().split(/[?#]/)[0];
            if (!isSoundCloud(src)) return setStatus("that's not a soundcloud.com track link");
            const start = parseTime(String(f.get("start") ?? "")) || undefined;
            const volume = Math.min(100, Math.max(0, Number(f.get("volume") ?? 100))) / 100;
            const track = { title: String(f.get("title")).trim(), artist: String(f.get("artist")).trim(), src, ...(start ? { start } : {}), ...(volume !== 1 ? { volume } : {}) };
            (e.target as HTMLFormElement).reset();
            await save({ ...s, music: { ...s.music, [theme]: [...songs, track] } }, "soundcloud song added");
          }}
        >
          <fieldset disabled={locked}>
            <legend>or add a SoundCloud song to {THEME_LABEL[theme]}</legend>
            <label>
              link <input name="url" type="url" required placeholder="https://soundcloud.com/m83/midnight-city" />
            </label>
            <label>
              title <input name="title" required maxLength={120} />
            </label>
            <label>
              artist <input name="artist" maxLength={120} />
            </label>
            <label>
              start at <input name="start" inputMode="numeric" placeholder="1:23" pattern="\d+(:[0-5]?\d){0,2}" title="seconds, m:ss or h:mm:ss" />
            </label>
            <label>
              volume <input key={s.uploadVolume} className="admin-vol" name="volume" type="number" min={0} max={100} step={1} inputMode="numeric" defaultValue={Math.round(s.uploadVolume * 100)} />%
            </label>
            <button type="submit">add</button>
          </fieldset>
        </form>
      </Section>

      <Section name="REBOOT SOUND">
        {why && <p className="admin-why">{why}</p>}
        <p>
          {THEME_LABEL[theme]}: {reboot ? `uploaded file, volume ${Math.round((reboot.volume ?? 0.6) * 100)}%` : REBOOT_SOUNDS[theme] ? `repo default ${REBOOT_SOUNDS[theme]!.src}` : "synth"}
        </p>
        {reboot && (
          <p>
            <Vol value={reboot.volume ?? 0.6} disabled={locked} onSave={(v) => save({ ...s, reboot: { ...s.reboot, [theme]: { ...reboot, volume: v } } })} />{" "}
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
                await save({ ...s, reboot: { ...s.reboot, [theme]: { src, volume: reboot?.volume ?? s.uploadVolume } } }, "reboot sound set");
              } catch (err) {
                setBusy(false);
                setStatus(`upload failed: ${(err as Error).message}`);
              }
            }}
          />
        </label>
      </Section>

      <Section name="SCENE SOUNDS">
        {why && <p className="admin-why">{why}</p>}
        <p className="muted">los santos background: chases, jets, the oppressor&apos;s missile. only with the site sound on.</p>
        <ul className="admin-list">
          {SCENE_SOUNDS.map((k) => {
            const cur = s.scene[k] ?? {};
            const set = (next: typeof cur, msg?: string) => save({ ...s, scene: { ...s.scene, [k]: next } }, msg);
            return (
              <li key={k}>
                <label>
                  <input type="checkbox" checked={!cur.off} disabled={locked} onChange={(e) => set({ ...cur, off: e.target.checked ? undefined : true }, e.target.checked ? `${SCENE_LABEL[k]} on` : `${SCENE_LABEL[k]} off`)} /> {SCENE_LABEL[k]}
                </label>{" "}
                <span className="muted">{cur.src ? "uploaded clip" : "synth"}</span>{" "}
                <Vol value={cur.volume ?? (cur.src ? 0.6 : 1)} disabled={locked} onSave={(v) => set({ ...cur, volume: v })} />{" "}
                {cur.src && (
                  <>
                    <button type="button" disabled={locked} onClick={() => Object.assign(new Audio(cur.src), { volume: cur.volume ?? 0.6 }).play()}>
                      play
                    </button>{" "}
                    <button type="button" disabled={locked} onClick={() => set({ ...cur, src: undefined }, "back to the synth")}>
                      use synth
                    </button>{" "}
                  </>
                )}
                <label>
                  {cur.src ? "replace" : "upload clip"}{" "}
                  <input
                    type="file"
                    accept="audio/*"
                    disabled={noUpload}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setBusy(true);
                      try {
                        const src = await put(file, "sfx", (n) => setStatus(`uploading ${n}%`), `scene-${k}`);
                        e.target.value = "";
                        await set({ ...cur, src, volume: cur.src ? cur.volume : s.uploadVolume }, `${SCENE_LABEL[k]} clip set`);
                      } catch (err) {
                        setBusy(false);
                        setStatus(`upload failed: ${(err as Error).message}`);
                      }
                    }}
                  />
                </label>
              </li>
            );
          })}
        </ul>
      </Section>

      <Section name="EGG SOUNDS">
        {why && <p className="admin-why">{why}</p>}
        <p className="muted">played with the egg&apos;s effect, on every theme</p>
        <ul className="admin-list">
          {EGG_SOUNDS.map((k) => {
            const cur = s.sfx[k];
            return (
              <li key={k}>
                {EGG_LABEL[k]}: {cur ? "uploaded" : <span className="muted">none</span>}{" "}
                {cur && (
                  <>
                    <Vol value={cur.volume ?? 0.6} disabled={locked} onSave={(v) => save({ ...s, sfx: { ...s.sfx, [k]: { ...cur, volume: v } } })} />{" "}
                    <button type="button" disabled={locked} onClick={() => Object.assign(new Audio(cur.src), { volume: cur.volume ?? 0.6 }).play()}>
                      play
                    </button>{" "}
                    <button
                      type="button"
                      disabled={locked}
                      onClick={() => {
                        const { [k]: _gone, ...rest } = s.sfx;
                        void _gone;
                        void save({ ...s, sfx: rest }, "removed");
                      }}
                    >
                      remove
                    </button>{" "}
                  </>
                )}
                <label>
                  {cur ? "replace" : "upload"}{" "}
                  <input
                    type="file"
                    accept="audio/*"
                    disabled={noUpload}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setBusy(true);
                      try {
                        const src = await put(file, "sfx", (n) => setStatus(`uploading ${n}%`), `egg-${k}`);
                        e.target.value = "";
                        await save({ ...s, sfx: { ...s.sfx, [k]: { src, volume: cur?.volume ?? s.uploadVolume } } }, `${EGG_LABEL[k]} sound set`);
                      } catch (err) {
                        setBusy(false);
                        setStatus(`upload failed: ${(err as Error).message}`);
                      }
                    }}
                  />
                </label>
              </li>
            );
          })}
        </ul>
      </Section>
    </>
  );
}
