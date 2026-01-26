
// Initialize map
const map = L.map("map").setView([20, 0], 2);

// Tile layer
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors",
}).addTo(map);

// Info panel
const infoPanel = document.getElementById("info-panel");

// Fetch country data
async function fetchCountryData(lat, lng) {
  try {
    const geoRes = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
    );
    const geoData = await geoRes.json();

    if (!geoData.address || !geoData.address.country) {
      infoPanel.innerHTML = "<h2>Country Information</h2><p>No country found.</p>";
      return;
    }

    const countryName = geoData.address.country;

    const countryRes = await fetch(
      `https://restcountries.com/v3.1/name/${countryName}?fullText=true`
    );
    const countryData = (await countryRes.json())[0];

    const covidRes = await fetch(
      `https://disease.sh/v3/covid-19/countries/${countryName}`
    );
    const covidData = await covidRes.json();

    renderCountryInfo(countryData, covidData);
  } catch (error) {
    infoPanel.innerHTML = "<h2>Error</h2><p>Unable to fetch data.</p>";
  }
}

// Render info
function renderCountryInfo(country, covid) {
  infoPanel.innerHTML = `
    <h2>${country.name.common}</h2>

    <div class="info-item"><span>Capital:</span> ${country.capital?.[0] || "N/A"}</div>
    <div class="info-item"><span>Region:</span> ${country.region}</div>
    <div class="info-item"><span>Population:</span> ${country.population.toLocaleString()}</div>
    <div class="info-item"><span>Currency:</span> ${Object.values(country.currencies || {})[0]?.name || "N/A"}</div>
    <div class="info-item"><span>Language:</span> ${Object.values(country.languages || {}).join(", ")}</div>

    <hr style="margin: 1rem 0; border-color:#1e293b">

    <div class="info-item"><span>COVID Cases:</span> ${covid.cases?.toLocaleString() || "N/A"}</div>
    <div class="info-item"><span>Recovered:</span> ${covid.recovered?.toLocaleString() || "N/A"}</div>
    <div class="info-item"><span>Deaths:</span> ${covid.deaths?.toLocaleString() || "N/A"}</div>

    <hr style="margin: 1rem 0; border-color:#1e293b">

    <div class="info-item"><span>Travel Tip:</span> Respect local customs and check visa requirements.</div>
  `;
}

// Click handler
map.on("click", (e) => {
  infoPanel.innerHTML = "<h2>Loading...</h2><p>Fetching country data...</p>";
  fetchCountryData(e.latlng.lat, e.latlng.lng);
});
