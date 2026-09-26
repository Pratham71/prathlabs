import type { Metadata } from "next";
import { cookies } from "next/headers";
import { ManPage, Section } from "@/components/Man";
import { AdminLogin, AdminPanel } from "@/components/AdminPanel";
import { ADMIN_COOKIE, adminConfigured, isAdmin } from "@/lib/admin";
import { readSettings } from "@/lib/settings";
import { hasRedis } from "@/lib/redis";

export const metadata: Metadata = {
  title: "admin",
  robots: { index: false, follow: false },
};

// Reached from the palette (`sudo su`) or directly. The cookie is checked here and again by every API call.
export default async function Admin() {
  const authed = await isAdmin((await cookies()).get(ADMIN_COOKIE)?.value);
  return (
    <ManPage title="ADMIN" section={8} footLeft="root" footMid="admin">
      <div className="admin">
        {authed ? (
          <AdminPanel
            initial={await readSettings()}
            ready={{
              redis: hasRedis(),
              blob: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
              spotify: Boolean(
                process.env.SPOTIFY_CLIENT_ID &&
                process.env.SPOTIFY_CLIENT_SECRET &&
                process.env.SPOTIFY_REFRESH_TOKEN,
              ),
            }}
          />
        ) : (
          <Section name="LOGIN" plain>
            <AdminLogin configured={adminConfigured()} />
          </Section>
        )}
      </div>
    </ManPage>
  );
}
