// Decorations the game themes switch on in CSS (globals.css "page accents"); hidden otherwise.
export function ThemeAccents() {
  return (
    <div aria-hidden="true">
      <div className="acc acc-wanted">
        <i />
        <i />
        <i />
        <i />
        <i />
      </div>
      <div className="acc acc-horizon" />
      <div className="acc acc-drips">
        {Array.from({ length: 14 }, (_, i) => (
          <i key={i} />
        ))}
      </div>
      <div className="acc acc-hud">
        <i />
        <i />
      </div>
    </div>
  );
}
