// druh: "základné" (osobné základné: ja, ty, on, ona, my, vy, oni a tvary mňa/ma/ti/ho/mu/nás/vás/im...)
//       "privlastňovacie" (osobné privlastňovacie: môj, tvoj, jeho, jej, náš, váš, ich a ich tvary)
export const DATA_ZAMENA = [
    // Osobné základné zámená - v 1. páde (podmet)
    { sentence: "<Ja> chodím do druhého ročníka.", answer: "základné" },
    { sentence: "<Ty> si môj najlepší kamarát.", answer: "základné" },
    { sentence: "<My> radi športujeme.", answer: "základné" },
    { sentence: "<Vy> ste veľmi šikovní.", answer: "základné" },
    { sentence: "<Oni> bývajú vedľa nás.", answer: "základné" },
    { sentence: "<On> rád kreslí zvieratá.", answer: "základné" },
    { sentence: "<Ona> spieva v zbore.", answer: "základné" },

    // Osobné základné zámená - v iných pádoch (predmet)
    { sentence: "Mama <ma> pochválila za úlohu.", answer: "základné" },
    { sentence: "Otec <ti> kúpil novú knihu.", answer: "základné" },
    { sentence: "Učiteľka <nám> rozdala zošity.", answer: "základné" },
    { sentence: "Babka <vás> volá na obed.", answer: "základné" },
    { sentence: "Pomôžem <ti> s úlohou.", answer: "základné" },
    { sentence: "Pozri sa na <mňa>!", answer: "základné" },
    { sentence: "Stretol som <ho> v parku.", answer: "základné" },
    { sentence: "Bez <teba> to nezvládneme.", answer: "základné" },
    { sentence: "Sused <nás> pozdravil.", answer: "základné" },
    { sentence: "Učiteľ <im> vysvetlil úlohu.", answer: "základné" },
    { sentence: "Sadni si vedľa <mňa>.", answer: "základné" },
    { sentence: "Tešíme sa na <vás>.", answer: "základné" },
    { sentence: "Brat <mi> požičal pero.", answer: "základné" },
    { sentence: "Rád sa hrám s <ním> na ihrisku.", answer: "základné" },
    { sentence: "Mama <vám> upiekla koláč.", answer: "základné" },
    { sentence: "Sedím za <ňou> v lavici.", answer: "základné" },

    // Osobné privlastňovacie zámená - jednotné číslo
    { sentence: "Toto je <moja> taška.", answer: "privlastňovacie" },
    { sentence: "<Tvoj> pes je veľmi milý.", answer: "privlastňovacie" },
    { sentence: "<Náš> učiteľ je prísny.", answer: "privlastňovacie" },
    { sentence: "Páči sa mi <vaša> záhrada.", answer: "privlastňovacie" },
    { sentence: "<Môj> brat hrá futbal.", answer: "privlastňovacie" },
    { sentence: "<Tvoja> mačka spí na gauči.", answer: "privlastňovacie" },
    { sentence: "<Naša> škola je veľká.", answer: "privlastňovacie" },
    { sentence: "Stretol som <jeho> sestru.", answer: "privlastňovacie" },
    { sentence: "Videl som <jej> nový bicykel.", answer: "privlastňovacie" },
    { sentence: "<Vaša> izba je veľmi pekná.", answer: "privlastňovacie" },
    { sentence: "Páčilo sa mi <tvoje> rozprávanie.", answer: "privlastňovacie" },
    { sentence: "<Moje> tričko je modré.", answer: "privlastňovacie" },

    // Osobné privlastňovacie zámená - množné číslo a iné tvary
    { sentence: "<Ich> deti sa hrajú vonku.", answer: "privlastňovacie" },
    { sentence: "<Vaši> rodičia ma pozvali.", answer: "privlastňovacie" },
    { sentence: "<Naši> susedia majú psa.", answer: "privlastňovacie" },
    { sentence: "<Tvoji> kamaráti čakajú vonku.", answer: "privlastňovacie" },
    { sentence: "<Moji> spolužiaci idú do divadla.", answer: "privlastňovacie" },
    { sentence: "Vrátil som <jej> knihu.", answer: "privlastňovacie" },
    { sentence: "Spoznal som <ich> rodičov.", answer: "privlastňovacie" },
    { sentence: "Páčia sa mi <tvoje> obrázky.", answer: "privlastňovacie" },
    { sentence: "Spýtal som sa <jeho> mamy.", answer: "privlastňovacie" },
    { sentence: "<Naše> mesto je krásne.", answer: "privlastňovacie" },
    { sentence: "<Vaši> bratranci nás navštívili.", answer: "privlastňovacie" },
];
