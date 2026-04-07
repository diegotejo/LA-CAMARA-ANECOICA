export interface SeriesPreview {
  id: string;
  name: string;
  accent?: string;
  desc: string;
  videoSrc: string;
  href: string;
}

export const SERIES_PREVIEWS: SeriesPreview[] = [
  {
    id: "orbis",
    name: "Orbis Terrarum",
    desc: "Geopolítica, relaciones internacionales y mapas de poder que ordenan el conflicto global.",
    videoSrc: "/intros/orbis-terrarum.mp4",
    href: "/videos",
  },
  {
    id: "tribu",
    name: "La Tribu",
    desc: "Ideología, identidad y filosofía política para leer la lucha cultural sin consignas fáciles.",
    videoSrc: "/intros/la-tribu.mp4",
    href: "/videos",
  },
  {
    id: "antipendulo",
    name: "Antipéndulo",
    desc: "Pensamiento crítico para escapar de extremos, reflejos tribales y falsos dilemas mediáticos.",
    videoSrc: "/intros/antipendulo.mp4",
    href: "/videos",
  },
];
