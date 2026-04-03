import { COLORS } from '@/lib/constants';
import { useAuth } from '@/providers/AuthProvider';
import type { ItineraryPreferences } from '@/types/database';
import { useItineraryGeneration } from '@/hooks/useItineraryGeneration';
import { useLikedLocations } from '@/hooks/useLikedLocations';
import { BackButton } from '@/components/BackButton';
import { Heart, Settings, MapPin, Search, Check, Plus, Minus, X, Wand2, ChevronDown, AlertTriangle, AlertCircle } from 'lucide-react-native';
import { router } from 'expo-router';
import React, { useState, useMemo } from 'react';
import {
  Alert,
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TRAVEL_STYLES = ['Adventure', 'Relaxation', 'Cultural', 'Foodie', 'Mixed'] as const;
const BUDGET_LEVELS = ['Budget', 'Moderate', 'Luxury'] as const;
const INTEREST_OPTIONS = ['Museums', 'Food', 'Nightlife', 'Nature', 'Shopping', 'History', 'Art'] as const;

// Comprehensive destinations list - Includes major countries + popular cities
const POPULAR_DESTINATIONS = [
  // Major Countries (for broad searches)
  'Japan', 'Thailand', 'Indonesia', 'Philippines', 'Vietnam', 'Singapore', 'Malaysia',
  'South Korea', 'Taiwan', 'China', 'India', 'Cambodia', 'Laos', 'Myanmar', 'Bangladesh',
  'USA', 'Canada', 'Mexico', 'Brazil', 'Argentina', 'Peru', 'Chile', 'Colombia',
  'France', 'Italy', 'Spain', 'Germany', 'UK', 'United Kingdom', 'Greece', 'Portugal',
  'Netherlands', 'Switzerland', 'Austria', 'Belgium', 'Ireland', 'Sweden', 'Norway', 'Denmark',
  'Finland', 'Iceland', 'Czech Republic', 'Poland', 'Hungary', 'Croatia', 'Portugal',
  'Turkey', 'Egypt', 'Morocco', 'South Africa', 'Kenya', 'Tanzania',
  'Australia', 'New Zealand', 'Fiji', 'Maldives', 'Dubai', 'UAE', 'Israel', 'Jordan',

  // Europe - Western
  'Paris', 'London', 'Amsterdam', 'Brussels', 'Luxembourg', 'Geneva', 'Zurich', 'Basel',
  'Frankfurt', 'Munich', 'Hamburg', 'Cologne', 'Vienna', 'Salzburg', 'Innsbruck',
  'Edinburgh', 'Glasgow', 'Dublin', 'Cardiff',
  // Europe - Southern
  'Rome', 'Venice', 'Florence', 'Milan', 'Naples', 'Bologna', 'Verona', 'Cinque Terre',
  'Barcelona', 'Madrid', 'Seville', 'Valencia', 'Granada', 'Malaga', 'Ibiza', 'Mallorca',
  'Lisbon', 'Porto', 'Faro', 'Athens', 'Santorini', 'Mykonos', 'Crete', 'Naxos', 'Paros',
  'Monaco', 'Nice', 'Cannes', 'Marseille', 'San Marino', 'Vatican City',
  // Europe - Eastern & Central
  'Prague', 'Budapest', 'Warsaw', 'Krakow', 'Berlin', 'Dresden', 'Leipzig',
  'Bratislava', 'Ljubljana', 'Zagreb', 'Split', 'Dubrovnik', 'Plitvice',
  'Belgrade', 'Sarajevo', 'Mostar', 'Kotor', 'Tirana', 'Skopje', 'Sofia', 'Plovdiv',
  'Bucharest', 'Cluj-Napoca', 'Tallinn', 'Riga', 'Vilnius',
  // Europe - Nordic
  'Stockholm', 'Oslo', 'Copenhagen', 'Reykjavik', 'Tromso', 'Bergen', 'Lapland',
  // Europe - Islands
  'Malta', 'Cyprus', 'Corsica', 'Sardinia', 'Sicily', 'Madeira', 'Canary Islands',
  'Balearic Islands', 'Greek Islands', 'Azores', 'Faroe Islands', 'Isle of Skye', 'Highlands',

  // Asia - East Asia
  'Tokyo', 'Kyoto', 'Osaka', 'Hiroshima', 'Nara', 'Kobe', 'Mount Fuji', 'Hakone', 'Kamakura', 'Hokkaido', 'Okinawa',
  'Seoul', 'Busan', 'Jeju Island', 'Gyeongju', 'Incheon',
  'Beijing', 'Shanghai', 'Hong Kong', 'Macau', 'Guangzhou', 'Shenzhen', 'Chengdu', 'Xi\'an',
  'Hangzhou', 'Suzhou', 'Lhasa', 'Guilin', 'Yangshuo', 'Zhangjiajie', 'Great Wall',
  'Taipei', 'Kaohsiung', 'Tainan', 'Taroko Gorge', 'Sun Moon Lake',
  // Asia - Southeast Asia
  'Bangkok', 'Chiang Mai', 'Phuket', 'Krabi', 'Koh Samui', 'Pattaya', 'Ayutthaya', 'Phi Phi Islands', 'Koh Tao', 'Koh Phangan', 'Hua Hin',
  'Singapore', 'Kuala Lumpur', 'Penang', 'Langkawi', 'Borneo', 'Johor Bahru', 'Malacca', 'Putrajaya',
  'Bali', 'Lombok', 'Gili Islands', 'Ubud', 'Seminyak', 'Yogyakarta', 'Komodo Island', 'Raja Ampat', 'Jakarta', 'Sumatra', 'Java',
  'Ho Chi Minh City', 'Hanoi', 'Da Nang', 'Hoi An', 'Halong Bay', 'Phong Nha', 'Mui Ne', 'Nha Trang', 'Sapa', 'Dalat',
  'Phnom Penh', 'Siem Reap', 'Angkor Wat', 'Sihanoukville',
  'Vientiane', 'Luang Prabang', 'Vang Vieng',
  'Yangon', 'Bagan', 'Mandalay', 'Inle Lake', 'Ngapali Beach',
  'Manila', 'Cebu', 'Boracay', 'Palawan', 'El Nido', 'Coron', 'Bohol', 'Siargao', 'Davao',
  'Bandar Seri Begawan', 'Kota Kinabalu',
  // Asia - South Asia
  'Delhi', 'Mumbai', 'Goa', 'Jaipur', 'Udaipur', 'Jodhpur', 'Agra', 'Varanasi', 'Kolkata',
  'Bangalore', 'Hyderabad', 'Chennai', 'Kerala', 'Mysore', 'Hampi', 'Rishikesh', 'Dharamshala', 'New Delhi',
  'Kathmandu', 'Pokhara', 'Chitwan', 'Everest Base Camp',
  'Colombo', 'Kandy', 'Galle', 'Sigiriya', 'Ella', 'Nuwara Eliya',
  'Maldives', 'Male', 'Maafushi', 'Addu Atoll',
  'Dhaka', 'Chittagong', 'Sylhet', 'Cox\'s Bazar',
  'Thimphu', 'Paro',
  'Islamabad', 'Lahore', 'Karachi',
  // Asia - Central & West
  'Dubai', 'Abu Dhabi', 'Doha', 'Riyadh', 'Jeddah', 'Mecca', 'Medina', 'Bahrain', 'Kuwait City',
  'Muscat', 'Dammam', 'Sharjah', 'Al Ain',
  'Tel Aviv', 'Jerusalem', 'Haifa', 'Eilat', 'Dead Sea', 'Masada', 'Nazareth',
  'Petra', 'Wadi Rum', 'Amman', 'Beirut', 'Byblos', 'Baalbek',
  'Ankara', 'Istanbul', 'Izmir', 'Cappadocia', 'Antalya', 'Bodrum', 'Pamukkale', 'Ephesus',
  'Tashkent', 'Samarkand', 'Bukhara', 'Almaty', 'Astana', 'Bishkek',
  'Ashgabat', 'Dushanbe',

  // Americas - North America
  'New York', 'Los Angeles', 'San Francisco', 'Las Vegas', 'Miami', 'Chicago', 'Boston',
  'Washington DC', 'Seattle', 'Portland', 'Austin', 'Denver', 'San Diego', 'Nashville',
  'New Orleans', 'Atlanta', 'Philadelphia', 'Phoenix', 'Dallas', 'Houston', 'Honolulu', 'Maui', 'Oahu', 'Kauai',
  'Orlando', 'Tampa', 'Charlotte', 'San Antonio', 'Minneapolis', 'Detroit', 'Cleveland',
  'Yellowstone', 'Grand Canyon', 'Yosemite', 'Niagara Falls', 'Mount Rushmore',
  'Toronto', 'Vancouver', 'Montreal', 'Quebec City', 'Victoria', 'Banff', 'Jasper', 'Whistler',
  'Ottawa', 'Calgary', 'Halifax', 'Prince Edward Island', 'Niagara Falls',
  'Mexico City', 'Cancun', 'Playa del Carmen', 'Tulum', 'Cabo San Lucas', 'Puerto Vallarta',
  'Guadalajara', 'Oaxaca', 'San Miguel de Allende', 'Chichen Itza', 'Cozumel',
  // Americas - Central America & Caribbean
  'San Jose', 'Costa Rica', 'Monteverde', 'Arenal', 'Manuel Antonio', 'Tortuguero',
  'Panama City', 'Panama Canal', 'Bocas del Toro', 'San Blas Islands',
  'Guatemala City', 'Antigua Guatemala', 'Lake Atitlan', 'Tikal', 'Chichicastenango',
  'San Salvador', 'Tegucigalpa', 'Managua', 'Leon', 'Granada',
  'Belize City', 'Ambergris Caye', 'Caye Caulker', 'San Ignacio',
  'Havana', 'Trinidad', 'Varadero', 'Viñales', 'Cienfuegos',
  'Kingston', 'Montego Bay', 'Ocho Rios', 'Negril',
  'Santo Domingo', 'Punta Cana', 'Puerto Plata',
  'Nassau', 'Paradise Island', 'Freeport', 'Bimini',
  'Port-au-Prince',
  // Americas - South America
  'Buenos Aires', 'Mendoza', 'Bariloche', 'Iguazu Falls', 'Patagonia', 'Ushuaia', 'El Calafate',
  'Rio de Janeiro', 'Sao Paulo', 'Iguazu Falls', 'Salvador', 'Recife', 'Fortaleza', 'Brasilia',
  'Santiago', 'Valparaiso', 'Easter Island', 'Patagonia', 'Torres del Paine', 'Atacama Desert',
  'Lima', 'Cusco', 'Machu Picchu', 'Sacred Valley', 'Arequipa', 'Colca Canyon', 'Nazca Lines',
  'Quito', 'Galapagos Islands', 'Guayaquil', 'Cuenca', 'Otavalo',
  'Bogota', 'Medellin', 'Cartagena', 'Coffee Region', 'Santa Marta', 'Tayrona',
  'Caracas', 'Angel Falls', 'Canaima',
  'Georgetown', 'Paramaribo', 'Cayenne',

  // Africa - North
  'Cairo', 'Luxor', 'Aswan', 'Alexandria', 'Sharm El Sheikh', 'Hurghada', 'Abu Simbel',
  'Tunis', 'Carthage', 'Sousse', 'Hammamet',
  'Algiers', 'Oran',
  'Rabat', 'Casablanca', 'Marrakech', 'Fes', 'Chefchaouen', 'Essaouira', 'Atlas Mountains', 'Sahara Desert',
  // Africa - East
  'Nairobi', 'Mombasa', 'Masai Mara', 'Amboseli', 'Tsavo', 'Lake Nakuru', 'Mount Kenya',
  'Kampala', 'Entebbe', 'Bwindi', 'Queen Elizabeth', 'Murchison Falls',
  'Kigali', 'Volcanoes National Park', 'Akagera',
  'Addis Ababa', 'Lalibela', 'Gondar', 'Axum', 'Simien Mountains',
  'Zanzibar', 'Dar es Salaam', 'Arusha', 'Serengeti', 'Ngorongoro', 'Mount Kilimanjaro', 'Lake Manyara',
  'Antananarivo',
  'Port Louis',
  'Victoria', 'Seychelles',
  // Africa - West
  'Accra', 'Kumasi', 'Cape Coast', 'Mole National Park',
  'Lome', 'Cotonou', 'Ouagadougou',
  'Abidjan', 'Yamoussoukro',
  'Lagos', 'Abuja', 'Calabar',
  'Yaounde', 'Douala',
  'Freetown', 'Conakry', 'Monrovia',
  'Dakar',
  // Africa - Central & South
  'Kinshasa', 'Lubumbashi', 'Virunga National Park',
  'Brazzaville', 'Pointe-Noire',
  'Windhoek', 'Etosha National Park', 'Sossusvlei', 'Skeleton Coast',
  'Gaborone', 'Okavango Delta', 'Chobe National Park',
  'Harare', 'Victoria Falls',
  'Maputo', 'Bazaruto Archipelago',
  'Johannesburg', 'Cape Town', 'Durban', 'Garden Route', 'Kruger National Park',
  'Winelands', 'Drakensberg', 'Stellenbosch', 'Hermanus', 'Table Mountain',

  // Oceania - Australia
  'Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Canberra', 'Gold Coast',
  'Cairns', 'Great Barrier Reef', 'Whitsundays', 'Alice Springs', 'Uluru', 'Kakadu', 'Tasmania',
  'Byron Bay', 'Margaret River', 'Hunter Valley', 'Blue Mountains', 'Mornington Peninsula',
  // Oceania - New Zealand
  'Auckland', 'Wellington', 'Queenstown', 'Christchurch', 'Rotorua', 'Waitomo', 'Dunedin',
  'Fiordland', 'Milford Sound', 'Bay of Islands', 'Tongariro', 'Mount Cook', 'Wanaka',
  // Oceania - Pacific Islands
  'Fiji', 'Nadi', 'Suva', 'Mamanuca Islands', 'Yasawa Islands',
  'Bora Bora', 'Tahiti', 'Moorea', 'Papeete',
  'Rarotonga', 'Aitutaki',
  'Pago Pago',
  'Guam', 'Saipan', 'Palau', 'Yap', 'Chuuk',
  'Pohnpei', 'Kosrae',
  'Nuku\'alofa', 'Vava\'u',
  'Vanuatu', 'Samoa', 'Tahiti',

  // Popular tourist regions & experiences
  'Swiss Alps', 'French Riviera', 'Amalfi Coast', 'Tuscany', 'Greek Islands', 'French Polynesia',
  'Yucatan Peninsula', 'Patagonia', 'Andes Mountains', 'Amazon Rainforest',
  'Serengeti', 'Masai Mara', 'Kruger National Park', 'Safari',
  'Northern Lights', 'Aurora Borealis', 'Midnight Sun',
].sort();

export default function GenerateItineraryScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { locations, isLoading: loadingLocations } = useLikedLocations(user?.id);
  const {
    generate,
    itinerary,
    isLoading: generating,
    error,
    progress,
    usingFallback,
  } = useItineraryGeneration(user?.id, locations);

  const [destination, setDestination] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [duration, setDuration] = useState('3');
  const [travelStyle, setTravelStyle] = useState<string | null>(null);
  const [budgetLevel, setBudgetLevel] = useState<string | null>(null);
  const [interests, setInterests] = useState<string[]>([]);

  // Filter destinations based on input
  const filteredDestinations = useMemo(() => {
    if (!destination || destination.trim().length === 0) {
      return POPULAR_DESTINATIONS.slice(0, 20); // Show first 20 when no search
    }
    const search = destination.toLowerCase();
    return POPULAR_DESTINATIONS.filter((dest) =>
      dest.toLowerCase().includes(search)
    );
  }, [destination]);

  // Helper to check if destination and location share a country
  const checkCountryMatch = (dest: string, loc: string): boolean => {
    // Country/region mappings - expanded for better matching
    const regions: Record<string, string[]> = {
      'japan': ['tokyo', 'kyoto', 'osaka', 'hokkaido', 'fuji', 'nara', 'kobe', 'hiroshima', 'okinawa', 'yokohama'],
      'taiwan': ['taipei', 'kaohsiung', 'tainan', 'taichung'],
      'thailand': ['bangkok', 'phuket', 'chiang mai', 'krabi', 'pattaya', 'koh samui', 'hua hin', 'ayutthaya'],
      'south korea': ['seoul', 'busan', 'jeju', 'gyeongju', 'incheon'],
      'korea': ['seoul', 'busan', 'jeju', 'gyeongju', 'incheon'],
      'vietnam': ['ho chi minh', 'hanoi', 'da nang', 'hue', 'nha trang', 'sapa', 'halong', 'hai phong'],
      'indonesia': ['bali', 'jakarta', 'yogyakarta', 'lombok', 'sumatra', 'java', 'borneo', 'komodo', 'ubud'],
      'philippines': ['manila', 'cebu', 'boracay', 'palawan', 'davao', 'el nido', 'coron', 'bohol'],
      'singapore': ['singapore'],
      'malaysia': ['kuala lumpur', 'penang', 'langkawi', 'borneo', 'johor', 'malacca', 'putrajaya'],
      'china': ['beijing', 'shanghai', 'hong kong', 'guangzhou', 'chengdu', 'xi\'an', 'hangzhou', 'suzhou', 'lhasa'],
      'india': ['delhi', 'mumbai', 'jaipur', 'goa', 'bangalore', 'kolkata', 'agra', 'kerala', 'chennai'],
      'cambodia': ['siem reap', 'phnom penh', 'angkor wat', 'sihanoukville'],
      'laos': ['vientiane', 'luang prabang', 'vang vieng'],
      'myanmar': ['yangon', 'mandalay', 'bagan', 'inle lake'],
      'usa': ['new york', 'los angeles', 'chicago', 'miami', 'san francisco', 'las vegas', 'seattle', 'boston', 'honolulu', 'orlando', 'denver', 'austin', 'nashville', 'new orleans'],
      'united states': ['new york', 'los angeles', 'chicago', 'miami', 'san francisco', 'las vegas'],
      'canada': ['toronto', 'vancouver', 'montreal', 'calgary', 'banff', 'quebec', 'ottawa', 'whistler'],
      'mexico': ['mexico city', 'cancun', 'playa del carmen', 'tulum', 'cabo san lucas', 'oaxaca', 'guadalajara'],
      'brazil': ['rio de janeiro', 'sao paulo', 'brasilia', 'salvador'],
      'argentina': ['buenos aires', 'mendoza', 'bariloche', 'patagonia'],
      'peru': ['lima', 'cusco', 'machu picchu'],
      'chile': ['santiago', 'patagonia', 'valparaiso'],
      'colombia': ['bogota', 'medellin', 'cartagena'],
      'france': ['paris', 'nice', 'lyon', 'marseille', 'bordeaux', 'cannes', 'monaco'],
      'italy': ['rome', 'venice', 'florence', 'milan', 'naples', 'cinque terre', 'tuscany'],
      'spain': ['madrid', 'barcelona', 'seville', 'valencia', 'granada', 'ibiza', 'mallorca'],
      'uk': ['london', 'manchester', 'edinburgh', 'birmingham', 'glasgow'],
      'united kingdom': ['london', 'manchester', 'edinburgh', 'birmingham'],
      'germany': ['berlin', 'munich', 'frankfurt', 'hamburg', 'cologne'],
      'netherlands': ['amsterdam', 'rotterdam'],
      'switzerland': ['zurich', 'geneva', 'basel', 'bern'],
      'austria': ['vienna', 'salzburg', 'innsbruck'],
      'greece': ['athens', 'santorini', 'mykonos', 'crete', 'zakynthos'],
      'portugal': ['lisbon', 'porto', 'faro', 'madeira'],
      'czech republic': ['prague'],
      'poland': ['warsaw', 'krakow'],
      'hungary': ['budapest'],
      'croatia': ['zagreb', 'split', 'dubrovnik'],
      'turkey': ['istanbul', 'ankara', 'izmir', 'cappadocia', 'antalya'],
      'egypt': ['cairo', 'luxor', 'aswan', 'alexandria'],
      'morocco': ['marrakech', 'casablanca', 'fes', 'rabat'],
      'south africa': ['cape town', 'johannesburg', 'durban'],
      'kenya': ['nairobi', 'mombasa', 'masai mara'],
      'tanzania': ['dar es salaam', 'arusha', 'serengeti', 'zanzibar'],
      'australia': ['sydney', 'melbourne', 'brisbane', 'perth', 'adelaide', 'cairns', 'gold coast'],
      'new zealand': ['auckland', 'wellington', 'queenstown', 'christchurch'],
      'fiji': ['fiji', 'nadi', 'suva'],
      'maldives': ['maldives', 'male', 'maafushi'],
      'uae': ['dubai', 'abu dhabi'],
      'israel': ['tel aviv', 'jerusalem', 'haifa'],
      'jordan': ['petra', 'amman', 'wadi rum'],
    };

    for (const [country, cities] of Object.entries(regions)) {
      // Check if both destination and location match the same country
      const destInCountry = cities.some(city => dest.includes(city)) || dest.includes(country);
      const locInCountry = cities.some(city => loc.includes(city)) || loc.includes(country);
      if (destInCountry && locInCountry) return true;
    }

    return false;
  };

  // Check if user has locations matching the selected destination
  const hasMatchingLocations = useMemo(() => {
    if (!destination || locations.length === 0) return false;

    const destLower = destination.toLowerCase();
    const locationMatches = locations.filter(loc => {
      const locLower = (loc.location || '').toLowerCase();
      const titleLower = (loc.title || '').toLowerCase();

      // Check if destination name appears in location or title
      return locLower.includes(destLower) ||
             titleLower.includes(destLower) ||
             destLower.includes(locLower) ||
             checkCountryMatch(destLower, locLower);
    });

    return locationMatches.length >= 3;
  }, [destination, locations]);

  const getMismatchedMessage = () => {
    if (!destination || hasMatchingLocations) return null;

    const destLower = destination.toLowerCase();
    const locationCountries = new Set<string>();

    locations.forEach(loc => {
      const locLower = (loc.location || '').toLowerCase();
      // Extract country from location string - expanded list
      if (locLower.includes('japan')) locationCountries.add('Japan');
      else if (locLower.includes('taiwan')) locationCountries.add('Taiwan');
      else if (locLower.includes('thailand')) locationCountries.add('Thailand');
      else if (locLower.includes('korea')) locationCountries.add('South Korea');
      else if (locLower.includes('vietnam')) locationCountries.add('Vietnam');
      else if (locLower.includes('indonesia')) locationCountries.add('Indonesia');
      else if (locLower.includes('philippines')) locationCountries.add('Philippines');
      else if (locLower.includes('singapore')) locationCountries.add('Singapore');
      else if (locLower.includes('malaysia')) locationCountries.add('Malaysia');
      else if (locLower.includes('china')) locationCountries.add('China');
      else if (locLower.includes('india')) locationCountries.add('India');
      else if (locLower.includes('cambodia')) locationCountries.add('Cambodia');
      else if (locLower.includes('laos')) locationCountries.add('Laos');
      else if (locLower.includes('myanmar')) locationCountries.add('Myanmar');
      else if (locLower.includes('usa') || locLower.includes('united states')) locationCountries.add('the USA');
      else if (locLower.includes('canada')) locationCountries.add('Canada');
      else if (locLower.includes('mexico')) locationCountries.add('Mexico');
      else if (locLower.includes('brazil')) locationCountries.add('Brazil');
      else if (locLower.includes('argentina')) locationCountries.add('Argentina');
      else if (locLower.includes('peru')) locationCountries.add('Peru');
      else if (locLower.includes('chile')) locationCountries.add('Chile');
      else if (locLower.includes('colombia')) locationCountries.add('Colombia');
      else if (locLower.includes('france')) locationCountries.add('France');
      else if (locLower.includes('italy')) locationCountries.add('Italy');
      else if (locLower.includes('spain')) locationCountries.add('Spain');
      else if (locLower.includes('uk') || locLower.includes('united kingdom')) locationCountries.add('the UK');
      else if (locLower.includes('germany')) locationCountries.add('Germany');
      else if (locLower.includes('netherlands')) locationCountries.add('the Netherlands');
      else if (locLower.includes('switzerland')) locationCountries.add('Switzerland');
      else if (locLower.includes('austria')) locationCountries.add('Austria');
      else if (locLower.includes('greece')) locationCountries.add('Greece');
      else if (locLower.includes('portugal')) locationCountries.add('Portugal');
      else if (locLower.includes('czech')) locationCountries.add('Czech Republic');
      else if (locLower.includes('poland')) locationCountries.add('Poland');
      else if (locLower.includes('hungary')) locationCountries.add('Hungary');
      else if (locLower.includes('croatia')) locationCountries.add('Croatia');
      else if (locLower.includes('turkey')) locationCountries.add('Turkey');
      else if (locLower.includes('egypt')) locationCountries.add('Egypt');
      else if (locLower.includes('morocco')) locationCountries.add('Morocco');
      else if (locLower.includes('south africa')) locationCountries.add('South Africa');
      else if (locLower.includes('kenya')) locationCountries.add('Kenya');
      else if (locLower.includes('tanzania')) locationCountries.add('Tanzania');
      else if (locLower.includes('australia')) locationCountries.add('Australia');
      else if (locLower.includes('new zealand')) locationCountries.add('New Zealand');
      else if (locLower.includes('fiji')) locationCountries.add('Fiji');
      else if (locLower.includes('maldives')) locationCountries.add('Maldives');
      else if (locLower.includes('uae') || locLower.includes('dubai')) locationCountries.add('the UAE');
      else if (locLower.includes('israel')) locationCountries.add('Israel');
      else if (locLower.includes('jordan')) locationCountries.add('Jordan');
    });

    const countries = Array.from(locationCountries);
    if (countries.length === 0) return null;

    const countryList = countries.length <= 2
      ? countries.join(' and ')
      : `${countries.slice(0, -1).join(', ')}, and ${countries[countries.length - 1]}`;

    return `Your saved locations are in ${countryList}, but you selected ${destination}. Please like videos from ${destination} first.`;
  };

  const isDestinationValid = destination.trim().length >= 2;
  const isFormValid = isDestinationValid && parseInt(duration) >= 1 && parseInt(duration) <= 14;
  const hasEnoughLocations = locations.length >= 3;

  const toggleInterest = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const selectDestination = (dest: string) => {
    setDestination(dest);
    setShowSuggestions(false);
  };

  const handleGenerate = async () => {
    if (!isDestinationValid) {
      Alert.alert('Invalid Destination', 'Please select a destination from the list');
      return;
    }
    if (!isFormValid) {
      Alert.alert('Invalid Input', 'Please enter a duration between 1-14 days');
      return;
    }

    if (!hasEnoughLocations) {
      Alert.alert(
        'Not Enough Destinations',
        'Please like at least 3 destinations to generate an itinerary. Go to the Explore tab to discover more places!',
        [
          { text: 'Cancel' },
          { text: 'Explore', onPress: () => router.push('/explore') },
        ]
      );
      return;
    }

    // Check if user has matching locations for the selected destination
    if (!hasMatchingLocations) {
      const mismatchMessage = getMismatchedMessage();
      Alert.alert(
        'Location Mismatch',
        mismatchMessage || 'Please like videos from your selected destination first.',
        [{ text: 'OK' }]
      );
      return;
    }

    const preferences: ItineraryPreferences = {
      destination: destination.trim(),
      durationDays: parseInt(duration),
      travelStyle: (travelStyle?.toLowerCase() as any) || undefined,
      budgetLevel: (budgetLevel?.toLowerCase() as any) || undefined,
      interests: interests.length > 0 ? interests : undefined,
    };

    const result = await generate(preferences);

    if (result) {
      router.push({
        pathname: '/profile/itineraries/[id]',
        params: { id: result.id },
      });
    }
  };

  if (loadingLocations) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <BackButton />
        <Text style={styles.title}>Generate Itinerary</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Liked Locations Info */}
      <View style={styles.locationsInfoCard}>
        <Heart size={16} color={COLORS.error} strokeWidth={2.5} fill={COLORS.error} />
        <Text style={styles.locationsInfoText}>
          {locations.length} destination{locations.length !== 1 ? 's' : ''} liked
        </Text>
        {!hasEnoughLocations && (
          <Text style={styles.locationsInfoWarning}>
            {' '}(need 3+ to generate)
          </Text>
        )}
      </View>

      {generating ? (
        /* Generation Progress */
        <View style={styles.progressContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.progressTitle}>Creating Your Itinerary</Text>
          {usingFallback && (
            <View style={styles.fallbackBadge}>
              <Settings size={14} color={COLORS.textMuted} strokeWidth={2} />
              <Text style={styles.fallbackText}>Using Smart Matching</Text>
            </View>
          )}
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>{progress}% complete</Text>
          <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* Generation Form */
        <>
          {/* Destination Dropdown */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Destination *</Text>
            <TouchableOpacity
              style={[
                styles.dropdownButton,
                destination.length > 0 && !isDestinationValid && styles.inputInvalid,
              ]}
              onPress={() => setShowSuggestions(true)}
              activeOpacity={0.7}
            >
              <Text
                style={destination ? styles.dropdownValue : styles.dropdownPlaceholder}
                numberOfLines={1}
              >
                {destination || 'Select destination'}
              </Text>
              <ChevronDown size={20} color={COLORS.textMuted} strokeWidth={2.5} />
            </TouchableOpacity>
            {destination.length > 0 && !isDestinationValid && (
              <Text style={styles.helperText}>Please select a destination</Text>
            )}
          </View>

          {/* Destination Modal */}
          <Modal
            visible={showSuggestions}
            transparent
            animationType="slide"
            onRequestClose={() => setShowSuggestions(false)}
          >
            <View style={styles.modalOverlay}>
              <Pressable
                style={styles.modalBackdrop}
                onPress={() => setShowSuggestions(false)}
              />
              <View style={[styles.modalContent, { paddingBottom: insets.bottom }]}>
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select Destination</Text>
                  <TouchableOpacity onPress={() => setShowSuggestions(false)}>
                    <X size={28} color={COLORS.text} strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>

                {/* Search Input */}
                <View style={styles.searchContainer}>
                  <Search size={20} color={COLORS.textMuted} strokeWidth={2.5} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search destinations..."
                    placeholderTextColor={COLORS.textMuted}
                    value={destination}
                    onChangeText={setDestination}
                    autoFocus
                    autoCapitalize="words"
                  />
                </View>

                {/* Popular Destinations */}
                <Text style={styles.sectionTitle}>Popular Destinations</Text>
                <ScrollView
                  style={styles.destinationsList}
                  keyboardShouldPersistTaps="handled"
                >
                  {filteredDestinations.length > 0 ? (
                    filteredDestinations.map((dest, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.destinationItem}
                        onPress={() => selectDestination(dest)}
                      >
                        <View style={styles.destinationIcon}>
                          <MapPin size={16} color={COLORS.accent} strokeWidth={2.5} />
                        </View>
                        <Text style={styles.destinationText}>{dest}</Text>
                        <Check size={20} color={
                          destination === dest ? COLORS.accent : 'transparent'
                        } strokeWidth={3} />
                      </TouchableOpacity>
                    ))
                  ) : (
                    <View style={styles.noResults}>
                      <Search size={32} color={COLORS.textMuted} strokeWidth={2} />
                      <Text style={styles.noResultsText}>No destinations found</Text>
                      <Text style={styles.noResultsSubtext}>Try a different search term</Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            </View>
          </Modal>

          {/* Duration */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Duration (Days) *</Text>
            <View style={styles.durationContainer}>
              <TouchableOpacity
                style={styles.durationButton}
                onPress={() => setDuration(Math.max(1, parseInt(duration) - 1).toString())}
              >
                <Minus size={16} color={COLORS.primary} strokeWidth={3} />
              </TouchableOpacity>
              <TextInput
                style={styles.durationInput}
                value={duration}
                onChangeText={setDuration}
                keyboardType="number-pad"
                maxLength={2}
                textAlign="center"
              />
              <TouchableOpacity
                style={styles.durationButton}
                onPress={() => setDuration(Math.min(14, parseInt(duration) + 1).toString())}
              >
                <Plus size={16} color={COLORS.primary} strokeWidth={3} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Travel Style */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Travel Style</Text>
            <View style={styles.segmentContainer}>
              {TRAVEL_STYLES.map((style) => (
                <TouchableOpacity
                  key={style}
                  style={[
                    styles.segmentButton,
                    travelStyle === style && styles.segmentButtonActive,
                  ]}
                  onPress={() => setTravelStyle(travelStyle === style ? null : style)}
                >
                  <Text
                    style={[
                      styles.segmentButtonText,
                      travelStyle === style && styles.segmentButtonTextActive,
                    ]}
                  >
                    {style}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Budget Level */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Budget Level</Text>
            <View style={styles.segmentContainer}>
              {BUDGET_LEVELS.map((budget) => (
                <TouchableOpacity
                  key={budget}
                  style={[
                    styles.segmentButton,
                    budgetLevel === budget && styles.segmentButtonActive,
                  ]}
                  onPress={() => setBudgetLevel(budgetLevel === budget ? null : budget)}
                >
                  <Text
                    style={[
                      styles.segmentButtonText,
                      budgetLevel === budget && styles.segmentButtonTextActive,
                    ]}
                  >
                    {budget}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Interests */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Special Interests</Text>
            <View style={styles.interestsContainer}>
              {INTEREST_OPTIONS.map((interest) => (
                <TouchableOpacity
                  key={interest}
                  style={[
                    styles.interestTag,
                    interests.includes(interest) && styles.interestTagActive,
                  ]}
                  onPress={() => toggleInterest(interest)}
                >
                  {interests.includes(interest) ? (
                    <Check size={12} color="white" strokeWidth={3} />
                  ) : (
                    <Plus size={12} color={COLORS.primary} strokeWidth={3} />
                  )}
                  <Text
                    style={[
                      styles.interestTagText,
                      interests.includes(interest) && styles.interestTagTextActive,
                    ]}
                  >
                    {interest}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Location Mismatch Warning */}
          {destination && !hasMatchingLocations && getMismatchedMessage() && (
            <View style={styles.warningCard}>
              <AlertTriangle size={16} color={COLORS.warning} strokeWidth={2.5} />
              <Text style={styles.warningText}>{getMismatchedMessage()}</Text>
            </View>
          )}

          {/* Error */}
          {error && (
            <View style={styles.errorCard}>
              <AlertCircle size={16} color={COLORS.error} strokeWidth={2.5} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Generate Button */}
          <TouchableOpacity
            style={[
              styles.generateButton,
              (!isFormValid || !hasEnoughLocations || !hasMatchingLocations) && styles.generateButtonDisabled,
            ]}
            onPress={handleGenerate}
            disabled={!isFormValid || !hasEnoughLocations || !hasMatchingLocations}
          >
            <Wand2 size={18} color="white" strokeWidth={2.5} />
            <Text style={styles.generateButtonText}>Generate Itinerary</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    padding: 16,
    paddingTop: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  placeholder: {
    width: 36,
  },
  locationsInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  locationsInfoText: {
    fontSize: 14,
    color: COLORS.text,
    marginLeft: 8,
  },
  locationsInfoWarning: {
    fontSize: 14,
    color: COLORS.warning,
  },
  progressContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  fallbackBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 24,
  },
  fallbackText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: COLORS.background,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  progressText: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 24,
  },
  cancelButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputInvalid: {
    borderColor: COLORS.error,
    backgroundColor: COLORS.error + '08',
  },
  helperText: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: 6,
  },
  // Dropdown styles
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dropdownValue: {
    fontSize: 15,
    color: COLORS.text,
  },
  dropdownPlaceholder: {
    fontSize: 15,
    color: COLORS.textMuted,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingTop: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: COLORS.text,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  destinationsList: {
    paddingHorizontal: 8,
  },
  destinationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginHorizontal: 8,
    marginBottom: 4,
    backgroundColor: COLORS.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  destinationIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(212, 133, 106, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  destinationText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  noResultsText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  durationButton: {
    padding: 12,
  },
  durationInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  segmentContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  segmentButton: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  segmentButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  segmentButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  segmentButtonTextActive: {
    color: 'white',
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  interestTagActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  interestTagText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.primary,
  },
  interestTagTextActive: {
    color: 'white',
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 100, 90, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 100, 90, 0.3)',
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.error,
    marginLeft: 8,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.warning,
    marginLeft: 8,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 8,
  },
  generateButtonDisabled: {
    opacity: 0.5,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
