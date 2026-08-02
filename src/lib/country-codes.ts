const COUNTRY_NAME_TO_ISO: Record<string, string> = {
  "Afghanistan": "004", "Albania": "008", "Algeria": "012", "Angola": "024",
  "Argentina": "032", "Armenia": "051", "Australia": "036", "Austria": "040",
  "Azerbaijan": "031", "Bahamas": "044", "Bahrain": "048", "Bangladesh": "050",
  "Belarus": "112", "Belgium": "056", "Belize": "084", "Benin": "204",
  "Bhutan": "064", "Bolivia": "068", "Bosnia and Herzegovina": "070", "Botswana": "072",
  "Brazil": "076", "Brunei": "096", "Bulgaria": "100", "Burkina Faso": "854",
  "Burundi": "108", "Cambodia": "116", "Cameroon": "120", "Canada": "124",
  "Central Global Republic": "140", "Chad": "148", "Chile": "152", "China": "156",
  "Colombia": "170", "Comoros": "174", "Congo": "178", "Costa Rica": "188",
  "Croatia": "191", "Cuba": "192", "Cyprus": "196", "Czech Republic": "203",
  "Denmark": "208", "Djibouti": "262", "Dominican Republic": "214", "Ecuador": "218",
  "Egypt": "818", "El Salvador": "222", "Equatorial Guinea": "226", "Eritrea": "232",
  "Estonia": "233", "Ethiopia": "231", "Fiji": "242", "Finland": "246",
  "France": "250", "Gabon": "266", "Gambia": "270", "Georgia": "268",
  "Germany": "276", "Ghana": "288", "Greece": "300", "Guatemala": "320",
  "Guinea": "324", "Guinea-Bissau": "624", "Guyana": "328", "Haiti": "332",
  "Honduras": "340", "Hungary": "348", "Iceland": "352", "India": "356",
  "Indonesia": "360", "Iran": "364", "Iraq": "368", "Ireland": "372",
  "Israel": "376", "Italy": "380", "Jamaica": "388", "Japan": "392",
  "Jordan": "400", "Kazakhstan": "398", "Kenya": "404", "Kuwait": "414",
  "Kyrgyzstan": "417", "Laos": "418", "Latvia": "428", "Lebanon": "422",
  "Lesotho": "426", "Liberia": "430", "Libya": "434", "Lithuania": "440",
  "Luxembourg": "442", "Madagascar": "450", "Malawi": "454", "Malaysia": "458",
  "Mali": "466", "Malta": "470", "Mauritania": "478", "Mauritius": "480",
  "Mexico": "484", "Moldova": "498", "Monaco": "492", "Mongolia": "496",
  "Montenegro": "499", "Morocco": "504", "Mozambique": "508", "Myanmar": "104",
  "Namibia": "516", "Nepal": "524", "Netherlands": "528", "New Zealand": "554",
  "Nicaragua": "558", "Niger": "562", "Nigeria": "566", "North Korea": "408",
  "North Macedonia": "807", "Norway": "578", "Oman": "512", "Pakistan": "586",
  "Panama": "591", "Papua New Guinea": "598", "Paraguay": "600", "Peru": "604",
  "Philippines": "608", "Poland": "616", "Portugal": "620", "Qatar": "634",
  "Romania": "642", "Russia": "643", "Rwanda": "646", "Saudi Arabia": "682",
  "Senegal": "686", "Serbia": "688", "Sierra Leone": "694", "Singapore": "702",
  "Slovakia": "703", "Slovenia": "705", "Somalia": "706", "South Africa": "710",
  "South Korea": "410", "South Sudan": "728", "Spain": "724", "Sri Lanka": "144",
  "Sudan": "729", "Suriname": "740", "Sweden": "752", "Switzerland": "756",
  "Syria": "760", "Taiwan": "158", "Tajikistan": "762", "Tanzania": "834",
  "Thailand": "764", "Togo": "768", "Trinidad and Tobago": "780", "Tunisia": "788",
  "Turkey": "792", "Turkmenistan": "795", "Uganda": "800", "Ukraine": "804",
  "United Arab Emirates": "784", "United Kingdom": "826", "United States": "840",
  "Uruguay": "858", "Uzbekistan": "860", "Venezuela": "862", "Vietnam": "704",
  "Yemen": "887", "Zambia": "894", "Zimbabwe": "716",
  "Republic of the Congo": "178", "Democratic Republic of the Congo": "180",
  "Ivory Coast": "384", "Cote d'Ivoire": "384", "Timor-Leste": "626",
  "East Timor": "626", "Swaziland": "748", "Eswatini": "748",
  "Cape Verde": "132", "Cabo Verde": "132", "Burma": "104",
  "Micronesia": "583", "Vatican City": "336",
  "West Bank": "275", "Gaza Strip": "275", "Palestine": "275",
  "Somaliland": "706", "Kosovo": "-99", "N. Cyprus": "275",
  "Northern Cyprus": "275", "Falkland Islands": "238", "Falkland Islands (Islas Malvinas)": "238",
};

export function getCountryId(name: string): string | undefined {
  return COUNTRY_NAME_TO_ISO[name];
}

export function getCountryName(id: string): string | undefined {
  for (const [name, code] of Object.entries(COUNTRY_NAME_TO_ISO)) {
    if (code === id) return name;
  }
  return undefined;
}
