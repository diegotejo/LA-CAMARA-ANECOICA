export interface ArticleSection {
  title: string;
  paragraphs: string[];
}

export interface ArticleEntry {
  id: string;
  slug: string;
  title: string;
  label: string;
  excerpt: string;
  relatedVideoTitle: string;
  relatedVideoUrl: string;
  publishedDate: string;
  sections: ArticleSection[];
}

export const articles: ArticleEntry[] = [
  {
    id: "art-01",
    slug: "ideologia-vs-identidad",
    title: "Ideología vs. identidad: cuando la pertenencia desplaza al proyecto",
    label: "Mini ensayo",
    excerpt:
      "Versión escrita del vídeo 'Ideología VS Identidad'. Un recorrido por la diferencia entre pensar políticamente en términos de proyecto común o hacerlo en clave de pertenencias, agravios y reconocimiento.",
    relatedVideoTitle: "Ideología VS Identidad",
    relatedVideoUrl: "https://youtu.be/egXuXfNlmfg?si=4D1QHyBLXrpOcAyO",
    publishedDate: "2026-03-04",
    sections: [
      {
        title: "1. La pregunta de partida",
        paragraphs: [
          "Cuando alguien se ubica políticamente hoy, muchas veces no empieza por una doctrina, una teoría del Estado o una idea de justicia. Empieza por un nosotros. La pregunta ya no es solo qué modelo de sociedad consideras deseable, sino con qué grupo te identificas y frente a qué grupo te defines.",
          "Esa mutación no es menor. Cambia el lenguaje de la política, el tipo de lealtades que se activan y también el modo en que se discute en el espacio público. La ideología ordena el conflicto en torno a principios y programas; la identidad lo reordena en torno a pertenencias, sensibilidades y fronteras morales.",
        ],
      },
      {
        title: "2. Lo que hacía la ideología",
        paragraphs: [
          "La ideología no es simplemente una etiqueta electoral. Es una forma de interpretar el mundo social: qué explica la desigualdad, qué papel debe tener el Estado, cómo se distribuye el poder y qué imagen del ser humano hay detrás de un proyecto político.",
          "Pensar ideológicamente obliga a relacionar piezas: economía, cultura, instituciones e historia. Por eso la ideología tiene una dimensión estructural. No se agota en una reivindicación concreta ni en un sentimiento de agravio. Intenta responder a cómo se organiza una sociedad y hacia dónde debería dirigirse.",
        ],
      },
      {
        title: "3. Por qué avanza la política identitaria",
        paragraphs: [
          "La identidad gana terreno porque ofrece algo que la ideología muchas veces no garantiza: reconocimiento inmediato. En contextos de fragmentación social, hiperexposición digital y debilitamiento de los grandes relatos, la pertenencia da cobijo, lenguaje y visibilidad.",
          "Además, la lógica de plataformas recompensa aquello que se expresa como marca de grupo. El mensaje identitario circula mejor porque simplifica, dramatiza y separa. Construye rápidamente un dentro y un fuera. Eso lo vuelve eficaz para movilizar, aunque no necesariamente para comprender la complejidad de un problema político.",
        ],
      },
      {
        title: "4. El riesgo de sustituir proyecto por posición moral",
        paragraphs: [
          "Cuando la identidad absorbe por completo a la ideología, la política corre el riesgo de convertirse en una disputa por prestigio moral. Lo decisivo deja de ser si una propuesta redistribuye poder, resuelve un conflicto o mejora una institución. Lo decisivo es qué simboliza y a quién ofende o valida.",
          "En ese escenario, los desacuerdos dejan de procesarse como choques entre interpretaciones del bien común y pasan a vivirse como agresiones existenciales. El adversario ya no aparece como quien sostiene una tesis equivocada, sino como quien amenaza una identidad. Y así el debate se empobrece y se endurece al mismo tiempo.",
        ],
      },
      {
        title: "5. Recuperar el nivel del análisis",
        paragraphs: [
          "Criticar la primacía de la identidad no significa negar que existan experiencias concretas de discriminación, desigualdad o invisibilización. Significa recordar que una política que solo administra reconocimientos simbólicos puede perder de vista las estructuras que producen subordinación material y dependencia política.",
          "Recuperar el plano ideológico no implica volver a consignas fosilizadas. Implica volver a preguntar por intereses, instituciones, poder, hegemonía y proyecto histórico. En otras palabras: salir del reflejo tribal para reconstruir un lenguaje político capaz de pensar más allá del bando propio.",
        ],
      },
    ],
  },
];

export function getArticleBySlug(slug: string) {
  return articles.find((article) => article.slug === slug);
}
