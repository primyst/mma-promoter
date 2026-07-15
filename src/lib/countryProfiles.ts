export interface CountryProfile {
  country: string;
  flag: string;
  firstNames: string[];
  lastNames: string[];
  hometowns: string[];
}

// Kept modest on purpose — 8 countries, ~12-15 names each. Enough for real
// nationality flavor and variety without turning name generation into a
// content-authoring project on its own.
export const COUNTRY_PROFILES: CountryProfile[] = [
  {
    country: "United States",
    flag: "🇺🇸",
    firstNames: ["Marcus", "Tyler", "Jake", "Andre", "Chris", "Malik", "Nick", "Brandon", "Cody", "Trevor", "Isaiah", "Jordan"],
    lastNames: ["Hall", "Reed", "Brooks", "Carter", "Bennett", "Coleman", "Fisher", "Vance", "Lewis", "Grant", "Foster", "Wells"],
    hometowns: ["Denver, CO", "Albuquerque, NM", "Tampa, FL", "Sacramento, CA", "Columbus, OH", "Tulsa, OK"],
  },
  {
    country: "Brazil",
    flag: "🇧🇷",
    firstNames: ["Rafael", "Bruno", "Lucas", "Diego", "Thiago", "Gabriel", "Renato", "Vitor", "Caio", "Igor", "Wesley", "Everton"],
    lastNames: ["Silva", "Santos", "Costa", "Oliveira", "Souza", "Pereira", "Almeida", "Ribeiro", "Carvalho", "Barbosa", "Duarte", "Moreira"],
    hometowns: ["São Paulo", "Rio de Janeiro", "Curitiba", "Belo Horizonte", "Recife", "Manaus"],
  },
  {
    country: "Nigeria",
    flag: "🇳🇬",
    firstNames: ["Emeka", "Chinedu", "Tunde", "Kelechi", "Ifeanyi", "Segun", "Usman", "Obinna", "Yusuf", "Femi", "Chidi", "Adewale"],
    lastNames: ["Okafor", "Adeyemi", "Okonkwo", "Balogun", "Eze", "Nwosu", "Afolabi", "Akin", "Adebayo", "Bello", "Chukwu", "Olawale"],
    hometowns: ["Lagos", "Abuja", "Port Harcourt", "Kano", "Ibadan", "Enugu"],
  },
  {
    country: "Ireland",
    flag: "🇮🇪",
    firstNames: ["Sean", "Liam", "Conor", "Aidan", "Declan", "Cian", "Rory", "Eoin", "Darragh", "Fionn", "Niall", "Cormac"],
    lastNames: ["Byrne", "Doyle", "Kelly", "Walsh", "Brennan", "Fitzgerald", "Duffy", "Nolan", "Hogan", "Reilly", "Connolly", "Maguire"],
    hometowns: ["Dublin", "Cork", "Galway", "Limerick", "Waterford", "Sligo"],
  },
  {
    country: "Russia",
    flag: "🇷🇺",
    firstNames: ["Dmitri", "Viktor", "Ivan", "Sergei", "Nikolai", "Pavel", "Yuri", "Anton", "Maxim", "Artem", "Oleg", "Roman"],
    lastNames: ["Volkov", "Petrov", "Novak", "Sokolov", "Orlov", "Kuznetsov", "Popov", "Fedorov", "Belov", "Morozov", "Egorov", "Volin"],
    hometowns: ["Moscow", "Grozny", "Khabarovsk", "Yekaterinburg", "Kazan", "Krasnodar"],
  },
  {
    country: "Japan",
    flag: "🇯🇵",
    firstNames: ["Kenji", "Hiroshi", "Takashi", "Yuto", "Ryo", "Daichi", "Kazuki", "Sora", "Haruto", "Riku", "Yamato", "Kaito"],
    lastNames: ["Tanaka", "Nakamura", "Sato", "Yamamoto", "Suzuki", "Takahashi", "Watanabe", "Kobayashi", "Ito", "Matsumoto", "Inoue", "Fujita"],
    hometowns: ["Tokyo", "Osaka", "Nagoya", "Fukuoka", "Sapporo", "Kobe"],
  },
  {
    country: "Poland",
    flag: "🇵🇱",
    firstNames: ["Marek", "Tomasz", "Kamil", "Piotr", "Adrian", "Jakub", "Wojciech", "Bartosz", "Dawid", "Michal", "Krzysztof", "Rafal"],
    lastNames: ["Kowalski", "Nowak", "Wisniewski", "Wojcik", "Kaminski", "Lewandowski", "Zielinski", "Szymanski", "Dabrowski", "Kozlowski", "Jankowski", "Mazur"],
    hometowns: ["Warsaw", "Krakow", "Gdansk", "Wroclaw", "Poznan", "Lodz"],
  },
  {
    country: "Mexico",
    flag: "🇲🇽",
    firstNames: ["Alejandro", "Fernando", "Ricardo", "Emilio", "Gael", "Santiago", "Mateo", "Diego", "Rodrigo", "Ivan", "Adan", "Cesar"],
    lastNames: ["Hernandez", "Garcia", "Martinez", "Lopez", "Gonzalez", "Ramirez", "Torres", "Flores", "Vargas", "Rojas", "Mendez", "Cortez"],
    hometowns: ["Mexico City", "Guadalajara", "Monterrey", "Tijuana", "Puebla", "Merida"],
  },
];

export function randomCountryProfile(): CountryProfile {
  return COUNTRY_PROFILES[Math.floor(Math.random() * COUNTRY_PROFILES.length)];
}
