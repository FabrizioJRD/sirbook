import { Notebook, Section, Block } from '@sirbook/shared';

export const INITIAL_NOTEBOOKS: Notebook[] = [
  {
    id: 'nb-bio',
    user_id: 'local-user',
    title: 'Biología Molecular y Bioquímica',
    description: 'Rutas metabólicas, ciclo celular y fundamentos genéticos',
    cover_color: '#059669',
    icon: 'dna',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'nb-cs',
    user_id: 'local-user',
    title: 'Algoritmos y Ciencias de la Computación',
    description: 'Estructuras de datos avanzadas, optimización sobre grafos e IA',
    cover_color: '#4F46E5',
    icon: 'cpu',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'nb-econ',
    user_id: 'local-user',
    title: 'Economía y Sistemas Distribuidos',
    description: 'Políticas monetarias, teoría de juegos y blockchain',
    cover_color: '#D97706',
    icon: 'trending-up',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date().toISOString()
  }
];

export const INITIAL_SECTIONS: Section[] = [
  // Biología
  {
    id: 'sec-bio-1',
    notebook_id: 'nb-bio',
    user_id: 'local-user',
    title: 'Metabolismo y Bioenergética',
    position: 0,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'sec-bio-2',
    notebook_id: 'nb-bio',
    user_id: 'local-user',
    title: 'Genética y Replicación',
    position: 1,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date().toISOString()
  },
  // Computación
  {
    id: 'sec-cs-1',
    notebook_id: 'nb-cs',
    user_id: 'local-user',
    title: 'Teoría de Grafos y Rutas',
    position: 0,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'sec-cs-2',
    notebook_id: 'nb-cs',
    user_id: 'local-user',
    title: 'Arquitecturas Modernas de IA',
    position: 1,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date().toISOString()
  },
  // Economía
  {
    id: 'sec-econ-1',
    notebook_id: 'nb-econ',
    user_id: 'local-user',
    title: 'Macroeconomía e Inflación',
    position: 0,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'sec-econ-2',
    notebook_id: 'nb-econ',
    user_id: 'local-user',
    title: 'Criptografía y Blockchain',
    position: 1,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date().toISOString()
  }
];

export const INITIAL_BLOCKS: Block[] = [
  // === Biología: sec-bio-1 ===
  {
    id: 'blk-bio-1',
    section_id: 'sec-bio-1',
    notebook_id: 'nb-bio',
    user_id: 'local-user',
    mode: 'concept',
    keyword: 'Mitocondria',
    context_path: 'Biología Molecular > Metabolismo y Bioenergética',
    position: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    content: {
      modo: 'concepto',
      titulo: 'Mitocondria',
      contexto: 'Biología Celular > Metabolismo Energético',
      definicion_corta: 'Orgánulo celular eucariota delimitado por una doble membrana, especializado en la generación masiva de ATP mediante la cadena de transporte de electrones y la fosforilación oxidativa.',
      puntos_clave: [
        'Doble Membrana: La membrana interna posee pliegues (crestas) que aumentan la superficie catalítica de la ATP sintasa.',
        'Teoría Endosimbiótica: Conserva su propio genoma circular cerrado (ADNmt) y ribosomas de tipo bacteriano (70S).',
        'Señalización de Apoptosis: Desencadena la muerte celular programada al liberar citocromo c al citosol.'
      ],
      aplicaciones: [
        'Terapias genéticas para mitocondriopatías y síndromes metabólicos congénitos.',
        'Estudios de genealogía evolutiva y linajes maternos usando ADN mitocondrial.'
      ],
      fuentes: [
        { title: 'Nature Education - Mitochondria', url: 'https://www.nature.com/scitable/topicpage/mitochondria-14053590/' },
        { title: 'NCBI Bookshelf - Cell Respiration', url: 'https://www.ncbi.nlm.nih.gov/books/NBK9896/' }
      ]
    }
  },
  {
    id: 'blk-bio-2',
    section_id: 'sec-bio-1',
    notebook_id: 'nb-bio',
    user_id: 'local-user',
    mode: 'graphic',
    keyword: 'Ciclo de Krebs',
    context_path: 'Biología Molecular > Metabolismo y Bioenergética',
    position: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    content: {
      modo: 'grafico',
      tipo_grafico: 'mermaid_flowchart',
      titulo: 'Ruta Metabólica del Ciclo de Krebs',
      contexto: 'Bioquímica > Matriz Mitocondrial',
      codigo_render: `graph TD
  OAA["Oxalacetato (4C)"] -->|"+ Acetil-CoA"| CIT["Citrato (6C)"]
  CIT --> ISOCIT["Isocitrato (6C)"]
  ISOCIT -->|"NADH + CO2"| ALFA["Alfa-cetoglutarato (5C)"]
  ALFA -->|"NADH + CO2"| SUCC_COA["Succinil-CoA (4C)"]
  SUCC_COA -->|"GTP"| SUCC["Succinato (4C)"]
  SUCC -->|"FADH2"| FUM["Fumarato (4C)"]
  FUM --> MAL["Malato (4C)"]
  MAL -->|"NADH"| OAA`,
      descripcion_corta: 'Ciclo continuo de oxidación que produce NADH y FADH2 para alimentar la cadena de transporte de electrones.',
      fuentes: [
        { title: 'Khan Academy - Ciclo del Ácido Cítrico', url: 'https://es.khanacademy.org/science/biology/cellular-respiration-and-fermentation' }
      ]
    }
  },
  {
    id: 'blk-bio-3',
    section_id: 'sec-bio-1',
    notebook_id: 'nb-bio',
    user_id: 'local-user',
    mode: 'curiosity',
    keyword: 'ADN Compartido Plátano',
    context_path: 'Biología Molecular > Genética y Replicación',
    position: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    content: {
      modo: 'dato',
      titular: 'ADN Humano y el Genoma del Plátano',
      contexto: 'Genética Evolutiva > Homología Genómica',
      cifra_destacada: '60% de Homología Genética',
      explicacion: 'Los seres humanos compartimos aproximadamente el 60% de nuestros genes con los plátanos. Esto se debe a que compartimos ancestros comunes unicelulares y los genes que regulan la división celular y la replicación del ADN se han conservado por miles de millones de años.',
      fuente_verificada: {
        title: 'National Human Genome Research Institute (NHGRI)',
        url: 'https://www.genome.gov'
      }
    }
  },
  {
    id: 'blk-bio-4',
    section_id: 'sec-bio-1',
    notebook_id: 'nb-bio',
    user_id: 'local-user',
    mode: 'free',
    keyword: null,
    context_path: null,
    position: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    content: {
      modo: 'libre',
      titulo: 'Apuntes de Laboratorio: Balance Energético',
      markdown: `### Ecuación Global de Respiración Aeróbica
$$\\text{C}_6\\text{H}_{12}\\text{O}_6 + 6\\text{O}_2 \\rightarrow 6\\text{CO}_2 + 6\\text{H}_2\\text{O} + \\sim 30-32\\text{ ATP}$$

- **Glucólisis Citoplasmática:** 2 ATP netos + 2 NADH
- **Descarboxilación del Piruvato:** 2 NADH
- **Ciclo de Krebs (2 vueltas):** 2 GTP + 6 NADH + 2 FADH2
- **Fosforilación Oxidativa:** Mayoría del ATP producido por el gradiente quimiosmótico.`
    }
  },

  // === Computación: sec-cs-1 ===
  {
    id: 'blk-cs-1',
    section_id: 'sec-cs-1',
    notebook_id: 'nb-cs',
    user_id: 'local-user',
    mode: 'concept',
    keyword: 'Algoritmo de Dijkstra',
    context_path: 'Ciencias de la Computación > Teoría de Grafos',
    position: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    content: {
      modo: 'concepto',
      titulo: 'Algoritmo de Dijkstra',
      contexto: 'Estructuras de Datos > Algoritmos sobre Grafos',
      definicion_corta: 'Algoritmo voraz (greedy) que calcula el camino más corto desde un nodo inicial hacia todos los demás nodos en un grafo ponderado con pesos en las aristas estrictamente no negativos.',
      puntos_clave: [
        'Estrategia Voraz: Mantiene un conjunto de nodos evaluados y explora permanentemente el vértice alcanzable de menor distancia tentativa.',
        'Complejidad Óptima: O((V + E) log V) al emplear colas de prioridad con montículos binarios o de Fibonacci.',
        'Restricción Estricta: Falla ante aristas con peso negativo (para las cuales se debe utilizar Bellman-Ford).'
      ],
      aplicaciones: [
        'Protocolos de enrutamiento dinámico en redes IP como OSPF (Open Shortest Path First).',
        'Sistemas de navegación geográfica satelital y optimización de flotas en tiempo real.'
      ],
      fuentes: [
        { title: 'MIT OpenCourseWare - Dijkstra Algorithm', url: 'https://ocw.mit.edu' }
      ]
    }
  },
  {
    id: 'blk-cs-2',
    section_id: 'sec-cs-1',
    notebook_id: 'nb-cs',
    user_id: 'local-user',
    mode: 'graphic',
    keyword: 'Pipeline de Red Neuronal Transformer',
    context_path: 'Ciencias de la Computación > Arquitecturas Modernas de IA',
    position: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    content: {
      modo: 'grafico',
      tipo_grafico: 'mermaid_flowchart',
      titulo: 'Mecanismo de Auto-Atención (Transformer)',
      contexto: 'Deep Learning > Arquitecturas Neuronales',
      codigo_render: `graph TD
  TOKENS["Texto de Entrada"] --> EMBED["Token Embeddings + Positional Encoding"]
  EMBED --> QKV["Proyección Q, K, V"]
  QKV --> ATTN["Attention: softmax(Q * K^T / sqrt(d_k)) * V"]
  ATTN --> ADD1["Conexión Residual + LayerNorm"]
  ADD1 --> FFN["Feed-Forward Dense Network"]
  FFN --> ADD2["Conexión Residual + LayerNorm"]
  ADD2 --> OUT["Representación Contextual"]`,
      descripcion_corta: 'Esquema del bloque Transformer con atención multi-cabezal y normalización residual.',
      fuentes: [
        { title: 'Attention Is All You Need (Vaswani et al.)', url: 'https://arxiv.org/abs/1706.03762' }
      ]
    }
  },
  {
    id: 'blk-cs-3',
    section_id: 'sec-cs-1',
    notebook_id: 'nb-cs',
    user_id: 'local-user',
    mode: 'curiosity',
    keyword: 'Complejidad Computacional',
    context_path: 'Ciencias de la Computación > Teoría de Grafos',
    position: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    content: {
      modo: 'dato',
      titular: 'El Problema P versus NP del Milenio',
      contexto: 'Complejidad Algorítmica > Problemas del Milenio',
      cifra_destacada: '$1,000,000 USD de Recompensa',
      explicacion: 'Resolver si toda pregunta cuya respuesta puede verificarse rápidamente (NP) también puede resolverse rápidamente (P) es uno de los problemas del milenio del Instituto Clay de Matemáticas, con un millón de dólares para quien lo resuelva.',
      fuente_verificada: {
        title: 'Clay Mathematics Institute - Millennium Problems',
        url: 'https://www.claymath.org/millennium-problems/'
      }
    }
  }
];
