// Tiny lab logo next to a product. Hover to see the lab name. Fictional brands.

const logos: Record<string, string> = {
  NutriLab: "/labs/nutrilab.png",
  GlyciMax: "/labs/glycimax.png",
  MarinePure: "/labs/marinepure.png",
  NordicSea: "/labs/nordicsea.png",
  "D-Sol": "/labs/dsol.png",
  FerroVie: "/labs/ferrovie.png",
  BioFlore: "/labs/bioflore.png",
  AdaptoNat: "/labs/adaptonat.png",
};

export function LabMark({ lab, size = 22 }: { lab: string; size?: number }) {
  const src = logos[lab];
  if (!src) {
    return (
      <span className="text-xs text-muted" title={lab}>
        {lab}
      </span>
    );
  }
  return (
    <img
      src={src}
      alt={lab}
      title={lab}
      width={size}
      height={size}
      className="inline-block rounded-full object-cover align-middle"
    />
  );
}
