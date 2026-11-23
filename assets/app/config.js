// Personal settings for the TV home page. Everything here is safe to edit.
window.HOME_CONFIG = {
  // One or more names. Two names show as "Sara & Adam"; the monogram uses their first letters.
  names: ["Sara", "Adam"],

  // Weather and prayer-time location (Open-Meteo / Aladhan, no API keys needed).
  city: { name: "Amsterdam", lat: 52.37, lon: 4.90 },

  // Turn whole features on or off.
  features: {
    weather: true,
    prayer: false,   // next prayer card + Hijri date
    adhkar: false,   // morning / evening adhkar reader (run scripts/fetch_assets.py --adhkar)
    kahf: false      // Surat Al-Kahf on Fridays
  },

  // Prayer times (api.aladhan.com). method: 3 = Muslim World League, 2 = ISNA, 4 = Umm al-Qura,
  // 5 = Egypt, 12 = UOIF (France), 13 = Diyanet (Turkey), 21 = Morocco … see aladhan.com/calculation-methods
  // tune: minutes to add per prayer so the times match your local mosque.
  prayer: {
    method: 3,
    school: 0, // 0 = standard Asr, 1 = Hanafi Asr
    tune: { Fajr: 0, Dhuhr: 0, Asr: 0, Maghrib: 0, Isha: 0 }
  },

  // Friday Surat Al-Kahf: plays by itself the first time the page opens on a Friday (once per Friday).
  kahf: {
    autoplay: true,
    reciter: "Mishary Alafasy",
    url: "https://server8.mp3quran.net/afs/018.mp3"
  },

  // Optional: the day you got together, "YYYY-MM-DD". Shows a "days together" counter.
  since: null,

  // Optional: photo files placed in photos/, e.g. ["photos/beach.jpg"]. They become the card background.
  photos: [],

  // Minutes without a key press before the ambient clock takes over.
  ambientAfterMinutes: 3,

  // Lines that rotate under the greeting (any language; Arabic lines are shown right-to-left).
  messages: [
    "The couch is ready. So is the popcorn.",
    "One more episode? You both know the answer.",
    "Tonight's agenda: absolutely nothing.",
    "Phones down, feet up.",
    "Whoever picks the movie makes the tea.",
    "Home is wherever you press play.",
    "Bienvenue à la maison.",
    "أهلاً وسهلاً بكم"
  ],

  // App tiles, in order. `match` is tested against each installed app's name and id;
  // tiles for apps that aren't installed are hidden automatically.
  apps: [
    { key: "youtube", label: "YouTube",     tag: "Videos & music",       match: /youtube(?!.*kids)/i,   theme: "youtube" },
    { key: "netflix", label: "Netflix",     tag: "Series & films",       match: /netflix/i,             theme: "netflix" },
    { key: "prime",   label: "Prime Video", tag: "Films & originals",    match: /prime video|amazon/i,  theme: "prime" },
    { key: "disney",  label: "Disney+",     tag: "Marvel, Pixar & more", match: /disney/i,              theme: "disney" },
    { key: "appletv", label: "Apple TV",    tag: "Apple originals",      match: /apple ?tv/i,           theme: "apple" },
    { key: "spotify", label: "Spotify",     tag: "Music & podcasts",     match: /spotify/i,             theme: "spotify" },
    { key: "browser", label: "Internet",    tag: "Web browser",          match: /^internet$|browser/i,  theme: "browser" },
    { key: "gallery", label: "Gallery",     tag: "Photos from your phone", match: /^gallery$/i,         theme: "gallery" }
  ],

  // Optional: URL that receives diagnostic events while debugging (see scripts/logserver.py).
  debugLogUrl: null
};
