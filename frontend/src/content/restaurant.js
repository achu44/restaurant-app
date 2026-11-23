// Contact details and hours — SRS FR-2.
export const restaurant = {
  name: 'Café Fausse',
  tagline: 'Italian tradition, modern craft.',
  founded: 2010,
  address: {
    street: '1234 Culinary Ave, Suite 100',
    city: 'Washington, DC 20002',
  },
  phone: '(202) 555-4567',
  phoneHref: 'tel:+12025554567',
  timeZone: 'America/New_York',
}

// day: 0 = Sunday … 6 = Saturday (JavaScript Date#getDay convention)
export const hours = [
  { label: 'Monday – Saturday', days: [1, 2, 3, 4, 5, 6], open: '17:00', close: '23:00', display: '5:00 PM – 11:00 PM' },
  { label: 'Sunday', days: [0], open: '17:00', close: '21:00', display: '5:00 PM – 9:00 PM' },
]
