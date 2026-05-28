/**
 * MainGo — zero authentication: no sign-in, no tokens, no APIs. Opens one https search URL on the
 * service you picked. Each tap picks a random phrasing for that vibe so results stay high-variance.
 *
 * Affiliate: implement wrapBurstUrl() when you have outbound redirect / campaign links.
 */

/**
 * Per-genre search phrase pools — each burst picks one at random so rankings/tracks differ a lot
 * from one click to the next (same vibe, different SERP).
 * @type {Record<string, string[]>}
 */
const GENRE_QUERY_VARIANTS = {
  chill: [
    "chill music",
    "chillout playlist",
    "relaxing chill beats",
    "downtempo chill",
    "chill sunday vibes",
    "chillhop instrumental",
    "ambient chill mix",
    "soft chill songs",
  ],
  lofi: [
    "lo-fi music",
    "lofi beats to study",
    "chill lofi hip hop",
    "lofi jazz mix",
    "relaxing lofi playlist",
    "lofi sleep beats",
    "rainy day lofi",
    "coffee shop lofi",
  ],
  rock: [
    "rock music",
    "classic rock hits",
    "alternative rock playlist",
    "indie rock discovery",
    "garage rock energy",
    "modern rock anthems",
    "rock deep cuts",
    "stadium rock live",
  ],
  metal: [
    "heavy metal music",
    "thrash metal classics",
    "metalcore breakdowns",
    "doom metal slow burn",
    "black metal atmosphere",
    "progressive metal epics",
    "power metal anthems",
    "groove metal riffs",
  ],
  reggae: [
    "reggae music",
    "roots reggae dub",
    "dancehall reggae mix",
    "ska reggae upbeat",
    "reggae chill playlist",
    "jamaican reggae classics",
    "modern reggae fusion",
    "reggae one drop",
  ],
  hiphop: [
    "hip hop music",
    "rap hits mix",
    "boom bap hip hop",
    "trap beats rap",
    "underground hip hop",
    "old school hip hop",
    "melodic rap vibes",
    "west coast hip hop",
  ],
  electronic: [
    "electronic music",
    "house music mix",
    "techno warehouse vibes",
    "edm festival anthems",
    "synthwave retro electronic",
    "drum and bass energy",
    "deep house late night",
    "electronic chillout",
  ],
  classical: [
    "classical music",
    "baroque classical playlist",
    "romantic piano classical",
    "orchestral symphonies",
    "classical cello solos",
    "minimalist classical modern",
    "opera highlights classical",
    "film score classical epic",
  ],
  jazz: [
    "jazz music",
    "smooth jazz evening",
    "bebop jazz classics",
    "cool jazz west coast",
    "latin jazz rhythm",
    "jazz fusion funk",
    "solo piano jazz",
    "swing jazz big band",
  ],
  latino: [
    "latin music",
    "latin pop hits",
    "salsa music mix",
    "bachata romantic latin",
    "cumbia party latin",
    "latin urban reggaeton pop",
    "regional mexican corridos",
    "latin tropical summer",
  ],
  reggaeton: [
    "reggaeton music",
    "reggaeton party mix",
    "latin trap reggaeton",
    "dembow reggaeton beat",
    "reggaeton romantico",
    "old school reggaeton classics",
    "reggaeton perreo",
    "urbano reggaeton hits",
  ],
};

const GENRE_KEYS = Object.keys(GENRE_QUERY_VARIANTS);

/** Service id -> function (query string) => full https URL on that provider’s site. */
const SERVICE_BUILDERS = {
  spotify: (q) =>
    `https://open.spotify.com/search/${encodeURIComponent(q)}`,
  pandora: (q) =>
    `https://www.pandora.com/search/all?q=${encodeURIComponent(q)}`,
  youtube: (q) =>
    `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`,
  youtube_music: (q) =>
    `https://music.youtube.com/search?q=${encodeURIComponent(q)}`,
  apple: (q) =>
    `https://music.apple.com/us/search?term=${encodeURIComponent(q)}`,
};

const SERVICE_IDS = Object.keys(SERVICE_BUILDERS);

function pickRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function resolveGenre(genreValue) {
  if (genreValue === "random") return pickRandomItem(GENRE_KEYS);
  return genreValue;
}

function resolveService(serviceValue) {
  if (serviceValue === "random") return pickRandomItem(SERVICE_IDS);
  return serviceValue;
}

function pickQueryForGenreKey(genreKey) {
  const pool = GENRE_QUERY_VARIANTS[genreKey];
  if (!pool || !pool.length) return null;
  return pickRandomItem(pool);
}

function getActiveValue(containerId) {
  const active = document.querySelector(`#${containerId} .chip[aria-pressed="true"]`);
  return active ? active.getAttribute("data-value") : "random";
}

function buildBurstUrl() {
  const serviceRaw = getActiveValue("serviceChips");
  const genreRaw = getActiveValue("genreChips");
  const serviceId = resolveService(serviceRaw);
  const genreKey = resolveGenre(genreRaw);
  const query = pickQueryForGenreKey(genreKey);
  const builder = SERVICE_BUILDERS[serviceId];
  if (!query || !builder) return null;
  return builder(query);
}

/**
 * Future affiliate / partner outbound: wrap the final burst URL before opening.
 * @param {string} burstUrl
 * @returns {string}
 */
function wrapBurstUrl(burstUrl) {
  return burstUrl;
}

function onPlayBurst() {
  const raw = buildBurstUrl();
  if (!raw) return;
  const url = wrapBurstUrl(raw);

  chrome.runtime.sendMessage({ type: "OPEN_BURST", url }, (response) => {
    if (chrome.runtime.lastError || !response?.ok) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  });
}

function wireChipGroup(containerId) {
  const wrap = document.getElementById(containerId);
  if (!wrap) return;

  wrap.addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip || !wrap.contains(chip)) return;

    wrap.querySelectorAll(".chip").forEach((c) => {
      c.setAttribute("aria-pressed", c === chip ? "true" : "false");
    });

    chip.classList.remove("chip-pop");
    void chip.offsetWidth;
    chip.classList.add("chip-pop");
  });
}

document.getElementById("playBurst").addEventListener("click", onPlayBurst);
wireChipGroup("serviceChips");
wireChipGroup("genreChips");
