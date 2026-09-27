import { revalidatePath, revalidateTag } from "next/cache";
import { del } from "@vercel/blob";
import { isAdminRequest } from "@/lib/admin";
import { SETTINGS_TAG, clean, isBlob, isSitePath, readSettings, writeSettings, type Settings } from "@/lib/settings";

const deny = () => Response.json({ error: "not logged in" }, { status: 401 });

// Every file URL the settings point at (songs, reboot sounds, egg sounds).
const files = (s: Settings) => [
  ...Object.values(s.music).flatMap((l) => l?.map((t) => t.src) ?? []),
  ...Object.values(s.reboot).map((r) => r?.src),
  ...Object.values(s.sfx).map((r) => r?.src),
  ...Object.values(s.scene).flatMap((r) => (r?.src ? [r.src] : [])),
];

export async function GET(req: Request) {
  if (!(await isAdminRequest(req))) return deny();
  return Response.json(await readSettings());
}

// PUT the whole settings object. Files the old settings had and the new one dropped are deleted from Blob.
export async function PUT(req: Request) {
  if (!(await isAdminRequest(req))) return deny();
  const next = clean(await req.json().catch(() => null));
  if (!files(next).every((u) => typeof u === "string" && (isBlob(u) || isSitePath(u)))) return Response.json({ error: "bad file url" }, { status: 400 });
  const prev = await readSettings();
  try {
    await writeSettings(next);
  } catch (e) {
    return Response.json({ error: String((e as Error).message) }, { status: 503 });
  }
  const keep = new Set(files(next));
  const gone = files(prev).filter((u): u is string => !!u && isBlob(u) && !keep.has(u));
  if (gone.length) await del(gone).catch(() => {}); // ponytail: an orphan blob costs cents; don't fail the save over it
  // expire now, not stale-while-revalidate ("max"), which would serve the old settings once more
  revalidateTag(SETTINGS_TAG, { expire: 0 });
  revalidatePath("/", "layout");
  return Response.json(next);
}
