// Gallery images — SRS FR-12. All images come from the supplied Café Fausse image set;
// "detail" entries are crops of those same photographs.
export const galleryCategories = [
  { id: 'all', label: 'All' },
  { id: 'ambiance', label: 'Dining room' },
  { id: 'dishes', label: 'From the kitchen' },
  { id: 'events', label: 'Events and behind the scenes' },
]

export const galleryImages = [
  {
    src: '/images/home-cafe-fausse.webp', thumb: '/images/home-cafe-fausse-800.webp',
    width: 1600, height: 914, category: 'ambiance', wide: true,
    alt: 'The main dining room under an ornate gilded ceiling with crystal chandeliers and white-clothed tables',
    caption: 'The main dining room',
  },
  {
    src: '/images/gallery-ribeye-steak.webp', thumb: '/images/gallery-ribeye-steak-800.webp',
    width: 1024, height: 1024, category: 'dishes',
    alt: 'Grilled ribeye steak with roasted carrots and herbs on a stoneware plate, lit by candlelight',
    caption: 'Ribeye steak, 12 oz prime cut',
  },
  {
    src: '/images/detail-chandelier.webp', thumb: '/images/detail-chandelier.webp',
    width: 609, height: 563, category: 'ambiance', tall: true,
    alt: 'Close view of a crystal chandelier hanging from a carved gold ceiling medallion',
    caption: 'The ceiling medallion',
  },
  {
    src: '/images/gallery-cafe-interior.webp', thumb: '/images/gallery-cafe-interior-800.webp',
    width: 1600, height: 914, category: 'ambiance', wide: true,
    alt: 'The salon with wood paneling, chandeliers and round tables dressed with fresh flowers',
    caption: 'The salon',
  },
  {
    src: '/images/gallery-special-event.webp', thumb: '/images/gallery-special-event-800.webp',
    width: 1024, height: 1024, category: 'events',
    alt: 'Guests in evening wear at a candlelit banquet beneath a large crystal chandelier',
    caption: 'A private evening in the grand room',
  },
  {
    src: '/images/detail-centerpiece.webp', thumb: '/images/detail-centerpiece.webp',
    width: 512, height: 461, category: 'events',
    alt: 'Candles and an arrangement of apricot roses at the center of a banquet table',
    caption: 'Setting the banquet table',
  },
  {
    src: '/images/detail-table-setting.webp', thumb: '/images/detail-table-setting.webp',
    width: 716, height: 512, category: 'events', wide: true,
    alt: 'A round table laid with linen, silverware, glassware and a flower arrangement before service',
    caption: 'Before service: a table for six',
  },
  {
    src: '/images/detail-banquette.webp', thumb: '/images/detail-banquette.webp',
    width: 573, height: 614, category: 'ambiance',
    alt: 'A tufted leather banquette beside a mirrored wall with white flowers in a silver urn',
    caption: 'The banquette',
  },
]
