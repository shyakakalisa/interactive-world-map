// Initialize map
const map = L.map("map").setView([20, 0], 2);

// Add tile layer
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors",
}).addTo(map);

// Info panel
const infoPanel = document.getElementById("info-panel");

// Helper: update info panel
function setInfoPanel(title, message) {
  infoPanel.innerHTML = `
    <h2>${title}</h2>
    <p>${message}</p>
  `;
}

// Helper: fetch JSON safely
async function fetchJSON(url, errorMessage) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(errorMessage);
  }

  return response.json();
}

// Fetch country data
async function fetchCountryData(lat, lng) {
  try {
    setInfoPanel("Loading...", "Fetching country data...");

    // 1. Reverse geocode to get country
    const geoData = await fetchJSON(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      "Could not get location data."
    );

    if (!geoData.address || !geoData.address.country) {
      setInfoPanel("Country Information", "No country found for this location.");
      return;
    }

    const countryName = geoData.address.country;
    const encodedCountryName = encodeURIComponent(countryName);

    // 2. Get country details
    const countryResults = await fetchJSON(
      `https://restcountries.com/v3.1/name/${encodedCountryName}`,
      "Could not get country details."
    );

    if (!Array.isArray(countryResults) || countryResults.length === 0) {
      setInfoPanel("Country Information", "Country details were not found.");
      return;
    }

    const countryData = countryResults[0];

    // 3. Try to get COVID data, but do not fail the whole app if this breaks
    let covidData = null;

    try {
      covidData = await fetchJSON(
        `https://disease.sh/v3/covid-19/countries/${encodedCountryName}?strict=true`,
        "Could not get COVID data."
      );
    } catch (covidError) {
      console.warn("COVID data unavailable:", covidError.message);
    }

    renderCountryInfo(countryData, covidData);
  } catch (error) {
    console.error("Error fetching data:", error);
    setInfoPanel("Error", error.message || "Unable to fetch data.");
  }
}

// Render country info
function renderCountryInfo(country, covid) {
  const capital = country.capital?.[0] || "N/A";
  const region = country.region || "N/A";
  const population = country.population
    ? country.population.toLocaleString()
    : "N/A";

  const currency =
    country.currencies && Object.values(country.currencies).length > 0
      ? Object.values(country.currencies)[0].name
      : "N/A";

  const languages =
    country.languages && Object.values(country.languages).length > 0
      ? Object.values(country.languages).join(", ")
      : "N/A";

  const covidCases = covid?.cases ? covid.cases.toLocaleString() : "N/A";
  const covidRecovered = covid?.recovered
    ? covid.recovered.toLocaleString()
    : "N/A";
  const covidDeaths = covid?.deaths ? covid.deaths.toLocaleString() : "N/A";

  infoPanel.innerHTML = `
    <h2>${country.name?.common || "Unknown Country"}</h2>

    <div class="info-item"><span>Capital:</span> ${capital}</div>
    <div class="info-item"><span>Region:</span> ${region}</div>
    <div class="info-item"><span>Population:</span> ${population}</div>
    <div class="info-item"><span>Currency:</span> ${currency}</div>
    <div class="info-item"><span>Language:</span> ${languages}</div>

    <hr style="margin: 1rem 0; border-color: #1e293b;">

    <div class="info-item"><span>COVID Cases:</span> ${covidCases}</div>
    <div class="info-item"><span>Recovered:</span> ${covidRecovered}</div>
    <div class="info-item"><span>Deaths:</span> ${covidDeaths}</div>

    <hr style="margin: 1rem 0; border-color: #1e293b;">

    <div class="info-item"><span>Travel Tip:</span> Respect local customs and check visa requirements.</div>
  `;
}

// Handle map clicks
map.on("click", (e) => {
  fetchCountryData(e.latlng.lat, e.latlng.lng);
});
