import { revalidatePath, revalidateTag } from "next/cache";
import { del } from "@vercel/blob";
import { isAdminRequest } from "@/lib/admin";
import { SETTINGS_TAG, clean, readSettings, writeSettings, type Settings } from "@/lib/settings";

const deny = () => Response.json({ error: "not logged in" }, { status: 401 });

// Every file URL the settings point at (songs + reboot sounds).
const files = (s: Settings) => [...Object.values(s.music).flatMap((l) => l?.map((t) => t.src) ?? []), ...Object.values(s.reboot).map((r) => r?.src)];
// Only our own Blob store's files, never a site path or anything else, are deleted or accepted as uploads.
const isBlob = (u: string) => /^https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\//.test(u);

export async function GET(req: Request) {
  if (!isAdminRequest(req)) return deny();
  return Response.json(await readSettings());
}

// PUT the whole settings object. Files the old settings had and the new one dropped are deleted from Blob.
export async function PUT(req: Request) {
  if (!isAdminRequest(req)) return deny();
  const next = clean(await req.json().catch(() => null));
  if (!files(next).every((u) => typeof u === "string" && (isBlob(u) || u.startsWith("/")))) return Response.json({ error: "bad file url" }, { status: 400 });
  const prev = await readSettings();
  try {
    await writeSettings(next);
  } catch (e) {
    return Response.json({ error: String((e as Error).message) }, { status: 503 });
  }
  const keep = new Set(files(next));
  const gone = files(prev).filter((u): u is string => !!u && isBlob(u) && !keep.has(u));
  if (gone.length) await del(gone).catch(() => {}); // ponytail: an orphan blob costs cents; don't fail the save over it
  revalidateTag(SETTINGS_TAG, "max");
  revalidatePath("/", "layout");
  return Response.json(next);
}
