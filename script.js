// ============================================
// SECTION 1 — NAVBAR SCROLL EFFECT
// ============================================

const navbar = document.querySelector(".navbar");

window.addEventListener("scroll", () => {
  if (window.scrollY > 50) {
    navbar.classList.add("scrolled");
  } else {
    navbar.classList.remove("scrolled");
  }
});


// ============================================
// SECTION 2 — HERO DESCRIPTION HOVER
// ============================================

const hero = document.querySelector(".hero");
const descriptionWrapper = document.querySelector(".hero-description-wrapper");

let hideTimer = null;

hero.addEventListener("mouseenter", () => {
  clearTimeout(hideTimer);
  descriptionWrapper.classList.add("visible");
});

hero.addEventListener("mouseleave", () => {
  hideTimer = setTimeout(() => {
    descriptionWrapper.classList.remove("visible");
  }, 3000);
});


// ============================================
// SECTION 3 — HERO CYCLING
// ============================================

const heroShows = [
  {
    title: "Stranger Things",
    logo: "/stranger_things.png",
    background: "https://wallpapercave.com/uwp/uwp4980006.jpeg",
    video: "/st-trailer.f399.mp4",
    description: "When a boy vanishes, a small town uncovers a mystery involving secret experiments, terrifying supernatural forces and one very strange little girl."
  },
  {
    title: "Breaking Bad",
    logo: "/breaking_bad.png",
    background: "https://wallpapercave.com/wp/wp16192631.webp",
    video: "/bb-trailer.f399.mp4",
    description: "A chemistry teacher diagnosed with cancer teams with a former student to secure his family's future by manufacturing drugs."
  },
  {
    title: "Money Heist",
    logo: "/money_heist.png",
    background: "https://wallpapercave.com/wp/wp6581266.jpg",
    video: "/mh-trailer.f399.mp4",
    description: "A criminal mastermind who goes by The Professor plans the perfect heist — robbing the Royal Mint of Spain with eight thieves."
  },
  {
    title: "Squid Game",
    logo: "/squid_game.png",
    background: "https://wallpapercave.com/uwp/uwp4640399.jpeg",
    video: "/sg-trailer.f399.mp4",
    description: "Hundreds of cash-strapped players accept a strange invitation to compete in children's games. Inside, a tempting prize awaits — with deadly high stakes."
  }
];

let currentShowIndex = 0;

const heroSection = document.querySelector(".hero");
const heroLogoImg = document.querySelector(".hero-logo-img");
const heroDescription = document.querySelector(".hero-description");
const dots = document.querySelectorAll(".dot");
const arrowLeft = document.querySelector(".hero-arrow-left");
const arrowRight = document.querySelector(".hero-arrow-right");
const heroVideo       = document.querySelector(".hero-video");
// ---- THIS IS THE FIX FOR BUG 1 ----
// Instead of setInterval (which can't be reset),
// we store the auto-cycle timer in a variable
// so we can cancel and restart it any time we want
let autoCycleTimer = null;

function startAutoCycle() {
  // Cancel any existing timer first
  // This is the key — every time this runs, the 8 seconds resets
  clearTimeout(autoCycleTimer);

  // Start a fresh 8-second countdown
  autoCycleTimer = setTimeout(() => {
    let newIndex = (currentShowIndex + 1) % heroShows.length;
    goToShow(newIndex); // goToShow calls startAutoCycle again at the end
  }, 14000);
}

// ---- Core function that switches to a show ----
function goToShow(index) {

  currentShowIndex = index;
  const show = heroShows[index];

  // ---- Update background image (fallback for when video hasn't loaded yet) ----
  heroSection.style.backgroundImage = `url('${show.background}')`;

  // ---- Update logo ----
  heroLogoImg.src = show.logo;

  // ---- Update description text ----
  heroDescription.textContent = show.description;

  // ---- Update dots ----
  dots.forEach((dot, i) => {
    dot.classList.remove("active");
    if (i === index) dot.classList.add("active");
  });

  // ---- Switch the video ----
  // Step 1: fade the video out so the switch isn't jarring
  heroVideo.style.opacity = "0";

  // Step 2: after the fade completes (400ms), swap the source and play
  setTimeout(() => {

    // Pause current video before switching
    heroVideo.pause();

    // Change the video source to the new show's file
    heroVideo.src = show.video;

    // Load the new source (required after changing src)
    heroVideo.load();

    // Play it — .play() returns a Promise, so we use .catch()
    // to silently ignore errors (e.g. browser blocked autoplay)
    heroVideo.play().catch(() => {});

    // Fade the video back in
    heroVideo.style.opacity = "1";

  }, 400);

  // ---- Restart auto-cycle timer ----
  startAutoCycle();

}

// ---- Arrow buttons ----
arrowLeft.addEventListener("click", () => {
  let newIndex = (currentShowIndex - 1 + heroShows.length) % heroShows.length;
  goToShow(newIndex); // timer resets inside goToShow
});

arrowRight.addEventListener("click", () => {
  let newIndex = (currentShowIndex + 1) % heroShows.length;
  goToShow(newIndex); // timer resets inside goToShow
});

// ---- Dot clicks ----
dots.forEach((dot, i) => {
  dot.addEventListener("click", () => {
    goToShow(i); // timer resets inside goToShow
  });
});

// ---- Load first show on page open ----
goToShow(0);
// Once the first video has loaded enough data to play smoothly,
// fade it in. "canplay" event fires when the browser says
// "I have enough buffered to start playing without stopping"
heroVideo.addEventListener("canplay", () => {
  heroVideo.style.opacity = "1";
});

// ============================================
// SECTION 4 — TMDB API INTEGRATION
// ============================================

const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

const isDev = import.meta.env.DEV;
const API_BASE = isDev ? "https://api.themoviedb.org/3" : "/api/tmdb";
const API_KEY = isDev ? import.meta.env.VITE_TMDB_API_KEY : "";

// ---- Build one movie card element ----
// This function takes one movie object from TMDB
// and returns a complete card div element
function buildMovieCard(movie) {

  // Some movies have no poster — skip those
  if (!movie.poster_path) return null;

  // Create the card div
  const card = document.createElement("div");
  card.classList.add("card");

  // Get the star rating rounded to 1 decimal place
  // toFixed(1) is like printf("%.1f") in C
  const rating = movie.vote_average.toFixed(1);

  // Get the title — movies use "title", TV shows use "name"
  const title = movie.title || movie.name;

  // Build the full poster URL
  const posterUrl = IMAGE_BASE_URL + movie.poster_path;

  // Inject HTML into the card
  card.innerHTML = `
    <img src="${posterUrl}" alt="${title}">
    <div class="card-info">
      <p class="card-title">${title}</p>
      <p class="card-rating">⭐ ${rating}</p>
    </div>
  `;
  // When this card is clicked, save the movie object to localStorage
  // then open the detail page
  card.addEventListener("click", () => {
    // movie.media_type may be undefined for row cards (they are always movies)
    // so we set it manually if missing
    if (!movie.media_type) movie.media_type = "movie";
    localStorage.setItem("selectedMovie", JSON.stringify(movie));
    window.open("detail.html", "_blank");
  });
  return card;
}

// ---- Fetch movies and fill a row ----
// rowId   → the id of the row to fill (e.g. "trending-row")
// url     → the TMDB API endpoint to fetch from
async function fetchAndFillRow(rowId, url) {

  // Find the row element by its id
  const row = document.querySelector(`#${rowId}`);

  try {

    // Send request to TMDB and wait for response
    const response = await fetch(url);

    // Convert raw response to JavaScript object and wait
    const data = await response.json();

    // data.results is the array of movies TMDB sends back
    // Loop through each movie and build a card
    data.results.forEach(movie => {

      const card = buildMovieCard(movie);

      // Only append if card was built (movie had a poster)
      if (card) {
        row.appendChild(card);
      }

    });

  } catch (error) {
    // If the fetch fails for any reason, log it
    // catch is like a try/except in Python
    console.error("Failed to fetch movies:", error);
  }

}

// ---- Fetch all three rows ----
// These three calls happen almost simultaneously
// Each fills a different row with different data

// Trending this week
fetchAndFillRow(
  "trending-row",
  isDev ? `${API_BASE}/trending/movie/week?api_key=${API_KEY}` : `${API_BASE}?path=trending/movie/week`
);

// Top rated movies
fetchAndFillRow(
  "toprated-row",
  isDev ? `${API_BASE}/movie/top_rated?api_key=${API_KEY}` : `${API_BASE}?path=movie/top_rated`
);

// Action movies (genre id 28 = Action on TMDB)
fetchAndFillRow(
  "action-row",
  isDev ? `${API_BASE}/discover/movie?with_genres=28&sort_by=popularity.desc&api_key=${API_KEY}` : `${API_BASE}?path=discover/movie&with_genres=28&sort_by=popularity.desc`
);

// ============================================
// SECTION 5 — SEARCH FEATURE
// ============================================

const searchInput = document.getElementById("search-input");
const searchDropdown = document.getElementById("search-dropdown");
const pageContent = document.getElementById("page-content");
const searchOverlay = document.getElementById("search-overlay");

// Genre ID to name map — TMDB gives genre IDs in movie data, not names
// So we look up the name ourselves using this object (like a dict in Python)
const GENRE_MAP = {
  28: "Action", 12: "Adventure", 16: "Animation",
  35: "Comedy", 80: "Crime", 99: "Documentary",
  18: "Drama", 10751: "Family", 14: "Fantasy",
  36: "History", 27: "Horror", 10402: "Music",
  9648: "Mystery", 10749: "Romance", 878: "Sci-Fi",
  10770: "TV Movie", 53: "Thriller", 10752: "War",
  37: "Western", 10759: "Action & Adventure",
  10762: "Kids", 10763: "News", 10764: "Reality",
  10765: "Sci-Fi & Fantasy", 10766: "Soap",
  10767: "Talk", 10768: "War & Politics"
};

let searchTimer = null;

// ---- Show the blur overlay and glow ----
function openSearchUI() {
  searchOverlay.classList.add("active");
  searchInput.classList.add("active-search");
}

// ---- Hide the blur overlay and glow ----
function closeSearchUI() {
  searchOverlay.classList.remove("active");
  searchInput.classList.remove("active-search");
  searchDropdown.classList.remove("visible");
  searchDropdown.innerHTML = "";
}

// ---- Listen for typing ----
searchInput.addEventListener("input", () => {

  const query = searchInput.value.trim();

  // Empty search bar — close everything immediately
  if (query.length === 0) {
    clearTimeout(searchTimer);
    closeSearchUI();
    return;
  }

  // Open blur overlay and glow as soon as user starts typing
  openSearchUI();

  // Debounce — wait 400ms after last keystroke before fetching
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    fetchSearchResults(query);
  }, 400);

});

// ---- Fetch results from TMDB ----
// We search both movies AND TV series using the multi-search endpoint
async function fetchSearchResults(query) {

  try {

    const url = isDev
      ? `${API_BASE}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}`
      : `${API_BASE}?path=search/multi&query=${encodeURIComponent(query)}`;
    const response = await fetch(url);
    const data = await response.json();

    // By the time this fetch came back, the user may have already
    // cleared the search bar. Check if the bar is still non-empty
    // before rendering anything. If it's empty now, do nothing.
    if (searchInput.value.trim().length === 0) {
      return;
    }

    const filtered = data.results.filter(item => item.media_type === "movie" || item.media_type === "tv");
    renderSearchResults(filtered);

  } catch (error) {
    console.error("Search fetch failed:", error);
  }

}

// ---- Build and show results in dropdown ----
function renderSearchResults(results) {

  searchDropdown.innerHTML = "";

  if (!results || results.length === 0) {
    searchDropdown.innerHTML = `<p class="search-no-results">No results found</p>`;
    searchDropdown.classList.add("visible");
    return;
  }

  // Take top 10 results
  const topResults = results.slice(0, 10);

  topResults.forEach(item => {

    // movie uses "title" and "release_date", TV uses "name" and "first_air_date"
    const title = item.title || item.name;
    const year = (item.release_date || item.first_air_date || "").slice(0, 4);
    const rating = item.vote_average ? item.vote_average.toFixed(1) : "N/A";
    const isMovie = item.media_type === "movie";
    const typeLabel = isMovie ? "Movie" : "Series";
    const typeClass = isMovie ? "type-movie" : "type-series";

    // Pick up to 2 genre names from the genre_ids array using GENRE_MAP
    const genres = (item.genre_ids || [])
      .slice(0, 2)
      .map(id => GENRE_MAP[id])
      .filter(Boolean);   // remove any undefined if id not in map

    const posterUrl = item.poster_path
      ? IMAGE_BASE_URL + item.poster_path
      : "https://via.placeholder.com/52x75/222/888?text=?";

    const resultItem = document.createElement("div");
    resultItem.classList.add("search-result-item");

    // Build genre tags HTML — map each genre name to a span tag
    // join("") stitches them together into one string with no separator
    const genreTagsHTML = genres.map(g => `<span class="meta-tag">${g}</span>`).join("");

    resultItem.innerHTML = `
      <img class="search-result-poster" src="${posterUrl}" alt="${title}">
      <div class="search-result-info">
        <span class="search-result-title">${title}</span>
        <div class="search-result-meta">
          <span class="meta-tag ${typeClass}">${typeLabel}</span>
          ${year ? `<span class="meta-tag">${year}</span>` : ""}
          ${genreTagsHTML}
          <span class="meta-rating">⭐ ${rating}</span>
        </div>
      </div>
    `;

    // Clicking a result — placeholder for Phase 6
    resultItem.addEventListener("click", () => {

      // item already has media_type from the /search/multi endpoint
      // so we don't need to set it manually like we did for row cards
      localStorage.setItem("selectedMovie", JSON.stringify(item));
      closeSearchUI();
      searchInput.value = "";
      window.open("detail.html", "_blank");

    });

    searchDropdown.appendChild(resultItem);

  });

  searchDropdown.classList.add("visible");

}

// ---- Hide everything when clicking outside the search area ----
document.addEventListener("click", (event) => {
  if (!searchInput.contains(event.target) && !searchDropdown.contains(event.target)) {
    closeSearchUI();
  }
});