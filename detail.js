// ============================================
// DETAIL PAGE — reads movie from localStorage
// fetches full details + trailer from TMDB
// ============================================

const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";
const BACKDROP_BASE_URL = "https://image.tmdb.org/t/p/original";

const isDev = import.meta.env.DEV;
const API_BASE = isDev ? "https://api.themoviedb.org/3" : "/api/tmdb";
const API_KEY = isDev ? import.meta.env.VITE_TMDB_API_KEY : "";

// ---- Read the movie object saved by main page ----
const raw = localStorage.getItem("selectedMovie");
if (!raw) window.close();

const movie   = JSON.parse(raw);
const isMovie = movie.media_type === "movie";

// Build the two endpoints we need:
// 1. Full detail (title, genres, overview, backdrop etc.)
// 2. Videos list (to find the trailer key)
const detailEndpoint = isDev
  ? (isMovie ? `${API_BASE}/movie/${movie.id}?api_key=${API_KEY}` : `${API_BASE}/tv/${movie.id}?api_key=${API_KEY}`)
  : (isMovie ? `${API_BASE}?path=movie/${movie.id}` : `${API_BASE}?path=tv/${movie.id}`);

const videosEndpoint = isDev
  ? (isMovie ? `${API_BASE}/movie/${movie.id}/videos?api_key=${API_KEY}` : `${API_BASE}/tv/${movie.id}/videos?api_key=${API_KEY}`)
  : (isMovie ? `${API_BASE}?path=movie/${movie.id}/videos` : `${API_BASE}?path=tv/${movie.id}/videos`);

// ---- Main loader ----
async function loadDetail() {

  try {

    // Fire BOTH requests at the same time instead of one after another
    // Promise.all() takes an array of fetch calls and waits until ALL
    // of them finish — like running two threads and joining both
    // In Python terms: like asyncio.gather(fetch1(), fetch2())
    const [detailRes, videosRes] = await Promise.all([
      fetch(detailEndpoint),
      fetch(videosEndpoint)
    ]);

    // Convert both responses to JS objects
    const data       = await detailRes.json();
    const videosData = await videosRes.json();

    // ---- Extract fields from detail data ----
    const title      = data.title || data.name;
    const year       = (data.release_date || data.first_air_date || "").slice(0, 4);
    const rating     = data.vote_average ? data.vote_average.toFixed(1) : "N/A";
    const overview   = data.overview || "No description available.";
    const posterUrl  = data.poster_path  ? IMAGE_BASE_URL    + data.poster_path  : "";
    const backdropUrl= data.backdrop_path? BACKDROP_BASE_URL + data.backdrop_path: "";
    const genres     = (data.genres || []).map(g => g.name);

    // ---- Find the trailer from videos list ----
    // videosData.results is an array of video objects
    // We want the first one that is a YouTube Trailer
    // .find() works like a for loop that stops at the first match
    // In Python: next((v for v in videos if ...), None)
    const trailer = videosData.results.find(
      v => v.site === "YouTube" && v.type === "Trailer"
    );

    // If no trailer found, fall back to first Teaser, or null
    const videoKey = trailer
      ? trailer.key
      : (videosData.results.find(v => v.site === "YouTube") || {}).key || null;

    // ---- Inject into page ----

    document.title = title;

    // Backdrop
    const backdropEl = document.getElementById("detail-backdrop");
    if (backdropUrl) backdropEl.style.backgroundImage = `url('${backdropUrl}')`;

    // Poster
    const posterEl = document.getElementById("detail-poster");
    posterEl.src = posterUrl;
    posterEl.alt = title;

    // Title
    document.getElementById("detail-title").textContent = title;

    // Meta
    const typeLabel = isMovie ? "Movie" : "Series";
    const typeClass = isMovie ? "type-movie" : "type-series";
    document.getElementById("detail-meta").innerHTML = `
      <span class="meta-badge ${typeClass}">${typeLabel}</span>
      ${year ? `<span class="meta-badge">${year}</span>` : ""}
      <span class="meta-rating-large">⭐ ${rating}</span>
    `;

    // Genres
    const genreHTML = genres.map(g => `<span class="genre-tag">${g}</span>`).join("");
    document.getElementById("detail-genres").innerHTML = genreHTML;

    // Overview
    document.getElementById("detail-overview").textContent = overview;

    // ---- Trailer box ----
    const trailerBox = document.getElementById("detail-trailer-box");

    if (videoKey) {
      // Replace the placeholder with a real YouTube iframe
      // allow="autoplay" lets it play automatically
      // allowfullscreen lets the user go fullscreen
      trailerBox.innerHTML = `
        <iframe
          width="100%"
          height="100%"
          src="https://www.youtube.com/embed/${videoKey}?autoplay=0&rel=0&modestbranding=1"
          title="${title} Trailer"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen>
        </iframe>
      `;
    } else {
      // No trailer found on TMDB for this title
      trailerBox.innerHTML = `<p class="trailer-placeholder">No trailer available</p>`;
    }

  } catch (error) {
    console.error("Failed to load detail:", error);
  }

}

loadDetail();