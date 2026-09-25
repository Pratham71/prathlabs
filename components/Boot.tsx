const KEY = "boot-seen";
const LINES: [string, boolean?][] = [
  ["[    0.000000] prathlab: booting"],
  ["[    0.214381] mounting /projects ... done"],
  ["[    0.388102] eth0: link up (dxb)"],
  ["Started pratham.service", true],
];
const PLAY_MS = LINES.length * 320 + 450;
const FADE_MS = 150;

// Whole lifecycle runs inline before paint, so it never flashes in late and never waits on hydration:
// start (unless reduced motion, already seen this session, or opened in a background tab), finish on
// timer or any key/tap, then fire "boot:done" so the heatmap reveal plays where it can be seen.
// CSS also hides the overlay after 2.6s as a failsafe if this script is interrupted.
export const bootScript = `(function(){try{var d=document.documentElement;if(document.hidden||matchMedia("(prefers-reduced-motion: reduce)").matches||sessionStorage.getItem("${KEY}"))return;sessionStorage.setItem("${KEY}","1");d.dataset.boot="1";var done=function(){if(d.dataset.boot!=="1")return;d.dataset.boot="out";setTimeout(function(){delete d.dataset.boot;dispatchEvent(new Event("boot:done"))},${FADE_MS});removeEventListener("keydown",done);removeEventListener("pointerdown",done)};addEventListener("keydown",done);addEventListener("pointerdown",done);setTimeout(done,${PLAY_MS})}catch(e){}})()`;

// Decorative layer over the fully rendered page; hidden from assistive tech.
export function Boot() {
  return (
    <div className="boot" aria-hidden="true">
      {LINES.map(([text, ok], i) => (
        <p key={text} style={{ "--i": i } as React.CSSProperties}>
          {ok ? (
            <>
              [ <span className="ok">OK</span> ] {text}
            </>
          ) : (
            text
          )}
        </p>
      ))}
      <p className="skip-hint" style={{ "--i": 0 } as React.CSSProperties}>
        press any key to skip
      </p>
    </div>
  );
}
