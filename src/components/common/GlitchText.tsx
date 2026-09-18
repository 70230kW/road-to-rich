export function GlitchText({ text }: { text: string }) {
  return (
    <span className="brand-glitch">
      {text}
      <span className="brand-glitch-layer brand-glitch-layer-a" aria-hidden="true">{text}</span>
      <span className="brand-glitch-layer brand-glitch-layer-b" aria-hidden="true">{text}</span>
    </span>
  );
}

