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
    firstNames: ["Marcus", "Tyler", "Jake", "Andre", "Chris", "Malik", "Nick", "Brandon", "Cody", "Trevor", "Isaiah", "Jordan", "Dustin", "Cory", "Justin", "Erik", "Shane", "Josh", "Kyle", "Derek", "Troy", "Blake", "Chase", "Drew", "Brett", "Wade", "Zane", "Cole", "Reese", "Bryce"],
    lastNames: ["Hall", "Reed", "Brooks", "Carter", "Bennett", "Coleman", "Fisher", "Vance", "Lewis", "Grant", "Foster", "Wells", "Henderson", "Jenkins", "Perry", "Gibson", "Burns", "Wallace", "Hunter", "Rhodes", "Porter", "Webb", "Elliott", "Armstrong", "Mason", "Hudson", "Long", "Stone", "Fox", "Boyd"],
    hometowns: ["Denver, CO", "Albuquerque, NM", "Tampa, FL", "Sacramento, CA", "Columbus, OH", "Tulsa, OK", "Phoenix, AZ", "Austin, TX", "Las Vegas, NV", "Chicago, IL", "Miami, FL", "Seattle, WA", "Portland, OR", "Nashville, TN", "Memphis, TN"],
  },
  {
    country: "Brazil",
    flag: "🇧🇷",
    firstNames: ["Rafael", "Bruno", "Lucas", "Diego", "Thiago", "Gabriel", "Renato", "Vitor", "Caio", "Igor", "Wesley", "Everton", "Alex", "Andre", "Felipe", "Rodrigo", "Paulo", "Marcelo", "Leonardo", "Gustavo", "Mauro", "Ricardo", "Carlos", "Fabio", "Junior", "Edson", "Nilson", "Ronaldo", "Anderson", "Marcio"],
    lastNames: ["Silva", "Santos", "Costa", "Oliveira", "Souza", "Pereira", "Almeida", "Ribeiro", "Carvalho", "Barbosa", "Duarte", "Moreira", "Lima", "Dias", "Nunes", "Rocha", "Gomes", "Araujo", "Mendes", "Teixeira", "Ferreira", "Ramos", "Monteiro", "Cardoso", "Fernandes", "Martins", "Pires", "Machado", "Fonseca", "Melo"],
    hometowns: ["São Paulo", "Rio de Janeiro", "Curitiba", "Belo Horizonte", "Recife", "Manaus", "Salvador", "Fortaleza", "Brasília", "Porto Alegre", "Goiânia", "Belém", "Natal", "Maceió", "Florianópolis"],
  },
  {
    country: "Nigeria",
    flag: "🇳🇬",
    firstNames: ["Emeka", "Chinedu", "Tunde", "Kelechi", "Ifeanyi", "Segun", "Usman", "Obinna", "Yusuf", "Femi", "Chidi", "Adewale", "Olu", "Ade", "Ola", "Ikenna", "Chinonso", "Damilola", "Suleiman", "Abdullahi", "Jibril", "Rashid", "Hamza", "Mustapha", "Ibrahim", "Bashir", "Umar", "Faruq", "Tanji", "Mansur", "Nasir", "Sadiq", "Zayd", "Khalid", "Tahir", "Aminu", "Abubakar", "Idris", "Ismail", "Abdul", "Razaq", "Saheed", "Olawale", "Ayodele", "Olumide", "Dapo", "Tosin", "Dele", "Kunle", "Oluwaseun"],
    lastNames: ["Okafor", "Adeyemi", "Okonkwo", "Balogun", "Eze", "Nwosu", "Afolabi", "Akin", "Adebayo", "Bello", "Chukwu", "Olawale", "Abiola", "Adeleke", "Akintunde", "Ogun", "Oladipo", "Oluwafemi", "Kanu", "Amadi", "Alao", "Abdullahi", "Suleiman", "Garba", "Lawal", "Olaniyi", "Fagbemi", "Ogunleye", "Akinlade", "Olowu", "Ifedayo", "Okeke", "Ugwu", "Nwachukwu", "Ibe", "Igwe", "Onyekachi", "Okonkwo", "Diya", "Akinyemi", "Adenuga", "Shittu", "Oseni", "Ajayi", "Ogunyemi", "Adebisi", "Oladunjoye", "Akinwale", "Olagunju", "Adewumi"],
    hometowns: ["Lagos", "Abuja", "Port Harcourt", "Kano", "Ibadan", "Enugu", "Kaduna", "Uyo", "Calabar", "Warri", "Jos", "Benin City", "Zaria", "Ilorin", "Ogbomosho", "Maiduguri", "Abeokuta", "Onitsha", "Owerri", "Sokoto"],
  },
  {
    country: "Ireland",
    flag: "🇮🇪",
    firstNames: ["Sean", "Liam", "Conor", "Aidan", "Declan", "Cian", "Rory", "Eoin", "Darragh", "Fionn", "Niall", "Cormac", "Oisin", "Ciaran", "Finn", "Tadhg", "Cathal", "Donnacha", "Ronan", "Kieran", "Enda", "Padraig", "Seamus", "Brendan", "Colm", "Dermot", "Eamon", "Fergal", "Garret", "Lorcan"],
    lastNames: ["Byrne", "Doyle", "Kelly", "Walsh", "Brennan", "Fitzgerald", "Duffy", "Nolan", "Hogan", "Reilly", "Connolly", "Maguire", "Fitzpatrick", "O'Brien", "O'Neill", "Ryan", "O'Sullivan", "McCarthy", "Murphy", "Gallagher", "Carroll", "Finn", "Lynch", "Cunningham", "Kavanagh", "Boyle", "Casey", "Flynn", "McGee", "Hickey"],
    hometowns: ["Dublin", "Cork", "Galway", "Limerick", "Waterford", "Sligo", "Belfast", "Derry", "Kilkenny", "Wexford", "Donegal", "Kerry", "Mayo", "Tipperary", "Clare"],
  },
  {
    country: "Russia",
    flag: "🇷🇺",
    firstNames: ["Dmitri", "Viktor", "Ivan", "Sergei", "Nikolai", "Pavel", "Yuri", "Anton", "Maxim", "Artem", "Oleg", "Roman", "Andrei", "Aleksei", "Mikhail", "Grigory", "Vasily", "Egor", "Stanislav", "Denis", "Vadim", "Ruslan", "Timur", "Marat", "Ramzan", "Magomed", "Shamil", "Rasul", "Umar", "Khamzat", "Muslim", "Zaur", "Anzor", "Rustam", "Apti", "Lom-Ali", "Said", "Adam", "Aslan", "Alikhan"],
    lastNames: ["Volkov", "Petrov", "Novak", "Sokolov", "Orlov", "Kuznetsov", "Popov", "Fedorov", "Belov", "Morozov", "Egorov", "Volin", "Kozlov", "Baranov", "Semyonov", "Titov", "Ivanov", "Smirnov", "Mikhailov", "Frolov", "Kravtsov", "Markov", "Pavlov", "Sokolov", "Sidorov", "Kuzmin", "Gromov", "Medvedev", "Alexandrov", "Vishnevsky", "Abdulov", "Cherkessov", "Dagestanov", "Grozny", "Makhachkala"],
    hometowns: ["Moscow", "Dagestan", "Khabarovsk", "Yekaterinburg", "Kazan", "Krasnodar", "St. Petersburg", "Novosibirsk", "Rostov", "Ufa", "Makhachkala", "Khasavyurt", "Derbent", "Buynaksk", "Nazran", "Gudermes", "Argun", "Shali", "Kizilyurt", "Kaspyisk"],
  },
  {
    country: "Japan",
    flag: "🇯🇵",
    firstNames: ["Kenji", "Hiroshi", "Takashi", "Yuto", "Ryo", "Daichi", "Kazuki", "Sora", "Haruto", "Riku", "Yamato", "Kaito", "Ryota", "Takeshi", "Naoto", "Sho", "Tomo", "Yuki", "Rei", "Kenshin", "Isamu", "Akihiro", "Jun", "Kiyoshi", "Masaki", "Noboru", "Osamu", "Shinji", "Tetsuya", "Yoshio"],
    lastNames: ["Tanaka", "Nakamura", "Sato", "Yamamoto", "Suzuki", "Takahashi", "Watanabe", "Kobayashi", "Ito", "Matsumoto", "Inoue", "Fujita", "Yoshida", "Ueda", "Kato", "Saito", "Abe", "Mori", "Kimura", "Harada", "Okada", "Nakagawa", "Murakami", "Aoki", "Kojima", "Yamashita", "Hasegawa", "Sakurai", "Nishimura", "Ogawa"],
    hometowns: ["Tokyo", "Osaka", "Nagoya", "Fukuoka", "Sapporo", "Kobe", "Kyoto", "Sendai", "Hiroshima", "Nagasaki", "Yokohama", "Kanazawa", "Kawasaki", "Niigata", "Okayama"],
  },
  {
    country: "Poland",
    flag: "🇵🇱",
    firstNames: ["Marek", "Tomasz", "Kamil", "Piotr", "Adrian", "Jakub", "Wojciech", "Bartosz", "Dawid", "Michal", "Krzysztof", "Rafal", "Pawel", "Lukasz", "Grzegorz", "Mateusz", "Karol", "Adam", "Jerzy", "Filip", "Patryk", "Dariusz", "Marcin", "Artur", "Sebastian", "Daniel", "Slawomir", "Jacek", "Zbigniew", "Kazimierz"],
    lastNames: ["Kowalski", "Nowak", "Wisniewski", "Wojcik", "Kaminski", "Lewandowski", "Zielinski", "Szymanski", "Dabrowski", "Kozlowski", "Jankowski", "Mazur", "Pawlak", "Krawczyk", "Michaelski", "Gorski", "Piatek", "Wrobel", "Kaczmarek", "Piotrowski", "Grabowski", "Baran", "Michalak", "Kowalczyk", "Wozniak", "Kwiatkowski", "Szewczyk", "Marciniak", "Czerwinski", "Krol"],
    hometowns: ["Warsaw", "Krakow", "Gdansk", "Wroclaw", "Poznan", "Lodz", "Katowice", "Szczecin", "Lublin", "Bydgoszcz", "Gdynia", "Bialystok", "Radom", "Torun", "Gliwice"],
  },
  {
    country: "Mexico",
    flag: "🇲🇽",
    firstNames: ["Alejandro", "Fernando", "Ricardo", "Emilio", "Gael", "Santiago", "Mateo", "Diego", "Rodrigo", "Ivan", "Adan", "Cesar", "Luis", "Jorge", "Hector", "Miguel", "Ramon", "Armando", "Salvador", "Javier", "Raul", "Arturo", "Oscar", "Eduardo", "Francisco", "Rogelio", "Guillermo", "Ruben", "Alfonso", "Joaquin"],
    lastNames: ["Hernandez", "Garcia", "Martinez", "Lopez", "Gonzalez", "Ramirez", "Torres", "Flores", "Vargas", "Rojas", "Mendez", "Cortez", "Gutierrez", "Luna", "Ortega", "Morales", "Cruz", "Diaz", "Castillo", "Reyes", "Mendoza", "Castro", "Romero", "Ramos", "Rivera", "Garza", "Vega", "Padilla", "Espinoza", "Nunez"],
    hometowns: ["Mexico City", "Guadalajara", "Monterrey", "Tijuana", "Puebla", "Merida", "Cancun", "Chihuahua", "Acapulco", "Leon", "Ciudad Juarez", "Veracruz", "Mexicali", "Culiacan", "Cuernavaca"],
  },
  {
    country: "Australia",
    flag: "🇦🇺",
    firstNames: ["Jack", "Liam", "Oliver", "Noah", "James", "Thomas", "William", "Lachlan", "Riley", "Harrison", "Cooper", "Hunter", "Jayden", "Tyler", "Brendan", "Dylan", "Travis", "Aaron", "Ryan", "Luke", "Jake", "Callum", "Angus", "Hamish", "Ethan", "Nathan", "Joshua", "Benjamin", "Samuel", "Daniel"],
    lastNames: ["Smith", "Jones", "Williams", "Brown", "Wilson", "Taylor", "Davies", "Evans", "Thomas", "Anderson", "Simpson", "O'Brien", "Walker", "Murray", "Cameron", "Stewart", "Mitchell", "Kelly", "Riley", "Campbell", "Parker", "Robinson", "Clark", "Harris", "Martin", "Thompson", "Grant", "Reid", "Ferguson", "Wright"],
    hometowns: ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Gold Coast", "Canberra", "Newcastle", "Wollongong", "Hobart", "Sunshine Coast", "Townsville", "Geelong", "Cairns", "Darwin"],
  },
  {
    country: "Canada",
    flag: "🇨🇦",
    firstNames: ["Ethan", "Mason", "Owen", "Lucas", "Logan", "Noah", "Benjamin", "Nathan", "Samuel", "Adam", "Jordan", "Tyler", "Ryan", "Kyle", "Dylan", "Evan", "Cameron", "Matthew", "Joshua", "Andrew", "Brendan", "Connor", "Aiden", "Carter", "Gavin", "Isaac", "Jayden", "Levi", "Caleb", "Hunter"],
    lastNames: ["MacDonald", "Campbell", "Wilson", "Thompson", "Anderson", "Stewart", "Miller", "Davis", "Martin", "Lee", "Robinson", "Clark", "White", "Harris", "Graham", "Johnston", "Ferguson", "Reid", "Murray", "Rose", "Simpson", "MacKenzie", "Grant", "Ross", "McDonald", "Morrison", "Davidson", "McKenzie", "Cameron", "Lindsay"],
    hometowns: ["Toronto", "Vancouver", "Montreal", "Calgary", "Edmonton", "Ottawa", "Hamilton", "Winnipeg", "Quebec City", "Halifax", "London", "Victoria", "Saskatoon", "St. John's", "Fredericton"],
  },
  {
    country: "South Korea",
    flag: "🇰🇷",
    firstNames: ["Minho", "Seokjin", "Jonghyun", "Hyunsoo", "Sanghoon", "Kangho", "Junseo", "Daehyun", "Joon", "Taemin", "Kyungsoo", "Wonbin", "Hyunsik", "Changmin", "Youngho", "Sungjae", "Jaehyun", "Donghae", "Kyuhyun", "Jinwoo", "Sungmin", "Kibum", "Jongin", "Heechul", "Leeteuk", "Siwon", "Donghae", "Ryeowook", "Yesung", "Kyuhyun"],
    lastNames: ["Kim", "Lee", "Park", "Choi", "Jung", "Kang", "Cho", "Yoon", "Jang", "Lim", "Han", "Oh", "Shin", "Seo", "Song", "Hwang", "Ahn", "Moon", "Ryu", "Jeon", "Bae", "Yoo", "Hong", "Jeon", "Gong", "Myung", "Eom", "Chun", "Kwon", "Yang"],
    hometowns: ["Seoul", "Busan", "Incheon", "Daegu", "Daejeon", "Gwangju", "Suwon", "Ulsan", "Jeju", "Changwon", "Seongnam", "Cheongju", "Pohang", "Jeonju", "Yeosu"],
  },
  {
    country: "China",
    flag: "🇨🇳",
    firstNames: ["Wei", "Ming", "Yong", "Hao", "Jie", "Jun", "Lei", "Peng", "Qiang", "Tao", "Feng", "Hui", "Kai", "Liang", "Ning", "Rui", "Shan", "Tian", "Yang", "Zhe", "Bo", "Cheng", "Hao", "Jian", "Kang", "Li", "Mei", "Ping", "Qing", "Wei"],
    lastNames: ["Wang", "Li", "Zhang", "Liu", "Chen", "Yang", "Huang", "Zhao", "Wu", "Zhou", "Xu", "Sun", "Ma", "Zhu", "Hu", "Guo", "Lin", "He", "Gao", "Luo", "Zheng", "Liang", "Song", "Tang", "Xu", "Feng", "Dong", "Xiao", "Cheng", "Deng"],
    hometowns: ["Beijing", "Shanghai", "Guangzhou", "Shenzhen", "Chengdu", "Tianjin", "Wuhan", "Hangzhou", "Chongqing", "Nanjing", "Xi'an", "Harbin", "Changchun", "Dalian", "Qingdao"],
  },
  {
    country: "England",
    flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    firstNames: ["Tom", "Harry", "Dan", "Alex", "Ben", "Joe", "George", "Jamie", "Jack", "Sam", "Luke", "Adam", "Matt", "Josh", "Dan", "Lee", "Rob", "Steve", "Dave", "Chris", "James", "Mike", "Will", "Tim", "Nick", "Karl", "Brad", "Craig", "Gavin", "Mark"],
    lastNames: ["Smith", "Jones", "Brown", "Taylor", "Davies", "Wilson", "Evans", "Thomas", "Williams", "Parker", "Harrison", "Walker", "Riley", "Clark", "Allen", "Cooper", "Phillips", "Campbell", "Mitchell", "Turner", "Johnson", "Lee", "Martin", "Jackson", "Thompson", "White", "Wright", "King", "Davis", "Green"],
    hometowns: ["London", "Manchester", "Birmingham", "Liverpool", "Leeds", "Sheffield", "Nottingham", "Newcastle", "Bristol", "Southampton", "Leicester", "Coventry", "Bradford", "Stoke", "Wolverhampton"],
  },
  {
    country: "France",
    flag: "🇫🇷",
    firstNames: ["Jean", "Pierre", "François", "Antoine", "Louis", "Thibault", "Julien", "Vincent", "Nicolas", "Philippe", "Thomas", "Mathieu", "Alexandre", "Sébastien", "Raphaël", "Baptiste", "Hugo", "Léon", "Gilles", "Emmanuel", "Yves", "Alain", "Bernard", "Daniel", "Etienne", "Guillaume", "Laurent", "Olivier", "Patrice", "Michel"],
    lastNames: ["Martin", "Bernard", "Dubois", "Thomas", "Robert", "Richard", "Petit", "Durand", "Leroy", "Moreau", "Simon", "Laurent", "Michel", "Garcia", "Fontaine", "Girard", "Rousseau", "Vincent", "Faure", "Andre", "Mercier", "Dupont", "Lambert", "Leclerc", "Legrand", "Roche", "Barbier", "Chevalier", "Blanchard", "Berger"],
    hometowns: ["Paris", "Marseille", "Lyon", "Toulouse", "Nice", "Nantes", "Bordeaux", "Lille", "Strasbourg", "Montpellier", "Rennes", "Saint-Étienne", "Le Havre", "Reims", "Angers"],
  },
  {
    country: "Italy",
    flag: "🇮🇹",
    firstNames: ["Marco", "Giuseppe", "Francesco", "Alessandro", "Matteo", "Lorenzo", "Davide", "Riccardo", "Simone", "Emanuele", "Federico", "Stefano", "Alessio", "Antonio", "Luca", "Daniele", "Andrea", "Edoardo", "Valerio", "Emilio", "Giacomo", "Nicola", "Vincenzo", "Silvio", "Mauro", "Fabio", "Alberto", "Pietro", "Domenico", "Giovanni"],
    lastNames: ["Rossi", "Russo", "Ferrari", "Esposito", "Bianchi", "Romano", "Colombo", "Ricci", "Marino", "Greco", "Bruno", "Gallo", "Conti", "De Luca", "Mancini", "Costa", "Giordano", "Rizzo", "Lombardi", "Moretti", "Monti", "Santoro", "Ferri", "De Santis", "Martini", "Rizzi", "Palumbo", "Vitale", "Marchetti", "Gatti"],
    hometowns: ["Rome", "Milan", "Naples", "Turin", "Palermo", "Genoa", "Bologna", "Florence", "Bari", "Venice", "Catania", "Verona", "Messina", "Trieste", "Padua"],
  },
  {
    country: "Netherlands",
    flag: "🇳🇱",
    firstNames: ["Jan", "Pieter", "Klaas", "Willem", "Maarten", "Thomas", "Daan", "Lucas", "Jasper", "Bram", "Michiel", "Jurgen", "Gijs", "Dirk", "Henk", "Joost", "Thijs", "Stefan", "Ruben", "Berend", "Niels", "Sander", "Erik", "Martijn", "Jeroen", "Arjan", "Joris", "Lars", "Bas", "Kees"],
    lastNames: ["de Vries", "Janssen", "van Dijk", "Bakker", "Visser", "de Boer", "Smit", "Meyer", "van der Meer", "de Bruijn", "Mulder", "Bos", "van der Velde", "Groot", "Peters", "Willems", "Dekker", "Peeters", "Brouwer", "Schipper", "Kramer", "van der Berg", "Mertens", "Vos", "Dijkstra", "Koning", "van der Veen", "Vermeulen", "Jacobs", "Wouters"],
    hometowns: ["Amsterdam", "Rotterdam", "The Hague", "Utrecht", "Eindhoven", "Groningen", "Nijmegen", "Haarlem", "Maastricht", "Leiden", "Delft", "'s-Hertogenbosch", "Arnhem", "Tilburg", "Almere"],
  },
  {
    country: "Cuba",
    flag: "🇨🇺",
    firstNames: ["Jorge", "Luis", "Juan", "Raúl", "Javier", "Carlos", "Alberto", "José", "Miguel", "Roberto", "Fernando", "Héctor", "Antonio", "Eduardo", "Manuel", "Sergio", "Rogelio", "Omar", "Rafael", "Angel", "Pedro", "Ramon", "Pablo", "Alejandro", "Ricardo", "Andres", "Domingo", "Esteban", "Ignacio", "Julian"],
    lastNames: ["Rodríguez", "García", "Martínez", "Hernández", "González", "Pérez", "Díaz", "Fernández", "Cabrera", "López", "Ramírez", "Torres", "Valdés", "Romero", "Mendoza", "Ortega", "Reyes", "Castillo", "Morales", "Cruz", "Gutiérrez", "Alvarez", "Rivera", "Rojas", "Vega", "Soto", "Santos", "Molina", "Castro", "Vargas"],
    hometowns: ["Havana", "Santiago", "Camagüey", "Holguín", "Santa Clara", "Cienfuegos", "Guantánamo", "Matanzas", "Ciego de Ávila", "Artemisa", "Pinar del Río", "Bayamo", "Las Tunas", "Sancti Spíritus", "Moa"],
  },
  {
    country: "Sweden",
    flag: "🇸🇪",
    firstNames: ["Erik", "Lars", "Anders", "Karl", "Johan", "Nils", "Per", "Magnus", "Sven", "Gustav", "Oscar", "Linus", "Mattias", "Emil", "Simon", "Fredrik", "Henrik", "Tomas", "Olof", "Peter", "Daniel", "Mikael", "Alexander", "Jakob", "Niklas", "Joel", "Marcus", "Viktor", "Filip", "Robin"],
    lastNames: ["Andersson", "Johansson", "Karlsson", "Nilsson", "Eriksson", "Larsson", "Olsson", "Persson", "Svensson", "Gustafsson", "Pettersson", "Jonsson", "Lindström", "Bergström", "Lindgren", "Lundgren", "Holm", "Sandberg", "Axelsson", "Blom", "Bergman", "Nilsson", "Hellström", "Lundqvist", "Sjögren", "Berg", "Löfgren", "Forsberg", "Kjellberg", "Nordström"],
    hometowns: ["Stockholm", "Gothenburg", "Malmö", "Uppsala", "Västerås", "Örebro", "Linköping", "Helsingborg", "Norrköping", "Lund", "Umeå", "Gävle", "Borås", "Eskilstuna", "Östersund"],
  },
  {
    country: "New Zealand",
    flag: "🇳🇿",
    firstNames: ["James", "Liam", "Oliver", "Jack", "George", "William", "Thomas", "Ethan", "Joshua", "Daniel", "Samuel", "Finn", "Matthew", "Jackson", "Luke", "Connor", "Nathan", "Jake", "Cameron", "Ryan", "Tane", "Hemi", "Matua", "Ari", "Kahu", "Tama", "Rangi", "Wiremu", "Manaia", "Tai"],
    lastNames: ["Smith", "Wilson", "Williams", "Brown", "Taylor", "Davies", "Jones", "Anderson", "Thompson", "Miller", "Harris", "Martin", "Robinson", "Clark", "Lee", "Walker", "Hall", "Scott", "Mitchell", "Grant", "Parker", "Adams", "Moore", "Turner", "White", "King", "Wright", "Murray", "Baker", "Russell"],
    hometowns: ["Auckland", "Wellington", "Christchurch", "Hamilton", "Dunedin", "Palmerston North", "Tauranga", "Napier", "Rotorua", "Queenstown", "Whangarei", "New Plymouth", "Invercargill", "Gisborne", "Taupo"],
  },
  {
    country: "Germany",
    flag: "🇩🇪",
    firstNames: ["Max", "Felix", "Lukas", "Jonas", "Tim", "Leon", "Julian", "Luca", "Jan", "Paul", "Finn", "Simon", "Moritz", "Tom", "Elias", "David", "Philipp", "Bastian", "Florian", "Tobias", "Niklas", "Christian", "Daniel", "Lennart", "Jannik", "Nico", "Marcel", "Robin", "Steffen", "Lars"],
    lastNames: ["Schmidt", "Schulz", "Müller", "Weber", "Wagner", "Fischer", "Meyer", "Bauer", "Klein", "Schäfer", "Hoffmann", "Schneider", "Richter", "Wolf", "Neumann", "Zimmermann", "Krause", "Lehmann", "Hartmann", "Frank", "Lange", "Beck", "Werner", "Schwarz", "Koch", "Bergmann", "Walter", "Braun", "Böhm", "Schmitt"],
    hometowns: ["Berlin", "Hamburg", "Munich", "Cologne", "Frankfurt", "Stuttgart", "Düsseldorf", "Leipzig", "Dortmund", "Bremen", "Dresden", "Hanover", "Nuremberg", "Essen", "Mannheim"],
  },
  {
    country: "Argentina",
    flag: "🇦🇷",
    firstNames: ["Santiago", "Lucas", "Facundo", "Mateo", "Juan", "Tomas", "Nicolas", "Alejandro", "Franco", "Lautaro", "Agustin", "Joaquin", "Bruno", "Martin", "Federico", "Gonzalo", "Ramiro", "Mauricio", "Ezequiel", "Cristian", "Adrian", "Dario", "Fabián", "Ignacio", "Leonel", "Nahuel", "Pablo", "Ramon", "Leandro", "Hernan"],
    lastNames: ["Gomez", "Fernandez", "Garcia", "Lopez", "Martinez", "Diaz", "Perez", "Sanchez", "Ramirez", "Torres", "Romero", "Flores", "Rivera", "Ramos", "Ortiz", "Castro", "Reyes", "Mendoza", "Gutierrez", "Ruiz", "Alvarez", "Morales", "Aguirre", "Castillo", "Gonzalez", "Rodriguez", "Vargas", "Rojas", "Salazar", "Herrera"],
    hometowns: ["Buenos Aires", "Córdoba", "Rosario", "Mendoza", "Tucumán", "Santa Fe", "Mar del Plata", "Neuquén", "Salta", "Paraná", "Resistencia", "Santiago del Estero", "Corrientes", "Bahía Blanca", "La Plata"],
  },
  {
    country: "Norway",
    flag: "🇳🇴",
    firstNames: ["Bjørn", "Erik", "Magnus", "Anders", "Hans", "Ole", "Lars", "Knut", "Jon", "Petter", "Sven", "Thomas", "Steinar", "Geir", "Haakon", "Morten", "Kristian", "Svein", "Per", "Arne", "Øyvind", "Tor", "Rune", "Åge", "Vidar", "Kåre", "Einar", "Nils", "Odd", "Terje"],
    lastNames: ["Hansen", "Johansen", "Olsen", "Larsen", "Andersen", "Pedersen", "Nilsen", "Kristiansen", "Jensen", "Karlsen", "Eriksen", "Iversen", "Berg", "Lunde", "Bakke", "Moen", "Haugen", "Nordby", "Dahl", "Sæther", "Solberg", "Knudsen", "Rønning", "Ulriksen", "Paulsen", "Evensen", "Jakobsen", "Tveit", "Aas", "Mikkelsen"],
    hometowns: ["Oslo", "Bergen", "Trondheim", "Stavanger", "Drammen", "Fredrikstad", "Kristiansand", "Sandnes", "Tromsø", "Tønsberg", "Ålesund", "Bodø", "Arendal", "Haugesund", "Porsgrunn"],
  },
  {
    country: "Denmark",
    flag: "🇩🇰",
    firstNames: ["Jens", "Lars", "Thomas", "Anders", "Morten", "Peter", "Niels", "Jacob", "Christian", "Michael", "Hans", "Mikael", "Carsten", "Rasmus", "Frederik", "Emil", "Oliver", "Mathias", "Daniel", "Jonas", "Nikolaj", "Simon", "Poul", "Henrik", "Søren", "Claus", "Ole", "Erik", "Kasper", "Mikkel"],
    lastNames: ["Jensen", "Nielsen", "Hansen", "Pedersen", "Andersen", "Christensen", "Larsen", "Sørensen", "Jørgensen", "Petersen", "Knudsen", "Johansen", "Madsen", "Mortensen", "Olsen", "Mikkelsen", "Thomsen", "Kristensen", "Rasmussen", "Møller", "Lund", "Schmidt", "Jakobsen", "Bech", "Bak", "Holm", "Bruun", "Kiær", "Friis", "Markussen"],
    hometowns: ["Copenhagen", "Aarhus", "Odense", "Aalborg", "Esbjerg", "Randers", "Kolding", "Horsens", "Herning", "Roskilde", "Vejle", "Silkeborg", "Næstved", "Fredericia", "Viborg"],
  },
  {
    country: "South Africa",
    flag: "🇿🇦",
    firstNames: ["Sipho", "Thabo", "Nelson", "Pieter", "Johan", "Hendrik", "Francois", "Andries", "Willem", "Liam", "Ethan", "Dylan", "Luke", "Matthew", "Ryan", "Daniel", "Cameron", "Trent", "Bradley", "Gareth", "Tendai", "Mandla", "Njabulo", "Kwame", "Bongani", "Lesedi", "Katlego", "Mpho", "Kagiso", "Tshepo"],
    lastNames: ["Botha", "Pieterse", "van der Merwe", "Coetzee", "du Plessis", "Visser", "Kruger", "Malan", "Smit", "Naidoo", "Govender", "Singh", "Reddy", "Jacobs", "Abrahams", "Fourie", "Mostert", "Pretorius", "Meyer", "Barnard", "Ndlovu", "Mkhize", "Mthembu", "Zulu", "Mokoena", "Dlamini", "Nkosi", "Mbatha", "Mkhwanazi", "Nyathi"],
    hometowns: ["Johannesburg", "Cape Town", "Durban", "Pretoria", "Port Elizabeth", "Bloemfontein", "East London", "Nelspruit", "Rustenburg", "Kimberley", "Polokwane", "Pietermaritzburg", "Mbombela", "Potchefstroom", "Vereeniging"],
  },
  {
    country: "Turkey",
    flag: "🇹🇷",
    firstNames: ["Mehmet", "Ali", "Ahmet", "Mustafa", "Hasan", "Hüseyin", "Osman", "Yusuf", "Emre", "Burak", "Tolga", "Serkan", "Okan", "Umut", "Can", "Mert", "Barış", "Onur", "Kaan", "Kerem", "Eren", "Berk", "Ege", "Deniz", "Arda", "Oğuz", "Erdem", "Bartu", "Yiğit", "Alp"],
    lastNames: ["Yılmaz", "Demir", "Kaya", "Çelik", "Şahin", "Aydın", "Özdemir", "Arslan", "Doğan", "Kılıç", "Aslan", "Kara", "Koç", "Erdem", "Güler", "Yıldırım", "Öztürk", "Aksoy", "Erdoğan", "Çetin", "Şimşek", "Tekin", "Akgün", "Aktaş", "Tuncer", "Güneş", "Kurt", "Polat", "Demirel", "Acar"],
    hometowns: ["Istanbul", "Ankara", "Izmir", "Bursa", "Antalya", "Adana", "Gaziantep", "Konya", "Diyarbakır", "Mersin", "Trabzon", "Erzurum", "Sivas", "Kayseri", "Malatya"],
  },
  {
    country: "Ukraine",
    flag: "🇺🇦",
    firstNames: ["Ivan", "Oleksandr", "Andriy", "Viktor", "Mykhailo", "Yaroslav", "Dmytro", "Serhiy", "Volodymyr", "Mykola", "Oleh", "Bogdan", "Yevhen", "Maxym", "Ostap", "Taras", "Ruslan", "Artem", "Pavlo", "Vitaliy", "Oleksiy", "Petro", "Sergiy", "Valeriy", "Leonid", "Roman", "Denys", "Yuriy", "Anatoliy", "Hryhoriy"],
    lastNames: ["Kovalenko", "Bondarenko", "Tkachenko", "Kravchenko", "Shevchenko", "Melnyk", "Boyko", "Didenko", "Ivanenko", "Polishchuk", "Lysenko", "Rudenko", "Mazur", "Kolisnyk", "Marusyk", "Hrytsenko", "Kovalchuk", "Savchenko", "Fedorenko", "Nazarenko", "Yefremov", "Pavlenko", "Voloshyn", "Tymoshenko", "Vasylenko", "Yakovenko", "Petrenko", "Stepanenko", "Andriyenko", "Zaychenko"],
    hometowns: ["Kyiv", "Kharkiv", "Dnipro", "Odesa", "Donetsk", "Lviv", "Zaporizhzhia", "Vinnytsia", "Ivano-Frankivsk", "Khmelnytskyi", "Mariupol", "Chernihiv", "Sumy", "Ternopil", "Uzhhorod"],
  },
  {
    country: "Kazakhstan",
    flag: "🇰🇿",
    firstNames: ["Nursultan", "Bekzat", "Dastan", "Aisultan", "Nurkhan", "Almas", "Temirlan", "Maksat", "Ruslan", "Yerzhan", "Zhanibek", "Azamat", "Berik", "Kairat", "Arman", "Nurlan", "Rinat", "Erik", "Daniyar", "Abay", "Aman", "Askar", "Bakhyt", "Gani", "Marat", "Mukhtar", "Oleg", "Serik", "Timur", "Yerbol"],
    lastNames: ["Nazarov", "Kazbekov", "Smagulov", "Turgunov", "Abdullin", "Akhmetov", "Bekmuratov", "Dauletov", "Esenov", "Galiev", "Ismailov", "Jandosov", "Karimov", "Lukmanov", "Mukhametov", "Niyazov", "Ospanov", "Pulatov", "Rakhimov", "Sadykov", "Tulegenov", "Umarov", "Valiev", "Yakubov", "Zhanabekov", "Ibragimov", "Kenzhebayev", "Mametov", "Omirzakov", "Serikbayev"],
    hometowns: ["Astana", "Almaty", "Karaganda", "Aktobe", "Atyrau", "Shymkent", "Kostanay", "Pavlodar", "Semey", "Uralsk", "Taldykorgan", "Petropavl", "Zhezkazgan", "Oral", "Aktau"],
  },
  {
    country: "Georgia",
    flag: "🇬🇪",
    firstNames: ["Giorgi", "Nika", "Sandro", "Lasha", "Vakhtang", "Zurab", "Levan", "Merab", "Irakli", "Kakhaber", "Tengiz", "Dato", "Avtandil", "Badri", "Giga", "Jaba", "Koba", "Lukas", "Mamuka", "Nodar", "Otar", "Paata", "Ramaz", "Shota", "Tariel", "Ucha", "Vano", "Zaza", "Gela", "Revaz"],
    lastNames: ["Tsiklauri", "Maisuradze", "Kajaia", "Dolidze", "Bregadze", "Kavtaradze", "Tchavtchavadze", "Javakhishvili", "Mekvabishvili", "Giorgobiani", "Zoidze", "Jorjadze", "Mikadze", "Phutkaradze", "Avaliani", "Chanturia", "Gigolashvili", "Khutsishvili", "Kvaratskhelia", "Lomidze", "Mchedlishvili", "Nozadze", "Pirveli", "Robakidze", "Samkharadze", "Tvalchrelidze", "Ubilava", "Varazi", "Tskhovrebadze", "Svanidze"],
    hometowns: ["Tbilisi", "Kutaisi", "Batumi", "Rustavi", "Poti", "Gori", "Kobuleti", "Samtredia", "Mtskheta", "Telavi", "Akhaltsikhe", "Ozurgeti", "Zestaponi", "Khoni", "Sagarejo"],
  },
];

export function randomCountryProfile(): CountryProfile {
  return COUNTRY_PROFILES[Math.floor(Math.random() * COUNTRY_PROFILES.length)];
}
