import { BOOT_T, NODES, bootLines } from "@/lib/boot-lines";
import { BootGlobe } from "@/components/BootGlobe";
import { CrtOverlay } from "@/components/CrtOverlay";

const KEY = "boot-seen";
const PLAY_MS = BOOT_T.man + 950;
const FADE_MS = 450; // CRT power-off (globals.css tv-off)
const INTRO_MS = 1400; // page sections' staggered rise (globals.css), then client navs stop replaying it

// Whole lifecycle runs inline before paint, so it never flashes in late and never waits on hydration:
// start (unless reduced motion, already seen this session, or opened in a background tab), finish on
// timer or any key/tap, then fire "boot:done" so the heatmap reveal plays where it can be seen.
// data-intro marks the first paint so sections rise in once; route changes use view transitions instead.
// Also applies the saved colour theme before paint. Taps on the sound toggle don't count as skip. __bootT0 is the shared clock the globe syncs its arcs to. CSS also hides the overlay as a failsafe.
export const bootScript = `(function(){try{var d=document.documentElement;try{if(localStorage.getItem("theme")==="phosphor")d.dataset.theme="phosphor"}catch(e){}if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;d.dataset.intro="";var intro=function(){setTimeout(function(){delete d.dataset.intro},${INTRO_MS})};if(document.hidden||sessionStorage.getItem("${KEY}"))return intro();sessionStorage.setItem("${KEY}","1");d.dataset.boot="1";window.__bootT0=performance.now();var done=function(e){if(d.dataset.boot!=="1"||(e&&e.target&&e.target.closest&&e.target.closest(".dock")))return;d.dataset.boot="out";intro();setTimeout(function(){delete d.dataset.boot;dispatchEvent(new Event("boot:done"))},${FADE_MS});removeEventListener("keydown",done);removeEventListener("pointerdown",done)};addEventListener("keydown",done);addEventListener("pointerdown",done);setTimeout(done,${PLAY_MS})}catch(e){}})()`;

// Runs as the overlay is parsed: rewrites the log for the visitor's timezone (nearest region, latencies, login time).
const fillScript = `(function(){try{var r=(${bootLines.toString()})(${JSON.stringify(NODES)},Intl.DateTimeFormat().resolvedOptions().timeZone||"UTC",new Date(),${JSON.stringify(BOOT_T)});var ps=document.querySelectorAll(".boot-log p");for(var i=0;i<ps.length;i++)ps[i].textContent=r.lines[i].text;document.documentElement.dataset.bootHome=r.home}catch(e){}})()`;

// Decorative layer over the fully rendered page; hidden from assistive tech.
export function Boot() {
  const { lines } = bootLines(NODES, "UTC", new Date(), BOOT_T);
  return (
    <div className="boot" aria-hidden="true">
      <BootGlobe />
      <div className="boot-log">
        {lines.map((l, i) => (
          // suppressHydrationWarning: the inline fill script rewrote this text for the visitor; keep it.
          <p key={i} suppressHydrationWarning className={l.ok ? "ok-line" : l.prompt ? "prompt" : undefined} style={{ "--t": `${l.t}ms` } as React.CSSProperties}>
            {l.text}
          </p>
        ))}
      </div>
      <p className="skip-hint">press any key to skip</p>
      <CrtOverlay />
      <script dangerouslySetInnerHTML={{ __html: fillScript }} />
    </div>
  );
}
