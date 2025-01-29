// API Keys and Base URL
const OPENCAGE_API_KEY = '2090aa21f85d477c9ede20dfebdf798c'; // Replace with your OpenCage API Key
const WEATHER_API_KEY = 'bd5e378503939ddaee76f12ad7a97608'; // Your OpenWeatherMap API Key
const OPENCAGE_BASE_URL = 'https://api.opencagedata.com/geocode/v1/json';
const WEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

// DOM Elements
const searchForm = document.getElementById('searchForm');
const cityInput = document.getElementById('cityInput');
const suggestionsContainer = document.getElementById('suggestions');
const loader = document.getElementById('loader');
const error = document.getElementById('error');
const weatherCard = document.getElementById('weatherCard');
const cityName = document.getElementById('cityName');
const weatherDescription = document.getElementById('weatherDescription');
const unitToggle = document.getElementById('unitToggle');
const weatherIcon = document.getElementById('weatherIcon');
const temperature = document.getElementById('temperature');
const feelsLike = document.getElementById('feelsLike');
const humidity = document.getElementById('humidity');
const windSpeed = document.getElementById('windSpeed');
const weatherBackground = document.querySelector('.weather-background');

// New condition-related DOM elements
const conditionIcon = document.getElementById('conditionIcon');
const conditionText = document.getElementById('condition');

// State
let isCelsius = true;
let currentWeatherData = null;
let selectedSuggestionIndex = -1;
let typingTimer; // Timer for debounce

// Helper Functions
const showLoader = () => {
  loader.classList.remove('hidden');
  error.classList.add('hidden');
  weatherCard.classList.add('hidden');
};

const showError = (message) => {
  loader.classList.add('hidden');
  error.classList.remove('hidden');
  error.textContent = message;
  weatherCard.classList.add('hidden');
};

const showWeather = () => {
  loader.classList.add('hidden');
  error.classList.add('hidden');
  weatherCard.classList.remove('hidden');
};

const convertTemp = (temp) => {
  return isCelsius ? temp : (temp * 9 / 5) + 32;
};

const updateBackgroundAnimation = (weatherCondition) => {
  weatherBackground.className = 'weather-background';
  weatherBackground.classList.add(weatherCondition.toLowerCase());
};

const updateWeatherUI = () => {
  if (!currentWeatherData) return;

  const temp = convertTemp(currentWeatherData.main.temp);
  const feelTemp = convertTemp(currentWeatherData.main.feels_like);

  cityName.textContent = currentWeatherData.name;
  weatherDescription.textContent = currentWeatherData.weather[0].description;
  weatherIcon.src = `https://openweathermap.org/img/wn/${currentWeatherData.weather[0].icon}@2x.png`;
  weatherIcon.alt = currentWeatherData.weather[0].description;
  temperature.textContent = `${Math.round(temp)}°`;
  feelsLike.textContent = `Feels like ${Math.round(feelTemp)}°`;
  humidity.textContent = `${currentWeatherData.main.humidity}%`;
  windSpeed.textContent = `${Math.round(currentWeatherData.wind.speed)} km/h`;
  unitToggle.textContent = `°${isCelsius ? 'C' : 'F'}`;

  // Update the weather condition
  conditionIcon.className = `detail-icon ${currentWeatherData.weather[0].icon}`;
  conditionText.textContent = currentWeatherData.weather[0].description;

  updateBackgroundAnimation(currentWeatherData.weather[0].main);
  showWeather();
};

// Function to add delay to avoid multiple requests in a short time
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Fetch city suggestions from OpenCage API
const fetchCitySuggestions = async (searchText) => {
    try {
      const response = await fetch(
        `${OPENCAGE_BASE_URL}?q=${encodeURIComponent(searchText)}&key=${OPENCAGE_API_KEY}&limit=5`
      );
      
      if (!response.ok) throw new Error('Failed to fetch suggestions');
      
      const data = await response.json();
      console.log("OpenCage API Response:", data); // Log the full API response for debugging
  
      return data.results.map(city => ({
        name: city.formatted,
        country: city.components.country,
        // Provide fallback for population if it's not available
        population: city.annotations && city.annotations.population ? city.annotations.population : 'N/A',
        lat: city.geometry.lat,
        lng: city.geometry.lng
      }));
    } catch (err) {
      console.error('Error fetching city suggestions:', err);
      return [];
    }
  };
  
  // Event listener for the location button to get the user's live location
document.getElementById('locationButton').addEventListener('click', () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      console.log('Latitude:', latitude, 'Longitude:', longitude);  // For debugging

      // Fetch weather data for the current location
      try {
        const weatherResponse = await fetch(
          `${WEATHER_BASE_URL}/weather?lat=${latitude}&lon=${longitude}&appid=${WEATHER_API_KEY}&units=metric`
        );
        currentWeatherData = await weatherResponse.json();
        updateWeatherUI();
      } catch (err) {
        showError('Failed to fetch weather data for your location');
        console.error(err);
      }
    }, () => {
      showError('Unable to retrieve your location. Please enable location services.');
    });
  } else {
    showError('Geolocation is not supported by this browser.');
  }
});

  
  // Update the UI to handle population properly
  const showSuggestions = (suggestions) => {
    suggestionsContainer.innerHTML = '';
    if (suggestions.length === 0) {
      suggestionsContainer.style.display = 'none';
      return;
    }

  
    suggestions.forEach((city, index) => {
      const div = document.createElement('div');
      div.className = 'suggestion-item';
      if (index === selectedSuggestionIndex) {
        div.classList.add('selected');
      }
  
      div.innerHTML = `
        <div class="suggestion-name">${city.name}, ${city.country}</div>
      `;
  
      div.addEventListener('click', () => {
        cityInput.value = `${city.name}, ${city.country}`;
        suggestionsContainer.style.display = 'none';
        fetchWeather(city.name);
      });
  
      suggestionsContainer.appendChild(div);
    });
  
    suggestionsContainer.style.display = 'block';
  };
  

// Default city: Kochi
const defaultCity = 'Kochi';

// Fetch weather for a city
const fetchWeather = async (cityName) => {
  showLoader();

  try {
    // Get coordinates of the city using OpenCage API
    const geoResponse = await fetch(
      `${OPENCAGE_BASE_URL}?q=${encodeURIComponent(cityName)}&key=${OPENCAGE_API_KEY}`
    );
    const geoData = await geoResponse.json();
    const { lat, lng } = geoData.results[0].geometry;

    // Fetch weather data from OpenWeatherMap API
    const weatherResponse = await fetch(
      `${WEATHER_BASE_URL}/weather?lat=${lat}&lon=${lng}&appid=${WEATHER_API_KEY}&units=metric`
    );
    currentWeatherData = await weatherResponse.json();
    updateWeatherUI();
  } catch (err) {
    showError('Failed to fetch weather data');
    console.error(err);
  }
};

// Event Listeners
searchForm.addEventListener('submit', (e) => {
  e.preventDefault();
  fetchWeather(cityInput.value);
});

cityInput.addEventListener('input', async () => {
  const searchText = cityInput.value.trim();
  if (searchText.length > 2) {
    clearTimeout(typingTimer);
    typingTimer = setTimeout(async () => {
      const suggestions = await fetchCitySuggestions(searchText);
      showSuggestions(suggestions);
    }, 500);
  } else {
    suggestionsContainer.style.display = 'none';
  }
});

// Toggle between Celsius and Fahrenheit
unitToggle.addEventListener('click', () => {
  isCelsius = !isCelsius;
  updateWeatherUI();
});

// Set default city (Kochi) on page load
document.addEventListener('DOMContentLoaded', () => {
  fetchWeather(defaultCity);
});
