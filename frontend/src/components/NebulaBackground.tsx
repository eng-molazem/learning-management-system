export default function NebulaBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[var(--bg)] pointer-events-none">
      <div className="absolute inset-0 bg-nebula-radial" />
      <div
        className="nebula-blob w-[32rem] h-[32rem] bg-nebula-purple/40 animate-float"
        style={{ top: "-8rem", left: "-6rem" }}
      />
      <div
        className="nebula-blob w-[28rem] h-[28rem] bg-nebula-cyan/30 animate-float"
        style={{ top: "10%", right: "-8rem", animationDelay: "1.5s" }}
      />
      <div
        className="nebula-blob w-[26rem] h-[26rem] bg-nebula-pink/30 animate-float"
        style={{ bottom: "-6rem", left: "20%", animationDelay: "3s" }}
      />
      <svg className="absolute inset-0 h-full w-full opacity-40" aria-hidden="true">
        <defs>
          <pattern id="stars" width="140" height="140" patternUnits="userSpaceOnUse">
            <circle cx="10" cy="20" r="1" fill="white" opacity="0.5" />
            <circle cx="60" cy="80" r="1.4" fill="white" opacity="0.4" />
            <circle cx="100" cy="30" r="0.8" fill="white" opacity="0.6" />
            <circle cx="120" cy="110" r="1.1" fill="white" opacity="0.4" />
            <circle cx="30" cy="120" r="0.9" fill="white" opacity="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#stars)" />
      </svg>
    </div>
  );
}
