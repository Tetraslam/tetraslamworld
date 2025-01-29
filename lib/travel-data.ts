export interface Location {
  id: string;
  name: string;
  coordinates: [number, number];
  description: string;
  activities: string[];
  peopleMet: string[];
  visitDate: string;
}

export interface TravelPath {
  from: string;
  to: string;
  type: 'flight' | 'train' | 'road';
}

export const locations: Location[] = [
  {
    id: "sydney",
    name: "Sydney, Australia",
    coordinates: [-33.8688, 151.2093],
    description: "Kind bus man who returned my bag when I left it on the bus as a kid; whale watching, cool museums.",
    activities: ["Whale watching", "Museum visits"],
    peopleMet: ["Kind bus driver"],
    visitDate: "Unknown"
  },
  {
    id: "melbourne",
    name: "Melbourne, Australia",
    coordinates: [-37.8136, 144.9631],
    description: "Radisson Blu is awesome.",
    activities: ["Hotel stay"],
    peopleMet: [],
    visitDate: "Unknown"
  },
  {
    id: "brussels",
    name: "Brussels, Belgium",
    coordinates: [50.8503, 4.3517],
    description: "Chocolate fountain at this one chocolate fair thing.",
    activities: ["Chocolate fair"],
    peopleMet: [],
    visitDate: "Unknown"
  },
  {
    id: "split",
    name: "Split, Croatia",
    coordinates: [43.5081, 16.4402],
    description: "Diocletian's Palace, squid ink risotto, nectarines, World Cup qualifiers were going on, tour guide who went 200 km/h on an empty road, yachting.",
    activities: ["Yachting", "Historical sites", "Food"],
    peopleMet: ["Tour guide who drove at 200 km/h"],
    visitDate: "Unknown"
  },
  {
    id: "vienna",
    name: "Vienna, Austria",
    coordinates: [48.2082, 16.3738],
    description: "Art museums.",
    activities: ["Museum visits"],
    peopleMet: [],
    visitDate: "Unknown"
  },
  {
    id: "paris",
    name: "Paris, France",
    coordinates: [48.8566, 2.3522],
    description: "Lived there, so anything except basic tourist stuff.",
    activities: ["Everything"],
    peopleMet: [],
    visitDate: "Lived there"
  },
  {
    id: "bordeaux",
    name: "Bordeaux, France",
    coordinates: [44.8378, -0.5792],
    description: "Went for RoboCup 2023 as the captain of the Indian team, saw Bassin des Lumières, naval museum, Michelin restaurant, walked around the historical district.",
    activities: ["RoboCup", "Museum visits", "Historical district walk"],
    peopleMet: [],
    visitDate: "2023"
  },
  {
    id: "mont_saint_michel",
    name: "Mont Saint-Michel, France",
    coordinates: [48.6361, -1.5115],
    description: "Did what everyone does.",
    activities: ["Tourism"],
    peopleMet: [],
    visitDate: "Unknown"
  },
  {
    id: "leger",
    name: "Les Gets, France",
    coordinates: [46.1585, 6.6702],
    description: "Skiing, briefly decided I wanted to be a tour guide when I grew up, skied down the black trail on my last day.",
    activities: ["Skiing"],
    peopleMet: [],
    visitDate: "Unknown"
  },
  {
    id: "nice",
    name: "Nice, France",
    coordinates: [43.7102, 7.2620],
    description: "Beach! And seafood!",
    activities: ["Beach", "Food"],
    peopleMet: [],
    visitDate: "Unknown"
  },
  {
    id: "munich",
    name: "Munich, Germany",
    coordinates: [48.1351, 11.5820],
    description: "Best bakeries ever.",
    activities: ["Food"],
    peopleMet: [],
    visitDate: "Unknown"
  },
  {
    id: "berlin",
    name: "Berlin, Germany",
    coordinates: [52.5200, 13.4050],
    description: "Historical stuff.",
    activities: ["Historical exploration"],
    peopleMet: [],
    visitDate: "Unknown"
  },
  {
    id: "frankfurt",
    name: "Frankfurt, Germany",
    coordinates: [50.1109, 8.6821],
    description: "Just the airport, but like at least 15 times.",
    activities: ["Transit"],
    peopleMet: [],
    visitDate: "Unknown"
  },
  {
    id: "athens",
    name: "Athens, Greece",
    coordinates: [37.9838, 23.7275],
    description: "Great gyros and awesome historical stuff + dinner in the sky at the Parthenon but apart from that it gets boring in 3 days.",
    activities: ["Historical sites", "Food"],
    peopleMet: [],
    visitDate: "Unknown"
  },
  {
    id: "santorini",
    name: "Santorini, Greece",
    coordinates: [36.3932, 25.4615],
    description: "Could never get bored of it, went yachting, swimming in the ocean, shopping a lot, amazing food.",
    activities: ["Yachting", "Swimming", "Shopping", "Food"],
    peopleMet: [],
    visitDate: "Unknown"
  },
  {
    id: "bangalore",
    name: "Bangalore, India",
    coordinates: [12.9716, 77.5946],
    description: "Lived here most my life.",
    activities: ["Everything"],
    peopleMet: [],
    visitDate: "Lived there"
  },
  {
    id: "chennai",
    name: "Chennai, India",
    coordinates: [13.0827, 80.2707],
    description: "Grandparents live here, hate the heat but otherwise it's a nice city.",
    activities: ["Visiting family"],
    peopleMet: ["Grandparents"],
    visitDate: "Unknown"
  },
  {
    id: "mumbai",
    name: "Mumbai, India",
    coordinates: [19.0760, 72.8777],
    description: "Hate the city, came for a U2 concert.",
    activities: ["Concert"],
    peopleMet: [],
    visitDate: "Unknown"
  },
  {
    id: "coorg",
    name: "Coorg, India",
    coordinates: [12.3375, 75.8069],
    description: "Go for holidays often, went to Orange County and Taj Madikeri.",
    activities: ["Resort stays", "Relaxing"],
    peopleMet: [],
    visitDate: "Unknown"
  },
  {
    id: "gurgaon",
    name: "Gurgaon, India",
    coordinates: [28.4595, 77.0266],
    description: "Cousin/uncle live there, didn’t really spend time.",
    activities: ["Visiting family"],
    peopleMet: ["Cousin", "Uncle"],
    visitDate: "Unknown"
  },
  {
    id: "manali",
    name: "Manali, India",
    coordinates: [32.2396, 77.1887],
    description: "Stayed at Club Mahindra, great property, went with family friends together and went hiking.",
    activities: ["Hiking", "Resort stay"],
    peopleMet: ["Family friends"],
    visitDate: "Unknown"
  },
  {
    id: "leh",
    name: "Leh, India",
    coordinates: [34.1526, 77.5770],
    description: "Glamping, saw monasteries and ate some cool food.",
    activities: ["Glamping", "Monastery visits", "Food"],
    peopleMet: [],
    visitDate: "Unknown"
  },
  {
    id: "goa",
    name: "Goa, India",
    coordinates: [15.2993, 74.1240],
    description: "Go there every year for a holiday around Christmas, great for food, beaches, and just chilling out.",
    activities: ["Beach", "Food", "Relaxing"],
    peopleMet: [],
    visitDate: "Annually"
  },
  {
    id: "sicily",
    name: "Sicily, Italy",
    coordinates: [37.5999, 14.0154],
    description: "Amazing food and views.",
    activities: ["Food", "Sightseeing"],
    peopleMet: [],
    visitDate: "Unknown"
  },
  {
    id: "rome",
    name: "Rome, Italy",
    coordinates: [41.9028, 12.4964],
    description: "Horrible food but great historical landmarks.",
    activities: ["Historical exploration"],
    peopleMet: [],
    visitDate: "Unknown"
  },
  {
    id: "florence",
    name: "Florence, Italy",
    coordinates: [43.7696, 11.2558],
    description: "Amazing food and great historical landmarks.",
    activities: ["Food", "Historical exploration"],
    peopleMet: [],
    visitDate: "Unknown"
  },
  {
    id: "luxembourg",
    name: "Luxembourg",
    coordinates: [49.6117, 6.1319],
    description: "Don’t remember but I have been.",
    activities: [],
    peopleMet: [],
    visitDate: "Unknown"
  },
  {
    id: "penang",
    name: "Penang, Malaysia",
    coordinates: [5.4164, 100.3327],
    description: "Went to visit family friends, played Mario Party on the Wii with Nikita. Wildfires in Indonesia prevented much outdoor activity.",
    activities: ["Gaming", "Walking around the city"],
    peopleMet: ["Nikita"],
    visitDate: "Unknown"
  },
  {
    id: "maldives",
    name: "Maldives",
    coordinates: [3.2028, 73.2207],
    description: "Got my diving license, saw tons of eagle rays, sharks, fish, and eels.",
    activities: ["Scuba diving"],
    peopleMet: [],
    visitDate: "Unknown"
  },
  {
    id: "amsterdam",
    name: "Amsterdam, Netherlands",
    coordinates: [52.3676, 4.9041],
    description: "Mostly cycling, tulips, etc.",
    activities: ["Cycling", "Sightseeing"],
    peopleMet: [],
    visitDate: "Unknown"
  },
  {
    id: "oslo",
    name: "Oslo, Norway",
    coordinates: [59.9139, 10.7522],
    description: "Didn’t spend much time apart from the Viking Museum.",
    activities: ["Museum visit"],
    peopleMet: [],
    visitDate: "Unknown"
  },
  {
    id: "bergen",
    name: "Bergen, Norway",
    coordinates: [60.3913, 5.3221],
    description: "Amazing raspberry puree and fjords.",
    activities: ["Sightseeing", "Food"],
    peopleMet: [],
    visitDate: "Unknown"
  },
  {
    id: "tahiti",
    name: "Tahiti, French Polynesia",
    coordinates: [-17.6509, -149.4260],
    description: "Was a baby, I have been informed that I had much fun in the sand.",
    activities: ["Beach"],
    peopleMet: [],
    visitDate: "Unknown"
  },
  {
    id: "singapore",
    name: "Singapore",
    coordinates: [1.3521, 103.8198],
    description: "Visited multiple times. Incredible food and boba, great shopping, awesome vertical gardens.",
    activities: ["Food", "Shopping", "Gardens"],
    peopleMet: [],
    visitDate: "Multiple visits"
  },
  {
    id: "barcelona",
    name: "Barcelona, Spain",
    coordinates: [41.3874, 2.1686],
    description: "Bowls and bowls of cherries, Tibidabo park where I got a plushie of the little red plane I still have, visited Camp Nou.",
    activities: ["Theme park", "Football stadium visit", "Food"],
    peopleMet: [],
    visitDate: "Unknown"
  },
  {
    id: "stockholm",
    name: "Stockholm, Sweden",
    coordinates: [59.3293, 18.0686],
    description: "Visited on a dual-trip with Norway, mostly museums.",
    activities: ["Museum visits"],
    peopleMet: [],
    visitDate: "Unknown"
  },
  {
    id: "bangkok",
    name: "Bangkok, Thailand",
    coordinates: [13.7563, 100.5018],
    description: "Hot. Very hot. Fun, but very hot.",
    activities: ["Exploration"],
    peopleMet: [],
    visitDate: "Unknown"
  },
  {
    id: "ao_nang",
    name: "Ao Nang, Thailand",
    coordinates: [8.0310, 98.8220],
    description: "Went for IB diploma trip, made a great friend named Fa, swam, boba, night market, fire poi show on the beach, volunteer service at a school.",
    activities: ["Swimming", "Night market", "Volunteer service"],
    peopleMet: ["Fa"],
    visitDate: "Unknown"
  },
  {
    id: "dubai",
    name: "Dubai, UAE",
    coordinates: [25.2760, 55.2962],
    description: "Boring.",
    activities: [],
    peopleMet: [],
    visitDate: "Unknown"
  },
  {
    id: "new_york",
    name: "New York, USA",
    coordinates: [40.7128, -74.0060],
    description: "The service workers were all mean for no reason, but the food was way too good so whatever.",
    activities: ["Food"],
    peopleMet: [],
    visitDate: "Unknown"
  },
  {
    id: "boston",
    name: "Boston, USA",
    coordinates: [42.3601, -71.0589],
    description: "I am here now! Great city, having tons of fun.",
    activities: ["Exploring"],
    peopleMet: [],
    visitDate: "Currently living there"
  },
  {
    id: "london",
    name: "London, UK",
    coordinates: [51.5074, -0.1278],
    description: "I do not like. Paris is better.",
    activities: [],
    peopleMet: [],
    visitDate: "Unknown"
  },
  {
    id: "da_nang",
    name: "Da Nang, Vietnam",
    coordinates: [16.0544, 108.2022],
    description: "So much fun, very neon and neo-capitalist but that’s fine, I’m a dumb tourist.",
    activities: ["Sightseeing"],
    peopleMet: [],
    visitDate: "Unknown"
  },
  {
    id: "ho_chi_minh",
    name: "Ho Chi Minh City, Vietnam",
    coordinates: [10.7769, 106.7009],
    description: "Historical sites. A lot of them. And the prison museum was awesome.",
    activities: ["Historical sites"],
    peopleMet: [],
    visitDate: "Unknown"
  }
];

export const paths: TravelPath[] = [
  { from: "bangkok", to: "ao_nang", type: "flight" },
  { from: "split", to: "santorini", type: "flight" },
  { from: "stockholm", to: "oslo", type: "flight" },
  { from: "oslo", to: "bergen", type: "road" },
  { from: "new_york", to: "boston", type: "flight" },
  { from: "paris", to: "brussels", type: "train" },
  { from: "paris", to: "nice", type: "train" },
  { from: "paris", to: "munich", type: "train" },
  { from: "paris", to: "berlin", type: "train" },
  { from: "paris", to: "athens", type: "flight" },
  { from: "paris", to: "luxembourg", type: "train" },
  { from: "ho_chi_minh", to: "da_nang", type: "flight" },
  
];

// Helper function to get coordinates for a path
export function getPathCoordinates(path: TravelPath): [[number, number], [number, number]] {
  const fromLocation = locations.find(l => l.id === path.from);
  const toLocation = locations.find(l => l.id === path.to);
  
  if (!fromLocation || !toLocation) {
    throw new Error(`Invalid path: ${path.from} -> ${path.to}`);
  }
  
  return [fromLocation.coordinates, toLocation.coordinates];
} 