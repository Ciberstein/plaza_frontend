// Category names are database content — seeded once, in Spanish, by
// `plaza_backend/seeders/data/categories.data.seeders.js` — and there is no
// admin flow yet to add a category outside that file. Rather than change the
// API to carry three languages for a table that today only ever grows by
// editing code, this is a frontend lookup table keyed by the same `slug` the
// backend already sends, translating what the backend cannot yet.
//
// Deliberately not exhaustive-proof: a new category added to the seeder
// without an entry here just shows its Spanish name in English and
// Portuguese too, the same way an untranslated string anywhere else would —
// not a crash, a gap to fill next time this file is touched.
export const CATEGORY_LABELS = {
  tecnologia: { en: 'Electronics', pt: 'Eletrônicos' },
  'tecnologia-celulares-y-accesorios': { en: 'Phones & accessories', pt: 'Celulares e acessórios' },
  'tecnologia-computadores-y-portatiles': { en: 'Computers & laptops', pt: 'Computadores e notebooks' },
  'tecnologia-televisores-y-audio': { en: 'TVs & audio', pt: 'TVs e áudio' },
  'tecnologia-consolas-y-videojuegos': { en: 'Consoles & video games', pt: 'Consoles e video games' },
  'tecnologia-camaras-y-fotografia': { en: 'Cameras & photography', pt: 'Câmeras e fotografia' },
  'tecnologia-accesorios-de-computador': { en: 'Computer accessories', pt: 'Acessórios de computador' },
  'tecnologia-almacenamiento': { en: 'Storage', pt: 'Armazenamento' },
  'tecnologia-componentes-y-repuestos': { en: 'Components & parts', pt: 'Componentes e peças' },

  'hogar-y-muebles': { en: 'Home & Furniture', pt: 'Casa e móveis' },
  'hogar-y-muebles-muebles': { en: 'Furniture', pt: 'Móveis' },
  'hogar-y-muebles-colchones-y-descanso': { en: 'Mattresses & sleep', pt: 'Colchões e descanso' },
  'hogar-y-muebles-cocina-y-comedor': { en: 'Kitchen & dining', pt: 'Cozinha e sala de jantar' },
  'hogar-y-muebles-bano': { en: 'Bathroom', pt: 'Banheiro' },
  'hogar-y-muebles-decoracion': { en: 'Decor', pt: 'Decoração' },
  'hogar-y-muebles-iluminacion': { en: 'Lighting', pt: 'Iluminação' },
  'hogar-y-muebles-organizacion-y-almacenamiento': { en: 'Organization & storage', pt: 'Organização e armazenamento' },
  'hogar-y-muebles-jardin-y-exteriores': { en: 'Garden & outdoor', pt: 'Jardim e área externa' },

  moda: { en: 'Fashion', pt: 'Moda' },
  'moda-ropa-de-mujer': { en: "Women's clothing", pt: 'Roupas femininas' },
  'moda-ropa-de-hombre': { en: "Men's clothing", pt: 'Roupas masculinas' },
  'moda-calzado': { en: 'Footwear', pt: 'Calçados' },
  'moda-bolsos-y-carteras': { en: 'Bags & purses', pt: 'Bolsas e carteiras' },
  'moda-relojes-y-joyeria': { en: 'Watches & jewelry', pt: 'Relógios e joias' },
  'moda-gafas': { en: 'Eyewear', pt: 'Óculos' },
  'moda-ropa-infantil': { en: "Kids' clothing", pt: 'Roupas infantis' },
  'moda-accesorios': { en: 'Accessories', pt: 'Acessórios' },

  electrodomesticos: { en: 'Appliances', pt: 'Eletrodomésticos' },
  'electrodomesticos-refrigeracion': { en: 'Refrigeration', pt: 'Refrigeração' },
  'electrodomesticos-lavado-y-secado': { en: 'Washing & drying', pt: 'Lavagem e secagem' },
  'electrodomesticos-coccion': { en: 'Cooking', pt: 'Cozimento' },
  'electrodomesticos-pequenos-electrodomesticos': { en: 'Small appliances', pt: 'Pequenos eletrodomésticos' },
  'electrodomesticos-climatizacion': { en: 'Climate control', pt: 'Climatização' },
  'electrodomesticos-aspiradoras-y-limpieza': { en: 'Vacuums & cleaning', pt: 'Aspiradores e limpeza' },

  'belleza-y-cuidado-personal': { en: 'Beauty & Personal Care', pt: 'Beleza e cuidado pessoal' },
  'belleza-y-cuidado-personal-maquillaje': { en: 'Makeup', pt: 'Maquiagem' },
  'belleza-y-cuidado-personal-cuidado-de-la-piel': { en: 'Skin care', pt: 'Cuidados com a pele' },
  'belleza-y-cuidado-personal-cuidado-del-cabello': { en: 'Hair care', pt: 'Cuidados com o cabelo' },
  'belleza-y-cuidado-personal-perfumes': { en: 'Perfumes', pt: 'Perfumes' },
  'belleza-y-cuidado-personal-afeitado-y-depilacion': { en: 'Shaving & hair removal', pt: 'Barba e depilação' },
  'belleza-y-cuidado-personal-higiene-personal': { en: 'Personal hygiene', pt: 'Higiene pessoal' },

  'deportes-y-aire-libre': { en: 'Sports & Outdoors', pt: 'Esportes e ar livre' },
  'deportes-y-aire-libre-ciclismo': { en: 'Cycling', pt: 'Ciclismo' },
  'deportes-y-aire-libre-fitness-y-musculacion': { en: 'Fitness & strength training', pt: 'Fitness e musculação' },
  'deportes-y-aire-libre-camping-y-montanismo': { en: 'Camping & hiking', pt: 'Camping e montanhismo' },
  'deportes-y-aire-libre-futbol': { en: 'Soccer', pt: 'Futebol' },
  'deportes-y-aire-libre-running': { en: 'Running', pt: 'Corrida' },
  'deportes-y-aire-libre-deportes-acuaticos': { en: 'Water sports', pt: 'Esportes aquáticos' },
  'deportes-y-aire-libre-suplementos-deportivos': { en: 'Sports supplements', pt: 'Suplementos esportivos' },

  'vehiculos-y-repuestos': { en: 'Vehicles & Parts', pt: 'Veículos e peças' },
  'vehiculos-y-repuestos-repuestos-de-carros': { en: 'Car parts', pt: 'Peças de carros' },
  'vehiculos-y-repuestos-repuestos-de-motos': { en: 'Motorcycle parts', pt: 'Peças de motos' },
  'vehiculos-y-repuestos-accesorios-y-tuning': { en: 'Accessories & tuning', pt: 'Acessórios e tuning' },
  'vehiculos-y-repuestos-llantas': { en: 'Tires', pt: 'Pneus' },
  'vehiculos-y-repuestos-audio-para-vehiculos': { en: 'Car audio', pt: 'Som automotivo' },
  'vehiculos-y-repuestos-herramientas-de-taller': { en: 'Workshop tools', pt: 'Ferramentas de oficina' },

  'herramientas-y-construccion': { en: 'Tools & Construction', pt: 'Ferramentas e construção' },
  'herramientas-y-construccion-herramientas-electricas': { en: 'Power tools', pt: 'Ferramentas elétricas' },
  'herramientas-y-construccion-herramientas-manuales': { en: 'Hand tools', pt: 'Ferramentas manuais' },
  'herramientas-y-construccion-materiales-de-construccion': { en: 'Building materials', pt: 'Materiais de construção' },
  'herramientas-y-construccion-pinturas': { en: 'Paints', pt: 'Tintas' },
  'herramientas-y-construccion-seguridad-industrial': { en: 'Industrial safety', pt: 'Segurança industrial' },
  'herramientas-y-construccion-electricidad-y-plomeria': { en: 'Electrical & plumbing', pt: 'Elétrica e encanamento' },

  'bebes-y-ninos': { en: 'Baby & Kids', pt: 'Bebês e crianças' },
  'bebes-y-ninos-coches-y-sillas': { en: 'Strollers & car seats', pt: 'Carrinhos e cadeirinhas' },
  'bebes-y-ninos-alimentacion': { en: 'Feeding', pt: 'Alimentação' },
  'bebes-y-ninos-panales-y-aseo': { en: 'Diapers & care', pt: 'Fraldas e higiene' },
  'bebes-y-ninos-juguetes': { en: 'Toys', pt: 'Brinquedos' },
  'bebes-y-ninos-ropa-de-bebe': { en: 'Baby clothing', pt: 'Roupas de bebê' },
  'bebes-y-ninos-habitacion-infantil': { en: 'Nursery', pt: 'Quarto infantil' },

  'alimentos-y-bebidas': { en: 'Food & Beverages', pt: 'Alimentos e bebidas' },
  'alimentos-y-bebidas-cafe-y-te': { en: 'Coffee & tea', pt: 'Café e chá' },
  'alimentos-y-bebidas-despensa': { en: 'Pantry', pt: 'Despensa' },
  'alimentos-y-bebidas-snacks-y-dulces': { en: 'Snacks & candy', pt: 'Salgadinhos e doces' },
  'alimentos-y-bebidas-bebidas': { en: 'Beverages', pt: 'Bebidas' },
  'alimentos-y-bebidas-productos-organicos': { en: 'Organic products', pt: 'Produtos orgânicos' },
  'alimentos-y-bebidas-reposteria': { en: 'Baking', pt: 'Confeitaria' },

  mascotas: { en: 'Pets', pt: 'Animais de estimação' },
  'mascotas-perros': { en: 'Dogs', pt: 'Cães' },
  'mascotas-gatos': { en: 'Cats', pt: 'Gatos' },
  'mascotas-aves': { en: 'Birds', pt: 'Aves' },
  'mascotas-peces-y-acuarios': { en: 'Fish & aquariums', pt: 'Peixes e aquários' },
  'mascotas-pequenas-mascotas': { en: 'Small pets', pt: 'Pequenos animais' },

  'salud-y-bienestar': { en: 'Health & Wellness', pt: 'Saúde e bem-estar' },
  'salud-y-bienestar-cuidado-de-la-salud': { en: 'Health care', pt: 'Cuidados de saúde' },
  'salud-y-bienestar-suplementos-y-vitaminas': { en: 'Supplements & vitamins', pt: 'Suplementos e vitaminas' },
  'salud-y-bienestar-equipos-medicos': { en: 'Medical equipment', pt: 'Equipamentos médicos' },
  'salud-y-bienestar-movilidad-y-ortopedia': { en: 'Mobility & orthopedics', pt: 'Mobilidade e ortopedia' },

  'arte-y-artesanias': { en: 'Arts & Crafts', pt: 'Arte e artesanato' },
  'arte-y-artesanias-artesania-colombiana': { en: 'Colombian crafts', pt: 'Artesanato colombiano' },
  'arte-y-artesanias-materiales-de-arte': { en: 'Art supplies', pt: 'Materiais de arte' },
  'arte-y-artesanias-manualidades': { en: 'Crafts', pt: 'Trabalhos manuais' },
  'arte-y-artesanias-instrumentos-musicales': { en: 'Musical instruments', pt: 'Instrumentos musicais' },
  'arte-y-artesanias-coleccionables': { en: 'Collectibles', pt: 'Colecionáveis' },

  'libros-y-papeleria': { en: 'Books & Stationery', pt: 'Livros e papelaria' },
  'libros-y-papeleria-libros': { en: 'Books', pt: 'Livros' },
  'libros-y-papeleria-utiles-escolares': { en: 'School supplies', pt: 'Material escolar' },
  'libros-y-papeleria-oficina': { en: 'Office', pt: 'Escritório' },
  'libros-y-papeleria-revistas-y-comics': { en: 'Magazines & comics', pt: 'Revistas e quadrinhos' },
}
