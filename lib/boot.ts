export const BOOT_SEEN_KEY = "boot-seen";

export function shouldBoot({ reducedMotion, seen }: { reducedMotion: boolean; seen: boolean }) {
  return !reducedMotion && !seen;
}
