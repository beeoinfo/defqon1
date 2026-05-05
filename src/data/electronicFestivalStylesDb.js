/**
 * Electronic festival style database for lineup enrichment.
 *
 * Each entry in this database defines a festival artist and the styles associated with them.
 * The structure is designed for use in enrichment workflows (e.g., tagging lineups with genre filters).
 *
 * Properties:
 *   artistToken (string): Unique slug identifier for the artist.
 *   artistName  (string): Display name of the artist.
 *   mainTags    (string[]): Up to three primary style tags. Allowed values:
 *     Hardstyle, Rawstyle, Hardcore, Uptempo, Frenchcore, Terrorcore, Speedcore,
 *     Hard Techno, Techno, Electro, Tekno, Trance, Psytrance, House, D&B, Dubstep,
 *     Rave, Hard Dance, Jumpstyle, Acid, Acidcore, Metalcore, Deathcore, Darkcore
 *
 *   additionalTag (string|null): Optional secondary tag used only when at least one
 *     main tag is present. Allowed values:
 *     Electronic, Industrial, Metal, Rock, Punk, Rap, Hip-Hop, Pop, RnB, K-Pop,
 *     90s, Minimal
 */
export const ELECTRONIC_FESTIVAL_STYLES_DB = [
  {
    "artistToken": "15-years-of-spoontech",
    "artistName": "15 Years of Spoontech",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "25-years",
    "artistName": "25 years",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "25-years-of-heartstyle",
    "artistName": "25 Years of Heartstyle",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "2faced",
    "artistName": "2Faced",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "2hot2play",
    "artistName": "2HOT2PLAY",
    "mainTags": [
      "Techno",
      "Trance",
      "Hard Dance"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "4444-of-a-kind",
    "artistName": "4444 of a Kind",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "99prblmz",
    "artistName": "99PRBLMZ",
    "mainTags": [
      "Uptempo",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "a-k",
    "artistName": "a K",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "a-lusion",
    "artistName": "A-lusion",
    "mainTags": [
      "Hardstyle",
      "Jumpstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "a-s-y-s",
    "artistName": "A*S*Y*S",
    "mainTags": [
      "Hardstyle",
      "Acid",
      "Trance"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "a5km",
    "artistName": "A5KM",
    "mainTags": [
      "Hard Techno",
      "Techno"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "aalst",
    "artistName": "Aalst",
    "mainTags": [
      "Uptempo",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "abaddon",
    "artistName": "Abaddon",
    "mainTags": [
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "abraxas",
    "artistName": "Abraxas",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "acidpach",
    "artistName": "Acidpach",
    "mainTags": [
      "Tekno",
      "Acidcore",
      "Acid"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "act-of-rage",
    "artistName": "Act of Rage",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "acti",
    "artistName": "ACTI",
    "mainTags": [
      "Hardstyle",
      "Hard Dance"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "activate",
    "artistName": "Activate",
    "mainTags": [
      "Hardstyle",
      "Hard Dance"
    ],
    "additionalTag": "90s"
  },
  {
    "artistToken": "activator",
    "artistName": "Activator",
    "mainTags": [
      "Hardstyle",
      "Hard Dance"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "adaro",
    "artistName": "Adaro",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "adjuzt",
    "artistName": "Adjuzt",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "adrenalize",
    "artistName": "Adrenalize",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "afterdeath",
    "artistName": "AFTERDEATH",
    "mainTags": [
      "Hard Techno",
      "Techno"
    ],
    "additionalTag": "Industrial"
  },
  {
    "artistToken": "akimbo",
    "artistName": "Akimbo",
    "mainTags": [
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "akira",
    "artistName": "Akira",
    "mainTags": [
      "Speedcore",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "album-showcase",
    "artistName": "Album Showcase",
    "mainTags": [
      "Hardstyle",
      "Uptempo",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "alee",
    "artistName": "Alee",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "alex-kidd",
    "artistName": "Alex Kidd",
    "mainTags": [
      "Trance",
      "Hard Dance"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "alpha-twins",
    "artistName": "Alpha Twins",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "alphaverb",
    "artistName": "Alphaverb",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "altijd-larstig",
    "artistName": "Altijd Larstig",
    "mainTags": [
      "Hardstyle",
      "Hard Dance"
    ],
    "additionalTag": "Pop"
  },
  {
    "artistToken": "amduscias",
    "artistName": "Amduscias",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "amigo",
    "artistName": "Amigo",
    "mainTags": [
      "Techno"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "amnesys",
    "artistName": "Amnesys",
    "mainTags": [
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "amor",
    "artistName": "Amor",
    "mainTags": [
      "Hardcore",
      "Metalcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "anamorphic",
    "artistName": "Anamorphic",
    "mainTags": [
      "Trance"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "anderex",
    "artistName": "Anderex",
    "mainTags": [
      "Rawstyle",
      "Hardstyle",
      "Acid"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "anduj",
    "artistName": "ANDUJ",
    "mainTags": [
      "Hard Techno",
      "Trance"
    ],
    "additionalTag": "Industrial"
  },
  {
    "artistToken": "angerfist",
    "artistName": "Angerfist",
    "mainTags": [
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "anime",
    "artistName": "Anime",
    "mainTags": [
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "aphotic",
    "artistName": "APHØTIC",
    "mainTags": [
      "Techno",
      "Rave"
    ],
    "additionalTag": "Industrial"
  },
  {
    "artistToken": "aradia",
    "artistName": "Aradia",
    "mainTags": [
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "aranxa",
    "artistName": "Aranxa",
    "mainTags": [
      "Hardstyle",
      "House",
      "Electro"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "arcando",
    "artistName": "Arcando",
    "mainTags": [
      "D&B",
      "Electro"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "area-ne",
    "artistName": "AREA ØNE",
    "mainTags": [
      "Techno",
      "Hard Dance"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "argy",
    "artistName": "Argy",
    "mainTags": [
      "Techno",
      "House"
    ],
    "additionalTag": "Minimal"
  },
  {
    "artistToken": "ark8",
    "artistName": "ARK8",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "arman-john",
    "artistName": "Arman John",
    "mainTags": [
      "Hard Techno",
      "Techno",
      "Trance"
    ],
    "additionalTag": "Industrial"
  },
  {
    "artistToken": "art-of-fighters",
    "artistName": "Art of Fighters",
    "mainTags": [
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "artic",
    "artistName": "Artic",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "ascendant-vierge",
    "artistName": "ASCENDANT VIERGE",
    "mainTags": [
      "Trance",
      "Hard Dance",
      "D&B"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "asys",
    "artistName": "A*S*Y*S",
    "mainTags": [
      "Hardstyle",
      "Acid",
      "Trance"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "atjoow-show",
    "artistName": "Atjoow Show",
    "mainTags": [
      "Hardstyle",
      "Hard Dance"
    ],
    "additionalTag": "Pop"
  },
  {
    "artistToken": "atmos",
    "artistName": "Atmos",
    "mainTags": [
      "Trance",
      "Psytrance"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "atmozfears",
    "artistName": "Atmozfears",
    "mainTags": [
      "Hardstyle",
      "Trance",
      "Hard Dance"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "audiofreq",
    "artistName": "Audiofreq",
    "mainTags": [
      "Hardstyle",
      "House",
      "Electro"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "audiotricz",
    "artistName": "Audiotricz",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "aversion",
    "artistName": "Aversion",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "avi8",
    "artistName": "AVI8",
    "mainTags": [
      "Hardstyle",
      "House",
      "Electro"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "avvy",
    "artistName": "aVVy",
    "mainTags": [
      "D&B"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "b-front",
    "artistName": "B-Front",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "b-frontliner",
    "artistName": "B-Frontliner",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "back-to-the-roots",
    "artistName": "Back To The Roots",
    "mainTags": [
      "Hardstyle",
      "Uptempo",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "balistic",
    "artistName": "Balistic",
    "mainTags": [
      "Hardstyle",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "barbaric-records-live",
    "artistName": "Barbaric Records LIVE",
    "mainTags": [
      "Uptempo",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "barber",
    "artistName": "Barber",
    "mainTags": [
      "Uptempo",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "barricade",
    "artistName": "Barricade",
    "mainTags": [
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "bass-chaserz",
    "artistName": "Bass Chaserz",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "bass-chaserz-special",
    "artistName": "Bass Chaserz Special",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "bass-d",
    "artistName": "Bass-D",
    "mainTags": [
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "bass-modulators",
    "artistName": "Bass Modulators",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "bass-modulators-rewind",
    "artistName": "Bass Modulators Rewind",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "basstripper",
    "artistName": "BASSTRIPPER",
    "mainTags": [
      "D&B"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "ben-nicky-presents-xtreme",
    "artistName": "Ben Nicky presents Xtreme",
    "mainTags": [
      "Hardstyle",
      "Trance",
      "Hard Dance"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "bennett",
    "artistName": "Bennett",
    "mainTags": [
      "Techno"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "billx",
    "artistName": "Billx",
    "mainTags": [
      "Hard Techno",
      "Frenchcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "bioweapon",
    "artistName": "Bioweapon",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "blakeys",
    "artistName": "BLAKEYS",
    "mainTags": [
      "Hard Techno",
      "Acid",
      "Rave"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "blasty",
    "artistName": "BLASTY",
    "mainTags": [
      "Hard Techno",
      "Techno",
      "Trance"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "blnk",
    "artistName": "BLNK",
    "mainTags": [
      "Hard Techno",
      "Techno"
    ],
    "additionalTag": "Industrial"
  },
  {
    "artistToken": "bloodlust",
    "artistName": "Bloodlust",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "bloodlust-d-sturb-warface",
    "artistName": "Bloodlust, D-Sturb, Warface",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "bmberjck",
    "artistName": "BMBERJCK",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "bodru",
    "artistName": "BØDRU",
    "mainTags": [
      "Hard Techno",
      "Techno"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "bold-action",
    "artistName": "Bold Action",
    "mainTags": [
      "Hardstyle",
      "Techno",
      "Hard Dance"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "boogshe",
    "artistName": "Boogshe",
    "mainTags": [
      "Hardstyle",
      "Hardcore"
    ],
    "additionalTag": "Rap"
  },
  {
    "artistToken": "brennan-heart",
    "artistName": "Brennan Heart",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "brk3-aka-audiofreq",
    "artistName": "BRK3 aka Audiofreq",
    "mainTags": [
      "Hardstyle",
      "Hardcore",
      "Hard Techno"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "bruhze",
    "artistName": "Bruhze",
    "mainTags": [
      "Terrorcore",
      "Speedcore",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "bulletproof",
    "artistName": "Bulletproof",
    "mainTags": [
      "D&B",
      "Dubstep"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "buzz-fuzz",
    "artistName": "Buzz Fuzz",
    "mainTags": [
      "Hardcore",
      "Rave"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "byorn",
    "artistName": "Byorn",
    "mainTags": [
      "Hard Techno",
      "Techno"
    ],
    "additionalTag": "Industrial"
  },
  {
    "artistToken": "c-joo",
    "artistName": "C-JOO",
    "mainTags": [
      "D&B"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "captivator",
    "artistName": "Captivator",
    "mainTags": [
      "Metalcore",
      "Deathcore"
    ],
    "additionalTag": "Metal"
  },
  {
    "artistToken": "cara-elizabeth",
    "artistName": "Cara Elizabeth",
    "mainTags": [
      "Trance",
      "Hard Dance"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "caravel",
    "artistName": "Caravel",
    "mainTags": [
      "Hard Techno",
      "Techno",
      "Acid"
    ],
    "additionalTag": "Industrial"
  },
  {
    "artistToken": "cardination",
    "artistName": "Cardination",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "catalyst",
    "artistName": "Catalyst",
    "mainTags": [
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "catscan",
    "artistName": "Catscan",
    "mainTags": [
      "Hardcore",
      "Darkcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "cem",
    "artistName": "Cem",
    "mainTags": [
      "Techno"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "chain-reaction",
    "artistName": "Chain Reaction",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "chaotic-hostility",
    "artistName": "Chaotic Hostility",
    "mainTags": [
      "Uptempo",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "chapter-v",
    "artistName": "Chapter V",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "chapter-vasto",
    "artistName": "Chapter Vasto",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "charlie-sparks",
    "artistName": "Charlie Sparks",
    "mainTags": [
      "Hard Techno",
      "Techno",
      "Trance"
    ],
    "additionalTag": "Industrial"
  },
  {
    "artistToken": "charly-lownoise",
    "artistName": "Charly Lownoise",
    "mainTags": [
      "Hardcore",
      "Rave",
      "Trance"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "clement-matrat",
    "artistName": "CLÉMENT MATRAT",
    "mainTags": [
      "Electro"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "clive-king",
    "artistName": "Clive King",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "code-black",
    "artistName": "Code Black",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "cold-confusion",
    "artistName": "Cold Confusion",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "coldax",
    "artistName": "Coldax",
    "mainTags": [
      "Uptempo",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "combined-forces",
    "artistName": "Combined Forces",
    "mainTags": [
      "Uptempo",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "complex",
    "artistName": "Complex",
    "mainTags": [
      "Uptempo",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "consequent",
    "artistName": "Consequent",
    "mainTags": [
      "Hardstyle",
      "Hard Dance"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "coone",
    "artistName": "Coone",
    "mainTags": [
      "Hardstyle",
      "Jumpstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "creeds",
    "artistName": "Creeds",
    "mainTags": [
      "Hard Techno",
      "Techno",
      "Rave"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "critical-mass",
    "artistName": "Critical Mass",
    "mainTags": [
      "Hardcore",
      "Rave"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "cro",
    "artistName": "CRO",
    "mainTags": [
      "Hardstyle",
      "Hardcore"
    ],
    "additionalTag": "Rap"
  },
  {
    "artistToken": "cryex",
    "artistName": "Cryex",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "cryogenic",
    "artistName": "Cryogenic",
    "mainTags": [
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "crypsis",
    "artistName": "Crypsis",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "cut-sphere",
    "artistName": "Cut Sphere",
    "mainTags": [
      "Hard Dance",
      "Jumpstyle",
      "Rave"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "cyber",
    "artistName": "Cyber",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": "Industrial"
  },
  {
    "artistToken": "cyber-gunz",
    "artistName": "Cyber Gunz",
    "mainTags": [
      "Uptempo",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "cybergore",
    "artistName": "CYBERGORE",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": "Metal"
  },
  {
    "artistToken": "cynthia-spiering",
    "artistName": "Cynthia Spiering",
    "mainTags": [
      "Techno",
      "Hard Techno"
    ],
    "additionalTag": "Industrial"
  },
  {
    "artistToken": "d-block",
    "artistName": "D-Block",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "d-charged",
    "artistName": "D-Charged",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "d-fence",
    "artistName": "D-Fence",
    "mainTags": [
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "d-frek",
    "artistName": "D-Frek",
    "mainTags": [
      "Frenchcore",
      "Hardcore",
      "Tekno"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "d-ort",
    "artistName": "D'Ort",
    "mainTags": [
      "Frenchcore",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "d-sturb",
    "artistName": "D-Sturb",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "d-venn",
    "artistName": "D-Venn",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "d00d",
    "artistName": "D00d",
    "mainTags": [
      "Hard Dance"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "da-mouth-of-madness",
    "artistName": "Da Mouth of Madness",
    "mainTags": [
      "Hardcore",
      "House",
      "Electro"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "da-syndrome",
    "artistName": "Da Syndrome",
    "mainTags": [
      "Hardstyle",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "da-tweekaz",
    "artistName": "Da Tweekaz",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "daani",
    "artistName": "DAANI",
    "mainTags": [
      "Hardstyle",
      "Hard Dance"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "dae",
    "artistName": "DAE",
    "mainTags": [
      "Hard Techno",
      "Techno"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "dano",
    "artistName": "Dano",
    "mainTags": [
      "Hardcore",
      "Rave"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "daria-kolosova",
    "artistName": "Daria Kolosova",
    "mainTags": [
      "Hardcore",
      "Techno",
      "Electro"
    ],
    "additionalTag": "Industrial"
  },
  {
    "artistToken": "dark-e",
    "artistName": "Dark-E",
    "mainTags": [
      "Hardstyle",
      "Jumpstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "dark-energy",
    "artistName": "Dark Energy",
    "mainTags": [
      "Techno"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "dark-entities",
    "artistName": "Dark Entities",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "darren-styles",
    "artistName": "Darren Styles",
    "mainTags": [
      "Hardcore",
      "Hard Dance"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "david-bouts",
    "artistName": "DAVID BOUTS",
    "mainTags": [
      "Hard Techno",
      "Techno",
      "Trance"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "david-forbes",
    "artistName": "David Forbes",
    "mainTags": [
      "Trance",
      "Hard Dance"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "davide-sonar",
    "artistName": "Davide Sonar",
    "mainTags": [
      "Hardstyle",
      "Jumpstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "day-mar-20-years",
    "artistName": "Day-Mar 20 Years",
    "mainTags": [
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "de-kraaien",
    "artistName": "De Kraaien",
    "mainTags": [
      "Electro"
    ],
    "additionalTag": "Hip-Hop"
  },
  {
    "artistToken": "de-uptempolonaise-by-gezellige-uptempo",
    "artistName": "De Uptempolonaise by Gezellige Uptempo",
    "mainTags": [
      "Uptempo",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "deadly-guns",
    "artistName": "Deadly Guns",
    "mainTags": [
      "Uptempo",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "deathmachine",
    "artistName": "Deathmachine",
    "mainTags": [
      "Hardcore",
      "Darkcore"
    ],
    "additionalTag": "Industrial"
  },
  {
    "artistToken": "deepack",
    "artistName": "Deepack",
    "mainTags": [
      "Hardstyle",
      "Jumpstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "deepack-35-years-special",
    "artistName": "Deepack 35 Years Special",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "deetox",
    "artistName": "Deetox",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "deezl",
    "artistName": "DEEZL",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "defqon-1-legends",
    "artistName": "Defqon.1 Legends",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "degos",
    "artistName": "Degos",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "deluzion",
    "artistName": "Deluzion",
    "mainTags": [
      "Hardstyle",
      "House",
      "Electro"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "demi-kanon",
    "artistName": "Demi Kanon",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "densha-crisis",
    "artistName": "Densha Crisis",
    "mainTags": [
      "Hardcore",
      "Darkcore"
    ],
    "additionalTag": "Industrial"
  },
  {
    "artistToken": "destructive-tendencies",
    "artistName": "Destructive Tendencies",
    "mainTags": [
      "Hardcore",
      "Uptempo"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "desudo",
    "artistName": "Desudo",
    "mainTags": [
      "Hardstyle",
      "Hardcore",
      "Hard Techno"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "detailed",
    "artistName": "Detailed",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "devin-wild",
    "artistName": "Devin Wild",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "dice",
    "artistName": "DICE",
    "mainTags": [
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "digital-madness",
    "artistName": "Digital Madness",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "digital-punk",
    "artistName": "Digital Punk",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "dikke-baap",
    "artistName": "Dikke Baap",
    "mainTags": [
      "Hard Techno",
      "Techno"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "dimitri-k",
    "artistName": "Dimitri K",
    "mainTags": [
      "Uptempo",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "dimma",
    "artistName": "Dimma",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "disrupt-tchai",
    "artistName": "DISRUPT TCHAÏ",
    "mainTags": [
      "Hard Techno",
      "Techno",
      "Trance"
    ],
    "additionalTag": "Industrial"
  },
  {
    "artistToken": "distress",
    "artistName": "Distress",
    "mainTags": [
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "dither",
    "artistName": "Dither",
    "mainTags": [
      "Hardcore"
    ],
    "additionalTag": "Industrial"
  },
  {
    "artistToken": "dither-is-g-a-b-b-e-r",
    "artistName": "Dither IS G.A.B.B.E.R",
    "mainTags": [
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "ditzkickz",
    "artistName": "Ditzkickz",
    "mainTags": [
      "Uptempo",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "dj-ghost",
    "artistName": "DJ Ghost",
    "mainTags": [
      "Hardstyle",
      "Hard Dance"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "dj-isaac",
    "artistName": "DJ Isaac",
    "mainTags": [
      "Hardstyle",
      "Hardcore",
      "Jumpstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "dj-j-d-a",
    "artistName": "DJ J.D.A",
    "mainTags": [
      "Hardcore",
      "Rave"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "dj-jda",
    "artistName": "DJ J.D.A.",
    "mainTags": [
      "Hardcore",
      "Rave"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "dj-pila",
    "artistName": "DJ Pila",
    "mainTags": [
      "Hardstyle",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "dj-princesse",
    "artistName": "DJ PRINCESSE",
    "mainTags": [
      "Hard Techno",
      "Techno",
      "Trance"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "dj-rob",
    "artistName": "DJ Rob",
    "mainTags": [
      "Hardcore",
      "Rave"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "dj-ruffian",
    "artistName": "DJ Ruffian",
    "mainTags": [
      "Hardstyle",
      "Hardcore",
      "D&B"
    ],
    "additionalTag": "Hip-Hop"
  },
  {
    "artistToken": "dj-stephanie",
    "artistName": "DJ Stephanie",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "dj-thera",
    "artistName": "DJ Thera",
    "mainTags": [
      "Hardstyle",
      "Acid",
      "Trance"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "dj-thera-tranceparency-set",
    "artistName": "DJ Thera Tranceparency Set",
    "mainTags": [
      "Hard Techno",
      "Trance",
      "Hard Dance"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "djdave",
    "artistName": "DJ_Dave",
    "mainTags": [
      "House",
      "Electro"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "dl",
    "artistName": "DL",
    "mainTags": [
      "House",
      "Electro"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "dln",
    "artistName": "DLN",
    "mainTags": [
      "Hard Techno",
      "Techno",
      "Trance"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "dna",
    "artistName": "DNA",
    "mainTags": [
      "Hardstyle",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "dolphin",
    "artistName": "Dolphin",
    "mainTags": [
      "Hardcore",
      "Darkcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "donkey-rollers",
    "artistName": "Donkey Rollers",
    "mainTags": [
      "Hardstyle",
      "Trance"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "doris",
    "artistName": "Doris",
    "mainTags": [
      "Hard Techno",
      "Techno"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "double-trouble",
    "artistName": "Double Trouble",
    "mainTags": [
      "Hardcore"
    ],
    "additionalTag": "Hip-Hop"
  },
  {
    "artistToken": "dr-donk",
    "artistName": "Dr Donk",
    "mainTags": [
      "Uptempo",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "dr-peacock",
    "artistName": "Dr. Peacock",
    "mainTags": [
      "Frenchcore",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "dr-rude",
    "artistName": "Dr. Rude",
    "mainTags": [
      "Hardstyle",
      "Hard Dance",
      "Jumpstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "dr-rude-jump-classics",
    "artistName": "Dr. Rude Jump classics",
    "mainTags": [
      "Hardstyle",
      "Hard Dance",
      "Jumpstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "dr-z",
    "artistName": "Dr. Z",
    "mainTags": [
      "Hard Techno",
      "Techno"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "drs",
    "artistName": "DRS",
    "mainTags": [
      "D&B"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "drz",
    "artistName": "Dr.Z",
    "mainTags": [
      "Hard Techno",
      "Techno"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "dual-damage",
    "artistName": "Dual Damage",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "dune",
    "artistName": "Dune",
    "mainTags": [
      "Hardcore",
      "Rave"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "dv8",
    "artistName": "DV8",
    "mainTags": [
      "House",
      "Electro"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "dvaid",
    "artistName": "DVAID",
    "mainTags": [
      "Hard Techno",
      "Techno",
      "Acid"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "dvin",
    "artistName": "DÂVINØ",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "dynamic-noise",
    "artistName": "Dynamic Noise",
    "mainTags": [
      "House",
      "Electro"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "e-force",
    "artistName": "E-Force",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "earsquaker",
    "artistName": "Earsquaker",
    "mainTags": [
      "Hardstyle",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "ecstatic",
    "artistName": "Ecstatic",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "eczodia",
    "artistName": "Eczodia",
    "mainTags": [
      "Rawstyle",
      "Hardstyle",
      "Hard Techno"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "el-santu",
    "artistName": "EL SANTU",
    "mainTags": [
      "Hard Techno",
      "Techno",
      "Trance"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "element",
    "artistName": "Element",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "elite-enemy",
    "artistName": "Elite Enemy",
    "mainTags": [
      "Uptempo",
      "Hardcore"
    ],
    "additionalTag": "Industrial"
  },
  {
    "artistToken": "elitepauper-dj-team",
    "artistName": "Elitepauper DJ Team",
    "mainTags": [
      "Hardstyle",
      "Hardcore"
    ],
    "additionalTag": "90s"
  },
  {
    "artistToken": "elmefti",
    "artistName": "elMefti",
    "mainTags": [
      "Hard Techno",
      "Techno"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "emilija",
    "artistName": "Emilija",
    "mainTags": [
      "Hard Techno",
      "Techno"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "ems",
    "artistName": "EMS",
    "mainTags": [
      "Electro"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "end-of-line",
    "artistName": "End of line",
    "mainTags": [
      "Hardcore",
      "Metalcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "endgame",
    "artistName": "ENDGAME",
    "mainTags": [
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "endymion",
    "artistName": "Endymion",
    "mainTags": [
      "Hardcore",
      "Techno"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "ephoric",
    "artistName": "Ephoric",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "equal2",
    "artistName": "Equal2",
    "mainTags": [
      "Uptempo",
      "Hardcore",
      "Rave"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "erabreak",
    "artistName": "ERABREAK",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "eraized",
    "artistName": "Eraized",
    "mainTags": [
      "Uptempo",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "evander",
    "artistName": "EVÄNDER",
    "mainTags": [
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "evil-activities",
    "artistName": "Evil Activities",
    "mainTags": [
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "exertion",
    "artistName": "Exertion",
    "mainTags": [
      "Rawstyle",
      "Hardstyle",
      "Trance"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "exoform",
    "artistName": "Exoform",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "exproz",
    "artistName": "Exproz",
    "mainTags": [
      "Rawstyle",
      "Hardstyle",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "ezg",
    "artistName": "EZG",
    "mainTags": [
      "Hardstyle",
      "Hardcore"
    ],
    "additionalTag": "Rap"
  },
  {
    "artistToken": "ezg-live",
    "artistName": "EZG LIVE",
    "mainTags": [
      "Hardstyle",
      "Hardcore"
    ],
    "additionalTag": "Rap"
  },
  {
    "artistToken": "f-noize",
    "artistName": "F.Noize",
    "mainTags": [
      "Uptempo",
      "Terrorcore",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "faceless",
    "artistName": "Faceless",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "feestdjruthless",
    "artistName": "FeestDJRuthless",
    "mainTags": [
      "Hardstyle",
      "Hard Dance",
      "Jumpstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "feestdjruud",
    "artistName": "FeestDJRuud",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": "Hip-Hop"
  },
  {
    "artistToken": "feestdjruud-het-feestdjuurtje",
    "artistName": "FeestDJRuud het Feestdjuurtje",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": "Hip-Hop"
  },
  {
    "artistToken": "fiesto",
    "artistName": "Fiesto",
    "mainTags": [
      "Hard Dance",
      "House",
      "Electro"
    ],
    "additionalTag": "Pop"
  },
  {
    "artistToken": "fight-switch",
    "artistName": "Fight Switch",
    "mainTags": [
      "Hardstyle",
      "D&B"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "fiikra",
    "artistName": "FIIKRA",
    "mainTags": [
      "Techno",
      "Acidcore",
      "Acid"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "fjusha",
    "artistName": "Fjusha",
    "mainTags": [
      "Hard Techno",
      "Techno"
    ],
    "additionalTag": "Minimal"
  },
  {
    "artistToken": "flamman",
    "artistName": "Flamman",
    "mainTags": [
      "Hardstyle",
      "Hard Dance"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "flo",
    "artistName": "Flo",
    "mainTags": [
      "Hard Techno",
      "Techno"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "flout-mania",
    "artistName": "Flout Mania",
    "mainTags": [
      "Uptempo",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "folie-deux",
    "artistName": "Folie à Deux",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "fracture",
    "artistName": "Fracture",
    "mainTags": [
      "D&B"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "fraiche",
    "artistName": "FRAÎCHE",
    "mainTags": [
      "Hard Techno",
      "Techno",
      "Rave"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "franky-jones",
    "artistName": "Franky Jones",
    "mainTags": [
      "Techno",
      "Tekno",
      "Acid"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "fraw",
    "artistName": "Fraw",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "frequencerz",
    "artistName": "Frequencerz",
    "mainTags": [
      "Hardstyle",
      "Jumpstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "frok",
    "artistName": "Frok",
    "mainTags": [
      "Hardstyle",
      "Hard Dance"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "frontliner",
    "artistName": "Frontliner",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "furious",
    "artistName": "FURIOUS",
    "mainTags": [
      "Trance",
      "Psytrance"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "furyan",
    "artistName": "Furyan",
    "mainTags": [
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "g-town-madness",
    "artistName": "G-Town Madness",
    "mainTags": [
      "Hardcore",
      "Rave"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "galactixx",
    "artistName": "Galactixx",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "galactixx-classics-set",
    "artistName": "Galactixx Classics Set",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "gammer",
    "artistName": "Gammer",
    "mainTags": [
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "gd-connect",
    "artistName": "GD_Connect",
    "mainTags": [
      "Hard Techno",
      "Techno"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "geck-o",
    "artistName": "Geck-o",
    "mainTags": [
      "Hardstyle",
      "Trance"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "get-on-the-train",
    "artistName": "Get On The Train",
    "mainTags": [
      "Hardstyle",
      "Trance",
      "Hard Dance"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "gezellige-uptempo",
    "artistName": "Gezellige Uptempo",
    "mainTags": [
      "Uptempo",
      "Hardcore",
      "Electro"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "ginia",
    "artistName": "Ginia",
    "mainTags": [
      "Rawstyle",
      "Hardstyle",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "gizmo",
    "artistName": "Gizmo",
    "mainTags": [
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "gldy-lx",
    "artistName": "GLDY LX",
    "mainTags": [
      "Hardstyle",
      "Hard Techno",
      "Hard Dance"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "gonzi",
    "artistName": "Gonzi",
    "mainTags": [
      "Trance",
      "Psytrance"
    ],
    "additionalTag": "Minimal"
  },
  {
    "artistToken": "gpf",
    "artistName": "GPF",
    "mainTags": [
      "Uptempo",
      "Speedcore",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "gridkiller",
    "artistName": "Gridkiller",
    "mainTags": [
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "guizcore",
    "artistName": "Guizcore",
    "mainTags": [
      "Uptempo",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "gullie-live",
    "artistName": "Gullie LIVE",
    "mainTags": [
      "Hardstyle",
      "Hard Dance"
    ],
    "additionalTag": "Pop"
  },
  {
    "artistToken": "gunz-for-hire",
    "artistName": "Gunz For Hire",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "hans-glock",
    "artistName": "Hans Glock",
    "mainTags": [
      "Hardstyle",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "hard-driver",
    "artistName": "Hard Driver",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "hardcore-confessions",
    "artistName": "Hardcore Confessions",
    "mainTags": [
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "harder-class-hardstyle-contest",
    "artistName": "Harder Class Hardstyle Contest",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "harderclass-hardcore-contest",
    "artistName": "Harderclass Hardcore Contest",
    "mainTags": [
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "harmony",
    "artistName": "Harmony",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "heartreaver",
    "artistName": "HEARTREAVER",
    "mainTags": [
      "Hard Techno",
      "Techno"
    ],
    "additionalTag": "Industrial"
  },
  {
    "artistToken": "hetzkinen",
    "artistName": "HETZKINEN",
    "mainTags": [
      "Hard Techno",
      "Techno"
    ],
    "additionalTag": "Industrial"
  },
  {
    "artistToken": "holy-priest",
    "artistName": "Holy Priest",
    "mainTags": [
      "Hard Techno",
      "Techno"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "hortense-de-beauharnais",
    "artistName": "Hortense De Beauharnais",
    "mainTags": [
      "Trance",
      "Psytrance"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "hysta",
    "artistName": "Hysta",
    "mainTags": [
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "hytrip",
    "artistName": "HYTRIP",
    "mainTags": [
      "Trance",
      "Psytrance"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "ia5km",
    "artistName": "IA5KM",
    "mainTags": [
      "Hardstyle",
      "Hard Techno",
      "Techno"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "imanu",
    "artistName": "Imanu",
    "mainTags": [
      "D&B"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "imhappy",
    "artistName": "IMHAPPY",
    "mainTags": [
      "Hardcore",
      "Hard Dance"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "imperatorz",
    "artistName": "Imperatorz",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "incult",
    "artistName": "Incult",
    "mainTags": [
      "Uptempo",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "infliction",
    "artistName": "Infliction",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "innercircle-showcase",
    "artistName": "Innercircle Showcase",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "insurgent",
    "artistName": "Insurgent",
    "mainTags": [
      "Hardstyle",
      "Hardcore"
    ],
    "additionalTag": "Industrial"
  },
  {
    "artistToken": "insuspect",
    "artistName": "Insuspect",
    "mainTags": [
      "Uptempo",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "invaderz",
    "artistName": "Invaderz",
    "mainTags": [
      "Uptempo",
      "Hardcore",
      "D&B"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "invector",
    "artistName": "Invector",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "irradiate",
    "artistName": "Irradiate",
    "mainTags": [
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "isaline",
    "artistName": "ISALINE",
    "mainTags": [
      "Hard Techno",
      "Techno"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "ivy",
    "artistName": "[IVY]",
    "mainTags": [
      "D&B",
      "Electro"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "jailbreak-set",
    "artistName": "Jailbreak set",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "janks",
    "artistName": "Janks",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "jason-payne",
    "artistName": "Jason Payne",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "jay-reeve",
    "artistName": "Jay Reeve",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "jayron",
    "artistName": "Jayron",
    "mainTags": [
      "Hard Techno",
      "Techno"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "jazzy",
    "artistName": "Jazzy",
    "mainTags": [
      "House",
      "Electro"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "jdx",
    "artistName": "JDX",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "jebroer",
    "artistName": "Jebroer",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": "Rap"
  },
  {
    "artistToken": "jo3y3t",
    "artistName": "JO3Y3T",
    "mainTags": [
      "Hard Techno",
      "Techno"
    ],
    "additionalTag": "Industrial"
  },
  {
    "artistToken": "john-tana-live",
    "artistName": "John Tana LIVE",
    "mainTags": [
      "Hardstyle",
      "Hard Dance"
    ],
    "additionalTag": "Pop"
  },
  {
    "artistToken": "jones",
    "artistName": "Jones",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "josh",
    "artistName": "Josh",
    "mainTags": [
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "josha",
    "artistName": "Josha",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "juliex",
    "artistName": "Juliëx",
    "mainTags": [
      "Uptempo",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "julix",
    "artistName": "Juliëx",
    "mainTags": [
      "Uptempo",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "junkie-kid",
    "artistName": "Junkie Kid",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "juno-b-house-of-madness",
    "artistName": "Juno B - House of Madness",
    "mainTags": [
      "Uptempo",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "jur-terreur",
    "artistName": "Jur Terreur",
    "mainTags": [
      "Terrorcore",
      "Speedcore",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "jur-terreur-pres-rave-nation-live",
    "artistName": "Jur Terreur pres. Rave Nation LIVE",
    "mainTags": [
      "Terrorcore",
      "Hardcore",
      "Rave"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "k-chivache",
    "artistName": "K-CHIVACHE",
    "mainTags": [
      "Hardcore",
      "Tekno",
      "Acidcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "kara",
    "artistName": "KARA",
    "mainTags": [
      "D&B"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "karah",
    "artistName": "Karah",
    "mainTags": [
      "Hard Techno",
      "Techno"
    ],
    "additionalTag": "Industrial"
  },
  {
    "artistToken": "karun",
    "artistName": "Karun",
    "mainTags": [
      "Hard Techno",
      "Techno"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "keltek",
    "artistName": "KELTEK",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "kenai",
    "artistName": "Kenai",
    "mainTags": [
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "ketting",
    "artistName": "Ketting",
    "mainTags": [
      "Hard Techno",
      "Techno",
      "Rave"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "keuss",
    "artistName": "KEUSS",
    "mainTags": [
      "Tekno",
      "Acidcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "kichta",
    "artistName": "Kichta",
    "mainTags": [
      "Techno",
      "Trance"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "kideast",
    "artistName": "KidEast",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "kilbourne",
    "artistName": "Kilbourne",
    "mainTags": [
      "Hardcore"
    ],
    "additionalTag": "Industrial"
  },
  {
    "artistToken": "kili",
    "artistName": "Kili",
    "mainTags": [
      "Hard Techno",
      "Techno"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "killshot",
    "artistName": "Killshot",
    "mainTags": [
      "Rawstyle",
      "Hardstyle",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "klinical",
    "artistName": "Klinical",
    "mainTags": [
      "D&B"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "klofama",
    "artistName": "Klofama",
    "mainTags": [
      "Hard Techno",
      "Techno"
    ],
    "additionalTag": "Industrial"
  },
  {
    "artistToken": "kloss",
    "artistName": "KLÖSS",
    "mainTags": [
      "Hard Techno",
      "Techno"
    ],
    "additionalTag": "Industrial"
  },
  {
    "artistToken": "klugt",
    "artistName": "KLUGT",
    "mainTags": [
      "Hard Techno",
      "Techno"
    ],
    "additionalTag": "Industrial"
  },
  {
    "artistToken": "koarse",
    "artistName": "Koarse",
    "mainTags": [
      "D&B",
      "Electro"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "kolab",
    "artistName": "KØ:LAB",
    "mainTags": [
      "Techno"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "korsakoff",
    "artistName": "Korsakoff",
    "mainTags": [
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "krista-bourgeois-live",
    "artistName": "Krista Bourgeois LIVE",
    "mainTags": [
      "Hardcore",
      "Hard Techno",
      "Techno"
    ],
    "additionalTag": "Industrial"
  },
  {
    "artistToken": "kroefoe",
    "artistName": "Kroefoe",
    "mainTags": [
      "Uptempo",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "kronos",
    "artistName": "Kronos",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "krowdexx",
    "artistName": "Krowdexx",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "kruelty",
    "artistName": "Kruelty",
    "mainTags": [
      "Hardcore",
      "Deathcore"
    ],
    "additionalTag": "Metal"
  },
  {
    "artistToken": "ksltech",
    "artistName": "KSLTECH",
    "mainTags": [
      "Hard Techno",
      "Techno"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "kutski",
    "artistName": "Kutski",
    "mainTags": [
      "Hardstyle",
      "Hardcore",
      "Hard Dance"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "kx-chr",
    "artistName": "KX CHR",
    "mainTags": [
      "Hard Techno",
      "Techno"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "la-torgnole",
    "artistName": "LA TORGNOLE",
    "mainTags": [
      "Uptempo",
      "Frenchcore",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "lart-cene",
    "artistName": "L'Art Cène",
    "mainTags": [
      "Techno",
      "Tekno"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "le-wanski",
    "artistName": "Le Wanski",
    "mainTags": [
      "Techno",
      "Acid",
      "Trance"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "leardcore",
    "artistName": "LEARDCORE",
    "mainTags": [
      "Frenchcore",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "legacy-of-sound-live",
    "artistName": "Legacy of Sound LIVE",
    "mainTags": [
      "Hardstyle",
      "Hard Dance"
    ],
    "additionalTag": "90s"
  },
  {
    "artistToken": "lekkerfaces",
    "artistName": "Lekkerfaces",
    "mainTags": [
      "Uptempo",
      "Speedcore",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "leprince-big-sing-a-long",
    "artistName": "Leprince \"Big Sing a Long\"",
    "mainTags": [
      "Hardstyle",
      "Hard Dance"
    ],
    "additionalTag": "Pop"
  },
  {
    "artistToken": "level-one",
    "artistName": "Level One",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "levenkhan",
    "artistName": "Levenkhan",
    "mainTags": [
      "Hardstyle",
      "Frenchcore",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "lil-texas",
    "artistName": "Lil Texas",
    "mainTags": [
      "Speedcore",
      "Uptempo",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "livid",
    "artistName": "Livid",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "lny-tnz",
    "artistName": "LNY TNZ",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": "Rap"
  },
  {
    "artistToken": "lost-identity",
    "artistName": "Lost Identity",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "luciid",
    "artistName": "LUCIID",
    "mainTags": [
      "Hard Techno",
      "Techno"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "luna",
    "artistName": "Luna",
    "mainTags": [
      "Hardstyle",
      "Jumpstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "luna-fields",
    "artistName": "Luna Fields",
    "mainTags": [
      "Hard Techno",
      "Techno"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "lunakorpz",
    "artistName": "Lunakorpz",
    "mainTags": [
      "Uptempo",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "lunakorpz-live",
    "artistName": "Lunakorpz Live",
    "mainTags": [
      "Uptempo",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "luner",
    "artistName": "Luner",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "lvldup",
    "artistName": "LVLDUP",
    "mainTags": [
      "Hardstyle",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "mad-dog",
    "artistName": "Mad Dog",
    "mainTags": [
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "mad-dog-down-tempo",
    "artistName": "Mad Dog Down Tempo",
    "mainTags": [
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "maissouille",
    "artistName": "Maissouille",
    "mainTags": [
      "Frenchcore",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "majes",
    "artistName": "MAJES",
    "mainTags": [
      "Trance",
      "House",
      "Electro"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "major-conspiracy",
    "artistName": "Major Conspiracy",
    "mainTags": [
      "Uptempo",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "malice",
    "artistName": "Malice",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "mandragora",
    "artistName": "Mandragora",
    "mainTags": [
      "Techno",
      "Trance",
      "Psytrance"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "mandy",
    "artistName": "MANDY",
    "mainTags": [
      "Techno"
    ],
    "additionalTag": "Minimal"
  },
  {
    "artistToken": "manifest-destiny",
    "artistName": "Manifest Destiny",
    "mainTags": [
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "manji",
    "artistName": "Manji",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "marc-acardipane",
    "artistName": "Marc Acardipane",
    "mainTags": [
      "Hardstyle",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "marcel-woods",
    "artistName": "Marcel Woods",
    "mainTags": [
      "Techno",
      "Trance",
      "Hard Dance"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "mark",
    "artistName": "Mark",
    "mainTags": [
      "D&B"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "mat-weasel-busters",
    "artistName": "Mat Weasel Busters",
    "mainTags": [
      "Hardcore",
      "Tekno"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "max-enforcer",
    "artistName": "Max Enforcer",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "maxtreme",
    "artistName": "Maxtreme",
    "mainTags": [
      "Uptempo",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "may-li",
    "artistName": "MAY-LI",
    "mainTags": [
      "Hard Techno",
      "Techno"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "mbk",
    "artistName": "MBK",
    "mainTags": [
      "Uptempo",
      "Terrorcore",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "mc-chucky",
    "artistName": "MC Chucky",
    "mainTags": [
      "Hardstyle",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "mc-joe",
    "artistName": "MC Joe",
    "mainTags": [
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "mc-primax",
    "artistName": "MC Primax",
    "mainTags": [
      "Hardstyle",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "mc-robs",
    "artistName": "MC Robs",
    "mainTags": [
      "Hardstyle",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "mchuck",
    "artistName": "MCHUCK",
    "mainTags": [
      "Hardstyle",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "md",
    "artistName": "MD",
    "mainTags": [
      "Techno"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "medusa",
    "artistName": "MEDUSA",
    "mainTags": [
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "melina",
    "artistName": "MELINA",
    "mainTags": [
      "Hard Techno",
      "Techno"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "melo-3-by-ecstatic-jay-reeve",
    "artistName": "Melo-3 by Ecstatic, Jay Reeve",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "mental-theo",
    "artistName": "Mental Theo",
    "mainTags": [
      "Hardstyle",
      "Hardcore",
      "Jumpstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "mickeyg",
    "artistName": "MickeyG",
    "mainTags": [
      "Hardstyle",
      "House",
      "Electro"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "mido",
    "artistName": "MIDO",
    "mainTags": [
      "Hard Techno",
      "Techno"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "mind-compressor",
    "artistName": "Mind Compressor",
    "mainTags": [
      "Uptempo",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "mind-dimension",
    "artistName": "Mind Dimension",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "mish",
    "artistName": "Mish",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "miss-isa",
    "artistName": "Miss Isa",
    "mainTags": [
      "Hard Techno",
      "Techno"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "miss-k8",
    "artistName": "Miss K8",
    "mainTags": [
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "miss-monica",
    "artistName": "Miss Monica",
    "mainTags": [
      "Hard Techno",
      "Techno"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "missy",
    "artistName": "Missy",
    "mainTags": [
      "Hard Techno",
      "Techno"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "modesto",
    "artistName": "Modesto",
    "mainTags": [
      "Hardstyle",
      "Hard Dance"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "more-kords",
    "artistName": "More Kords",
    "mainTags": [
      "Hardstyle",
      "Dubstep",
      "Electro"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "mortis",
    "artistName": "Mortis",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "mr-bassmeister",
    "artistName": "Mr Bassmeister",
    "mainTags": [
      "Uptempo",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "mt",
    "artistName": "MT",
    "mainTags": [
      "Hard Techno",
      "Techno"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "murdock",
    "artistName": "Murdock",
    "mainTags": [
      "Hardcore",
      "D&B"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "mutilator",
    "artistName": "Mutilator",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "my-i-ll-style",
    "artistName": "My I'll Style",
    "mainTags": [
      "Hardstyle",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "n-vitral",
    "artistName": "N-Vitral",
    "mainTags": [
      "Hardcore"
    ],
    "additionalTag": "Industrial"
  },
  {
    "artistToken": "namara",
    "artistName": "Namara",
    "mainTags": [
      "Uptempo",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "nanostorm",
    "artistName": "Nanostorm",
    "mainTags": [
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "nct",
    "artistName": "NCT",
    "mainTags": [
      "D&B"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "neophyte",
    "artistName": "Neophyte",
    "mainTags": [
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "never-surrender",
    "artistName": "Never Surrender",
    "mainTags": [
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "new-live-act",
    "artistName": "NEW LIVE ACT",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "nexor",
    "artistName": "Nexor",
    "mainTags": [
      "Uptempo",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "nexos",
    "artistName": "NEXØS",
    "mainTags": [
      "Hard Techno",
      "Techno"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "nico",
    "artistName": "Nico",
    "mainTags": [
      "Hardstyle",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "nicolas-julian",
    "artistName": "Nicolas Julian",
    "mainTags": [
      "Trance",
      "Electro"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "nightcraft",
    "artistName": "Nightcraft",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "nightmare-engine",
    "artistName": "NIGHTMARE ENGINE",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "nightshift",
    "artistName": "Nightshift",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "niotech",
    "artistName": "Niotech",
    "mainTags": [
      "Techno",
      "Acid",
      "Rave"
    ],
    "additionalTag": "Industrial"
  },
  {
    "artistToken": "nocturnal",
    "artistName": "Nocturnal",
    "mainTags": [
      "Hardstyle",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "noisecontrollers",
    "artistName": "Noisecontrollers",
    "mainTags": [
      "Hardstyle",
      "Jumpstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "noiseflow",
    "artistName": "Noiseflow",
    "mainTags": [
      "Uptempo",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "noisekick",
    "artistName": "Noisekick",
    "mainTags": [
      "Terrorcore",
      "Speedcore",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "noize-suppressor",
    "artistName": "Noize Suppressor",
    "mainTags": [
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "nolz",
    "artistName": "Nolz",
    "mainTags": [
      "Hardstyle",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "nosferatu",
    "artistName": "Nosferatu",
    "mainTags": [
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "not-my-type",
    "artistName": "Not My Type",
    "mainTags": [
      "D&B"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "noxa",
    "artistName": "Noxa",
    "mainTags": [
      "Uptempo",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "noxiouz",
    "artistName": "Noxiouz",
    "mainTags": [
      "Uptempo",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "nto",
    "artistName": "NTO",
    "mainTags": [
      "Techno"
    ],
    "additionalTag": "Minimal"
  },
  {
    "artistToken": "nure",
    "artistName": "Nure",
    "mainTags": [
      "Techno"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "obses",
    "artistName": "OBSES",
    "mainTags": [
      "D&B",
      "Electro"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "octo-one",
    "artistName": "OCTO ONE",
    "mainTags": [
      "Hard Techno",
      "Techno"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "ode-to-bass-d",
    "artistName": "Ode to Bass-D",
    "mainTags": [
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "odymel",
    "artistName": "Odymel",
    "mainTags": [
      "Techno",
      "Trance"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "oguz",
    "artistName": "OGUZ",
    "mainTags": [
      "Hard Techno",
      "Techno"
    ],
    "additionalTag": "Industrial"
  },
  {
    "artistToken": "oldschool-set",
    "artistName": "Oldschool set",
    "mainTags": [
      "Hardcore",
      "Rave"
    ],
    "additionalTag": "90s"
  },
  {
    "artistToken": "olive-anguz",
    "artistName": "Olive Anguz",
    "mainTags": [
      "Hard Techno",
      "Techno"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "omegatypez",
    "artistName": "Omegatypez",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "omnya",
    "artistName": "Omnya",
    "mainTags": [
      "Hard Techno",
      "Techno"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "onlynumbers",
    "artistName": "Onlynumbers",
    "mainTags": [
      "Hard Techno",
      "Techno"
    ],
    "additionalTag": "Industrial"
  },
  {
    "artistToken": "onyx",
    "artistName": "Onyx",
    "mainTags": [
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "opgekonkerd",
    "artistName": "Opgekonkerd",
    "mainTags": [
      "Uptempo",
      "Speedcore",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "ophidian",
    "artistName": "Ophidian",
    "mainTags": [
      "Hardcore",
      "Darkcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "orange-heart",
    "artistName": "Orange Heart",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "otah",
    "artistName": "Otah",
    "mainTags": [
      "Electro"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "outbreak",
    "artistName": "OUTBREAK",
    "mainTags": [
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "outlined-point-break-revizion",
    "artistName": "Outlined, Point Break, Revizion",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "outsiders",
    "artistName": "Outsiders",
    "mainTags": [
      "Hardstyle",
      "Hard Dance"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "painbringer",
    "artistName": "Painbringer",
    "mainTags": [
      "Hardcore",
      "Acid"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "panic",
    "artistName": "Panic",
    "mainTags": [
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "panteros666",
    "artistName": "Panteros666",
    "mainTags": [
      "Hardcore",
      "Trance"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "party-animals",
    "artistName": "Party Animals",
    "mainTags": [
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "partyraiser",
    "artistName": "Partyraiser",
    "mainTags": [
      "Uptempo",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "pat-b",
    "artistName": "Pat B",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "paul-elstak",
    "artistName": "Paul Elstak",
    "mainTags": [
      "Hardcore",
      "Rave"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "paulskye",
    "artistName": "PAULSKYE",
    "mainTags": [
      "Hard Techno",
      "Techno",
      "Trance"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "pavo",
    "artistName": "Pavo",
    "mainTags": [
      "Hardstyle",
      "Jumpstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "peacock-in-concert",
    "artistName": "Peacock in Concert",
    "mainTags": [
      "Frenchcore",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "petit-biscuit",
    "artistName": "PETIT BISCUIT",
    "mainTags": [
      "House",
      "Electro"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "phuture-noize",
    "artistName": "Phuture Noize",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "pinotello",
    "artistName": "Pinotello",
    "mainTags": [
      "Uptempo",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "pl4y",
    "artistName": "PL4Y",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "potato",
    "artistName": "Potato",
    "mainTags": [
      "Hardstyle",
      "Hard Dance"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "power-hour",
    "artistName": "POWER HOUR",
    "mainTags": [
      "Hardstyle",
      "Hardcore",
      "Hard Dance"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "primeshock",
    "artistName": "Primeshock",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "promo",
    "artistName": "Promo",
    "mainTags": [
      "Hardcore"
    ],
    "additionalTag": "Industrial"
  },
  {
    "artistToken": "prost",
    "artistName": "PROST",
    "mainTags": [
      "Hard Techno",
      "Techno"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "psyko-punkz",
    "artistName": "Psyko Punkz",
    "mainTags": [
      "Hardstyle",
      "Jumpstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "pursuit-of-a-dream-album-showcase",
    "artistName": "Pursuit Of A Dream 'album showcase",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "pythius",
    "artistName": "Pythius",
    "mainTags": [
      "D&B"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "qult-classics",
    "artistName": "QULT Classics",
    "mainTags": [
      "Hardstyle",
      "Hard Dance",
      "Rave"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "rabbeat",
    "artistName": "RABBeAT",
    "mainTags": [
      "Techno",
      "Hardcore"
    ],
    "additionalTag": "Industrial"
  },
  {
    "artistToken": "radianze",
    "artistName": "Radianze",
    "mainTags": [
      "Hardstyle",
      "House",
      "Electro"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "radical-redemption",
    "artistName": "Radical Redemption",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "radium",
    "artistName": "Radium",
    "mainTags": [
      "Frenchcore",
      "Hardcore",
      "Darkcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "ran-d",
    "artistName": "Ran-D",
    "mainTags": [
      "Hardstyle",
      "Rawstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "rataplan",
    "artistName": "Rataplan",
    "mainTags": [
      "Hardstyle",
      "Hard Dance"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "rayzen",
    "artistName": "Rayzen",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "rdo",
    "artistName": "RDØ",
    "mainTags": [
      "Hard Techno",
      "Techno"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "re-done",
    "artistName": "Re-Done",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "rebelion",
    "artistName": "Rebelion",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "red-race-winner",
    "artistName": "Red race winner",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "redpill",
    "artistName": "Redpill",
    "mainTags": [
      "D&B"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "redrace-winner",
    "artistName": "REDRACE WINNER",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "reeza",
    "artistName": "Reeza",
    "mainTags": [
      "Hardcore",
      "Rave"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "refold",
    "artistName": "Refold",
    "mainTags": [
      "Hardstyle",
      "Dubstep",
      "Electro"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "refuzion",
    "artistName": "Refuzion",
    "mainTags": [
      "Hardstyle",
      "House",
      "Electro"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "regain",
    "artistName": "Regain",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "reinier-zonneveld",
    "artistName": "Reinier Zonneveld",
    "mainTags": [
      "Techno",
      "House",
      "Electro"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "rejecta",
    "artistName": "Rejecta",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "relajadita",
    "artistName": "Relajadita",
    "mainTags": [
      "Hard Techno",
      "Techno",
      "Acid"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "releazer",
    "artistName": "Releazer",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "remzcore",
    "artistName": "Remzcore",
    "mainTags": [
      "Frenchcore",
      "Speedcore",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "repeller",
    "artistName": "Repeller",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "required-live",
    "artistName": "Required LIVE",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "resensed",
    "artistName": "Resensed",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "restrained",
    "artistName": "Restrained",
    "mainTags": [
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "restricted",
    "artistName": "Restricted",
    "mainTags": [
      "Hardcore",
      "Hard Techno"
    ],
    "additionalTag": "Industrial"
  },
  {
    "artistToken": "revealer",
    "artistName": "Revealer",
    "mainTags": [
      "Metalcore",
      "Hardcore"
    ],
    "additionalTag": "Metal"
  },
  {
    "artistToken": "revelation",
    "artistName": "Revelation",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "revelation-live",
    "artistName": "Revelation LIVE",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "revellers",
    "artistName": "Revellers",
    "mainTags": [
      "Hardstyle",
      "Hard Dance"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "revolve",
    "artistName": "Revolve",
    "mainTags": [
      "Metalcore"
    ],
    "additionalTag": "Metal"
  },
  {
    "artistToken": "rg",
    "artistName": "RG",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "ricardo-moreno",
    "artistName": "Ricardo moreno",
    "mainTags": [
      "Hardstyle",
      "House",
      "Electro"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "riot-shift",
    "artistName": "Riot Shift",
    "mainTags": [
      "Rawstyle",
      "Hardstyle",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "rob",
    "artistName": "Rob",
    "mainTags": [
      "Hardcore",
      "Rave"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "rob-gasd-rop",
    "artistName": "Rob Gasd'rop",
    "mainTags": [
      "Hardstyle",
      "Hardcore"
    ],
    "additionalTag": "Pop"
  },
  {
    "artistToken": "rob-gee",
    "artistName": "Rob Gee",
    "mainTags": [
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "robs",
    "artistName": "Robs",
    "mainTags": [
      "Hardstyle",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "roll-sdonnie",
    "artistName": "Roll + Sdonnie",
    "mainTags": [
      "Hardstyle",
      "Hardcore"
    ],
    "additionalTag": "Rap"
  },
  {
    "artistToken": "rooler",
    "artistName": "Rooler",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "roosterz",
    "artistName": "Roosterz",
    "mainTags": [
      "Uptempo",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "rosbeek",
    "artistName": "Rosbeek",
    "mainTags": [
      "Uptempo",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "rubio",
    "artistName": "Rubiø",
    "mainTags": [
      "Hard Techno",
      "Techno"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "ruffian",
    "artistName": "Ruffian",
    "mainTags": [
      "Hardcore",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "ruffneck",
    "artistName": "Ruffneck",
    "mainTags": [
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "rulebreaking-rampage-live",
    "artistName": "Rulebreaking Rampage Live",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "ruthless",
    "artistName": "Ruthless",
    "mainTags": [
      "Hardstyle",
      "Hard Dance",
      "Jumpstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "ruthless-freestyle-classics",
    "artistName": "Ruthless Freestyle classics",
    "mainTags": [
      "Hardstyle",
      "Hard Dance",
      "Jumpstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "rv",
    "artistName": "RV",
    "mainTags": [
      "Techno"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "s-kill",
    "artistName": "S-Kill",
    "mainTags": [
      "Uptempo",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "s-te-fan",
    "artistName": "S-te-Fan",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "s1ngular",
    "artistName": "S1ngular",
    "mainTags": [
      "Trance",
      "Hard Dance"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "sakyra",
    "artistName": "Sakyra",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "samuel-moriero",
    "artistName": "Samuel Moriero",
    "mainTags": [
      "Hard Techno",
      "Techno"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "samynator",
    "artistName": "Samynator",
    "mainTags": [
      "Uptempo",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "samynator-live",
    "artistName": "Samynator LIVE",
    "mainTags": [
      "Uptempo",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "sanctuary",
    "artistName": "Sanctuary",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "sandy-warez",
    "artistName": "Sandy Warez",
    "mainTags": [
      "Hardcore",
      "Techno",
      "Hard Techno"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "santos",
    "artistName": "SANTØS",
    "mainTags": [
      "Hard Techno",
      "Techno"
    ],
    "additionalTag": "Industrial"
  },
  {
    "artistToken": "satirized",
    "artistName": "Satirized",
    "mainTags": [
      "Uptempo",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "savage-academy",
    "artistName": "Savage Academy",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "schlot-presents-the-great-krach-show",
    "artistName": "Schlot presents The Great Krach Show",
    "mainTags": [
      "Hardstyle",
      "Hard Dance"
    ],
    "additionalTag": "Pop"
  },
  {
    "artistToken": "scot-project",
    "artistName": "Scot Project",
    "mainTags": [
      "Trance",
      "Hard Dance"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "screecher",
    "artistName": "Screecher",
    "mainTags": [
      "Uptempo",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "screecher-present-dragonized-live",
    "artistName": "Screecher present Dragonized LIVE",
    "mainTags": [
      "Uptempo",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "sefa",
    "artistName": "Sefa",
    "mainTags": [
      "Frenchcore",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "sephyx",
    "artistName": "Sephyx",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "sergastek",
    "artistName": "SERGASTEK",
    "mainTags": [
      "Hard Techno",
      "Tekno",
      "Acidcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "serzo",
    "artistName": "Serzo",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "showtek",
    "artistName": "Showtek",
    "mainTags": [
      "Hardstyle",
      "House"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "sickmode",
    "artistName": "Sickmode",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "simox",
    "artistName": "Simox",
    "mainTags": [
      "House",
      "Electro"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "simula",
    "artistName": "Simula",
    "mainTags": [
      "D&B",
      "Electro"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "sins-of-pandora",
    "artistName": "Sins of Pandora",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "skantia",
    "artistName": "SKANTIA",
    "mainTags": [
      "D&B"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "skone",
    "artistName": "Sköne",
    "mainTags": [
      "Acid",
      "Trance",
      "Techno"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "slackreb",
    "artistName": "SLACKREB",
    "mainTags": [
      "Hard Techno",
      "Techno"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "slaughterhouse",
    "artistName": "Slaughterhouse",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "slim-shore",
    "artistName": "Slim Shore",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "slvl",
    "artistName": "SLVL",
    "mainTags": [
      "Hard Techno",
      "Techno",
      "Acid"
    ],
    "additionalTag": "Industrial"
  },
  {
    "artistToken": "so-juice",
    "artistName": "So Juice",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "solere",
    "artistName": "SOLERE",
    "mainTags": [
      "Techno",
      "House"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "solstice",
    "artistName": "Solstice",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "soraa",
    "artistName": "SORAÄ",
    "mainTags": [
      "Techno",
      "Acid",
      "Rave"
    ],
    "additionalTag": "Industrial"
  },
  {
    "artistToken": "sota",
    "artistName": "Sota",
    "mainTags": [
      "D&B"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "soulblast",
    "artistName": "Soulblast",
    "mainTags": [
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "sound-rush",
    "artistName": "Sound Rush",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "sova",
    "artistName": "SOVA",
    "mainTags": [
      "Electro"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "sparkz",
    "artistName": "Sparkz",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "spectre",
    "artistName": "Spectre",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "spiady",
    "artistName": "Spiady",
    "mainTags": [
      "Uptempo",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "spitfire",
    "artistName": "Spitfire",
    "mainTags": [
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "spitfire-album-showcase",
    "artistName": "Spitfire [album showcase",
    "mainTags": [
      "Uptempo",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "spitnoise",
    "artistName": "Spitnoise",
    "mainTags": [
      "Uptempo",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "spoontech-classics",
    "artistName": "Spoontech Classics",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "spoontech-emergence-showcase-by-nside",
    "artistName": "Spoontech Emergence Showcase by NSIDE",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "spoontechnicians",
    "artistName": "Spoontechnicians",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "spoontechno",
    "artistName": "Spoontechno",
    "mainTags": [
      "Rawstyle",
      "Hardstyle",
      "Techno"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "stanne",
    "artistName": "Stanne",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "steenwolk",
    "artistName": "Steenwolk",
    "mainTags": [
      "Hardstyle",
      "Hardcore"
    ],
    "additionalTag": "Rap"
  },
  {
    "artistToken": "steve-d",
    "artistName": "Steve-D",
    "mainTags": [
      "Hardcore",
      "Rave"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "steve-hill",
    "artistName": "Steve Hill",
    "mainTags": [
      "Trance",
      "Hard Dance"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "stlth",
    "artistName": "STLTH",
    "mainTags": [
      "Hard Techno",
      "Techno"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "stoik",
    "artistName": "STOIK",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "storah",
    "artistName": "STORAH",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "stormerz",
    "artistName": "Stormerz",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "stormtrooper",
    "artistName": "Stormtrooper",
    "mainTags": [
      "Speedcore",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "strikeblood",
    "artistName": "Strikeblood",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "stugats",
    "artistName": "Stugats",
    "mainTags": [
      "Hard Techno",
      "Techno"
    ],
    "additionalTag": "Industrial"
  },
  {
    "artistToken": "stuk",
    "artistName": "STUK",
    "mainTags": [
      "Hardstyle",
      "Hard Dance"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "stv",
    "artistName": "STV",
    "mainTags": [
      "Uptempo",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "styn",
    "artistName": "Styn",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "sub-sonik",
    "artistName": "Sub Sonik",
    "mainTags": [
      "Techno",
      "Acid",
      "D&B"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "sub-zero-project",
    "artistName": "Sub Zero Project",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "sugah",
    "artistName": "Sugah",
    "mainTags": [
      "D&B"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "sunny-d",
    "artistName": "Sunny D",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "super-trash-bros-live",
    "artistName": "Super Trash Bros. LIVE",
    "mainTags": [
      "Hardstyle",
      "Hard Dance"
    ],
    "additionalTag": "Pop"
  },
  {
    "artistToken": "suspect",
    "artistName": "Suspect",
    "mainTags": [
      "Hardcore",
      "Dubstep"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "svenergy",
    "artistName": "Svenergy",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "synapson",
    "artistName": "SYNAPSON",
    "mainTags": [
      "Electro",
      "House"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "synapze",
    "artistName": "Synapze",
    "mainTags": [
      "Hardcore",
      "Darkcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "synergy",
    "artistName": "Synergy",
    "mainTags": [
      "Trance"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "synthsoldier",
    "artistName": "Synthsoldier",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "system-overload",
    "artistName": "System Overload",
    "mainTags": [
      "Uptempo",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "t-go",
    "artistName": "T-GO",
    "mainTags": [
      "Uptempo",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "tantron",
    "artistName": "Tantron",
    "mainTags": [
      "D&B",
      "Electro"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "tars",
    "artistName": "TARS",
    "mainTags": [
      "Hard Techno",
      "Techno"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "tatanka",
    "artistName": "Tatanka",
    "mainTags": [
      "Hardstyle",
      "Hard Dance"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "teknoclash",
    "artistName": "Teknoclash",
    "mainTags": [
      "Hardstyle",
      "Tekno"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "teksa",
    "artistName": "Teksa",
    "mainTags": [
      "Tekno"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "tetta",
    "artistName": "Tetta",
    "mainTags": [
      "Hardstyle",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "tha-playah",
    "artistName": "Tha Playah",
    "mainTags": [
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "tha-watcher",
    "artistName": "Tha Watcher",
    "mainTags": [
      "Hardstyle",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "tharken",
    "artistName": "Tharken",
    "mainTags": [
      "Uptempo",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "tharoza",
    "artistName": "Tharoza",
    "mainTags": [
      "Uptempo",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "the-beholder",
    "artistName": "The Beholder",
    "mainTags": [
      "Hardstyle",
      "Hard Dance"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "the-caracal-project",
    "artistName": "THE CARACAL PROJECT",
    "mainTags": [
      "D&B",
      "Dubstep"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "the-closing-ritual",
    "artistName": "The Closing Ritual",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "the-darkraver",
    "artistName": "The Darkraver",
    "mainTags": [
      "Hardcore",
      "Techno",
      "Rave"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "the-dj-producer",
    "artistName": "The DJ Producer",
    "mainTags": [
      "Hardcore",
      "Darkcore"
    ],
    "additionalTag": "Industrial"
  },
  {
    "artistToken": "the-dope-doctor",
    "artistName": "The Dope Doctor",
    "mainTags": [
      "Uptempo",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "the-endshow",
    "artistName": "The Endshow",
    "mainTags": [
      "Rawstyle",
      "Hardstyle",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "the-essence",
    "artistName": "The Essence",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "the-final-elixir",
    "artistName": "The Final Elixir",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "the-final-kryptonite",
    "artistName": "The Final Kryptonite",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "the-final-shit-show",
    "artistName": "the final shit show",
    "mainTags": [
      "Uptempo",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "the-masochist",
    "artistName": "The Masochist",
    "mainTags": [
      "Hardcore",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "the-opening-ceremony",
    "artistName": "The Opening Ceremony",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "the-outside-agency",
    "artistName": "The Outside Agency",
    "mainTags": [
      "Hardcore",
      "Darkcore"
    ],
    "additionalTag": "Industrial"
  },
  {
    "artistToken": "the-pitcher",
    "artistName": "The Pitcher",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "the-purge",
    "artistName": "The Purge",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "the-purge-hybrid",
    "artistName": "The Purge Hybrid",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "the-raver",
    "artistName": "The Raver",
    "mainTags": [
      "Hardcore",
      "Rave"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "the-saints",
    "artistName": "The Saints",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "the-sickest-squad",
    "artistName": "The Sickest Squad",
    "mainTags": [
      "Frenchcore",
      "Hardcore",
      "Speedcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "the-silence",
    "artistName": "The Silence",
    "mainTags": [
      "Metalcore"
    ],
    "additionalTag": "Metal"
  },
  {
    "artistToken": "the-smiler",
    "artistName": "The Smiler",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "the-spotlight",
    "artistName": "The Spotlight",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "the-straikerz",
    "artistName": "The Straikerz",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "the-viper",
    "artistName": "The Viper",
    "mainTags": [
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "the-vizitor",
    "artistName": "The Vizitor",
    "mainTags": [
      "Speedcore",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "theezer",
    "artistName": "THEEZER",
    "mainTags": [
      "D&B",
      "Electro"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "themen",
    "artistName": "THEMEN",
    "mainTags": [
      "D&B"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "tigerhead",
    "artistName": "Tigerhead",
    "mainTags": [
      "Techno"
    ],
    "additionalTag": "Industrial"
  },
  {
    "artistToken": "titan",
    "artistName": "Titan",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "tjerhakkers",
    "artistName": "Tjerhakkers",
    "mainTags": [
      "Hardstyle",
      "Hard Dance"
    ],
    "additionalTag": "Pop"
  },
  {
    "artistToken": "tmo",
    "artistName": "T.M.O.",
    "mainTags": [
      "Techno"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "tnt",
    "artistName": "TNT",
    "mainTags": [
      "Hardstyle",
      "Hard Dance"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "to-b",
    "artistName": "TO-B",
    "mainTags": [
      "Hard Techno",
      "Techno"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "todiefor",
    "artistName": "Todiefor",
    "mainTags": [
      "House",
      "Electro"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "tommyknocker",
    "artistName": "Tommyknocker",
    "mainTags": [
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "toneshifterz",
    "artistName": "Toneshifterz",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "toxic-machinery",
    "artistName": "Toxic Machinery",
    "mainTags": [
      "Hard Techno",
      "Techno"
    ],
    "additionalTag": "Industrial"
  },
  {
    "artistToken": "toza",
    "artistName": "TOZA",
    "mainTags": [
      "Uptempo",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "trespassed",
    "artistName": "Trespassed",
    "mainTags": [
      "Uptempo",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "triple6-live",
    "artistName": "Triple6 Live",
    "mainTags": [
      "Uptempo",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "tripping",
    "artistName": "Tripping",
    "mainTags": [
      "Uptempo",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "tukkertempo",
    "artistName": "TukkerTempo",
    "mainTags": [
      "Uptempo",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "tukkertempo-pres-kick-therapy-live",
    "artistName": "Tukkertempo pres. Kick Therapy LIVE",
    "mainTags": [
      "Uptempo",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "twintigerz",
    "artistName": "Twintigerz",
    "mainTags": [
      "Hardstyle",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "twstd",
    "artistName": "TWSTD",
    "mainTags": [
      "Hard Dance",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "uberjakd",
    "artistName": "UBERJAKD",
    "mainTags": [
      "Hardstyle",
      "Hard Dance"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "udex",
    "artistName": "Udex",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "udow",
    "artistName": "Udow",
    "mainTags": [
      "Uptempo",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "unexist",
    "artistName": "Unexist",
    "mainTags": [
      "Hardcore",
      "Darkcore"
    ],
    "additionalTag": "Industrial"
  },
  {
    "artistToken": "unicorn-on-k",
    "artistName": "Unicorn on K",
    "mainTags": [
      "Uptempo",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "unique",
    "artistName": "Unique",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "unlike-others",
    "artistName": "Unlike Others",
    "mainTags": [
      "Uptempo",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "unload",
    "artistName": "Unload",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "unlocked",
    "artistName": "Unlocked",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "unproven",
    "artistName": "Unproven",
    "mainTags": [
      "Uptempo",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "unresolved",
    "artistName": "Unresolved",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "uphoria",
    "artistName": "Uphoria",
    "mainTags": [
      "D&B"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "upsilone",
    "artistName": "Upsilone",
    "mainTags": [
      "House",
      "Electro"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "used",
    "artistName": "USED",
    "mainTags": [
      "D&B"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "used-crossover-set",
    "artistName": "Used Crossover set",
    "mainTags": [
      "Hardcore",
      "D&B"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "ush",
    "artistName": "USH",
    "mainTags": [
      "Hard Techno",
      "Techno"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "valido",
    "artistName": "Valido",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "vandal",
    "artistName": "Vandal",
    "mainTags": [
      "Tekno",
      "Acid",
      "Rave"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "vandal-sm",
    "artistName": "Vandal!sm",
    "mainTags": [
      "Hardcore",
      "Speedcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "vandalsm",
    "artistName": "Vandal!sm",
    "mainTags": [
      "Hardcore",
      "Speedcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "vasto",
    "artistName": "Vasto",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "vernex",
    "artistName": "Vernex",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "vertile",
    "artistName": "Vertile",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "vexxed",
    "artistName": "Vexxed",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "vici",
    "artistName": "VICI",
    "mainTags": [
      "D&B"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "vieze-asback",
    "artistName": "VIEZE ASBACK",
    "mainTags": [
      "Uptempo",
      "Hardcore",
      "Hard Techno"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "vieze-asbak",
    "artistName": "Vieze Asbak",
    "mainTags": [
      "Uptempo",
      "Hardcore",
      "Hard Techno"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "villain",
    "artistName": "Villain",
    "mainTags": [
      "Hardstyle",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "vince",
    "artistName": "Vince",
    "mainTags": [
      "Hardcore",
      "Rave"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "vinzz",
    "artistName": "VINZZ",
    "mainTags": [
      "Hard Techno",
      "Techno"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "visages",
    "artistName": "Visages",
    "mainTags": [
      "D&B",
      "Dubstep"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "viva-la-fist",
    "artistName": "Viva La Fist",
    "mainTags": [
      "Uptempo",
      "Hardcore"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "vlb",
    "artistName": "VLB",
    "mainTags": [
      "Hard Techno",
      "Techno"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "voidax",
    "artistName": "Voidax",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "vorteks",
    "artistName": "Vortek's",
    "mainTags": [
      "Hardcore",
      "Tekno",
      "Acid"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "vyral",
    "artistName": "Vyral",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "warface",
    "artistName": "Warface",
    "mainTags": [
      "Rawstyle",
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "warrior-workout",
    "artistName": "Warrior Workout",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "wasted-penguinz",
    "artistName": "Wasted Penguinz",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "wes-s",
    "artistName": "Wes S",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "wesz",
    "artistName": "Wesz",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "wildstylez",
    "artistName": "Wildstylez",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "will-atkinson",
    "artistName": "Will Atkinson",
    "mainTags": [
      "Trance",
      "Hard Dance"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "wolv",
    "artistName": "Wolv",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "xrtn",
    "artistName": "XRTN",
    "mainTags": [
      "Hard Techno",
      "Techno",
      "Hard Dance"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "yann-muller",
    "artistName": "Yann Muller",
    "mainTags": [
      "House",
      "Electro"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "yeyo",
    "artistName": "YEYO",
    "mainTags": [
      "Hard Techno",
      "Techno"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "yoshiko",
    "artistName": "Yoshiko",
    "mainTags": [
      "Uptempo",
      "Hardcore",
      "Hard Techno"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "youphoria",
    "artistName": "Youphoria",
    "mainTags": [
      "D&B"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "yussi",
    "artistName": "Yussi",
    "mainTags": [
      "D&B",
      "Electro"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "zanger-bas-live",
    "artistName": "Zanger Bas LIVE",
    "mainTags": [
      "Hardstyle",
      "Hard Dance"
    ],
    "additionalTag": "Pop"
  },
  {
    "artistToken": "zany",
    "artistName": "Zany",
    "mainTags": [
      "Hardstyle",
      "Jumpstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "zapravka",
    "artistName": "Zapravka",
    "mainTags": [
      "Rave"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "zatox",
    "artistName": "Zatox",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "zearo",
    "artistName": "Zearø",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "zelecter",
    "artistName": "Zelecter",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "zelector",
    "artistName": "Zelector",
    "mainTags": [
      "Hardstyle"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "zep",
    "artistName": "ZEP",
    "mainTags": [
      "Hard Techno",
      "Techno"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "zorel",
    "artistName": "ZOREL",
    "mainTags": [
      "Hard Techno",
      "Techno"
    ],
    "additionalTag": null
  },
  {
    "artistToken": "zorza",
    "artistName": "ZORZA",
    "mainTags": [
      "Techno",
      "Trance"
    ],
    "additionalTag": null
  }
];
