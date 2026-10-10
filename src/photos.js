// Every image used in the app, with the alt text it ships with.
//
// These are generated placeholders, labelled as such on the image itself.
// Replace the files in public/photos/ with your own and update the alt text
// here — it lives next to the source so the two cannot drift apart.
//
// Write alt text by looking at the file, not by reading the filename.

const P = 'photos/'

export const PHOTOS = {
  skyline:    { src: P + 'city-skyline.jpg', alt: 'Placeholder image: city skyline' },
  broadway:   { src: P + 'city-night.jpg', alt: 'Placeholder image: downtown at night' },
  houseRoof:  { src: P + 'house-1.jpg', alt: 'Placeholder image: rooftop deck' },
  houseLiving:{ src: P + 'house-2.jpg', alt: 'Placeholder image: living room' },
  houseKitchen:{src: P + 'house-3.jpg', alt: 'Placeholder image: kitchen' },
  houseSofa:  { src: P + 'house-4.jpg', alt: 'Placeholder image: lounge' },

  // Saturday-morning fork — the mascot works both shifts (placeholder art).
  // ?v=2 busts phone HTTP caches: these filenames served different art earlier,
  // and images at unchanged URLs cache hard. Bump the number if the art changes again.
  houseDeck:  { src: P + 'house-5.jpg', alt: 'Placeholder image: terrace' },
  houseBalc:  { src: P + 'house-6.jpg', alt: 'Placeholder image: balcony' },

  golfHole:   { src: P + 'outdoors-1.jpg', alt: 'Placeholder image: open country' },
  golfRiver:  { src: P + 'outdoors-2.jpg', alt: 'Placeholder image: river valley' },

  venueRoom:  { src: P + 'venue-2.jpg', alt: 'Placeholder image: the main room' },
  venueStage: { src: P + 'venue-3.jpg', alt: 'Placeholder image: on stage' },
}

// The house gallery, in the order they read best: lead with the rooftop.
export const HOUSE_GALLERY = [
  PHOTOS.houseRoof,
  PHOTOS.houseLiving,
  PHOTOS.houseKitchen,
  PHOTOS.houseSofa,
  PHOTOS.houseDeck,
  PHOTOS.houseBalc
]
