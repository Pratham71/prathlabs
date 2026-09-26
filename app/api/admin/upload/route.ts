import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { isAdminRequest } from "@/lib/admin";

// Vercel Blob client uploads: the browser sends the file straight to Blob; this route only hands out
// a short-lived token, and only to a logged-in admin. The panel saves the URL into settings afterwards.
export async function POST(req: Request) {
  const body = (await req.json()) as HandleUploadBody;
  // Blob's own completion callback carries no cookie; the token request does.
  if (body.type === "blob.generate-client-token" && !(await isAdminRequest(req))) return Response.json({ error: "not logged in" }, { status: 401 });
  try {
    return Response.json(
      await handleUpload({
        request: req,
        body,
        onBeforeGenerateToken: async (pathname) => {
          if (!/^(music|sfx)\/[a-z0-9-]+\/[\w.-]+$/i.test(pathname)) throw new Error("bad path");
          return { allowedContentTypes: ["audio/*"], maximumSizeInBytes: 25 * 1024 * 1024, addRandomSuffix: true };
        },
        onUploadCompleted: async () => {},
      }),
    );
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 400 });
  }
}
