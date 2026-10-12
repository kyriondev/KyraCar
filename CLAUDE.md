# Kyra: osobní appka do auta

Zadání pro Claude Code. Přečti celé, než začneš psát kód.

## Co to je

Kyra je PWA, kterou si Danny (solo vývojář, značka Kyrion) staví pro vlastní auto: Škoda Fabia I 1.4 MPI (kolem roku 2001), benzín, diagnostika po K-line. Nejde do App Storu. Hostuje se na Vercelu a na iPhonu se přidá na plochu přes Safari. Jméno Kyra je záměrně univerzální, protože Danny si časem koupí jiné auto, takže appka od začátku podporuje víc aut.

Dvě části:

1. Deník a asistent, který funguje hned, bez jakéhokoli hardwaru (fáze 1).
2. Čtení dat z auta přes K-line, které přijde později (fáze 2).

## Rozhodnutí, ze kterých se vychází

- Stack: Next.js (App Router) + TypeScript + Tailwind CSS, nasazení na Vercel. Verze zvol aktuální.
- Fáze 1 nemá databázi. Data jsou v `localStorage` za vrstvou `lib/storage.ts`, aby šla později vyměnit (třeba za Supabase).
- Groq klíč nikdy do klienta. Všechna volání Groqu jdou přes serverless route v `app/api/`, klíč je v `GROQ_API_KEY` (Vercel env a `.env.local`, který je v `.gitignore`).
- Primárně iPhone, rozměr obrazovky 390×844. PWA na pozadí neběží, takže appka musí být za jízdy otevřená a obrazovka svítí přes Wake Lock API (na iOS ověř, jak se chová v režimu plochy, historicky tam byly potíže). Navigaci appka nedělá, nanejvýš odkáže deep linkem do Map nebo Waze.
- Jazyk rozhraní je čeština. Kód a názvy v angličtině.
- Čtení z auta je read-only. Do řídicí jednotky nikdy nic nezapisovat (žádné kódování, adaptace ani mazání chyb bez výslovného potvrzení uživatele).
- Osobní údaje (adresa, číslo pojistky, celá zelená karta) nepatří do repozitáře ani do appky. SPZ a datum konce pojištění zadává uživatel v appce.

## Obrazovky (pět záložek)

Referenční vzhled je ve složce `design/`. Jeden soubor `.dc.html` je jedna obrazovka a `canvas.json` je jejich rozmístění. Samostatně se nedají otevřít (chybí jim runtime), ale inline styly obsahují přesné hodnoty: barvy, velikosti, texty, rozestupy. Ber je jako zdroj pravdy pro vzhled. Čísla a záznamy v nich jsou ukázková a smyšlená (chyba P0171, tankování, problémy).

| Záložka | Soubor | Obsah |
| --- | --- | --- |
| Jízda | `Main.dc.html` | HUD: kruhový ciferník rychlosti z GPS, otáčky jako malý text, dlaždice teplota kapaliny / zátěž motoru / napětí / nasávaný vzduch, pilulka "Zeptej se Kyry…" |
| Kyra | `Jarvis.dc.html` | Chat s asistentem, mikrofon, návrhy otázek, akční karty ("Zapsáno do deníku"). Název souboru zůstal ze starší verze, je to záložka Kyra. |
| Servis, Chyby z auta | `Diagnostika.dc.html` | Uložené chybové kódy (DTC), vysvětlení od Kyry, co zkontrolovat, hodnoty při vzniku chyby |
| Servis, Moje problémy | `Problemy.dc.html` | Ruční záznam problémů s autem (otevřené a vyřešené), rychlý zápis textem nebo hlasem |
| Deník | `Denik.dc.html` | Tankování: spotřeba, náklady za měsíc, graf, seznam, údržba |
| Garáž | `Garaz.dc.html` | Profil auta a přepínač aut, připomínky (pojištění, STK, dálniční známka, olej), adaptér, pomoc na silnici (linka 1224) |

Záložka Servis má nahoře přepínač dvou částí (Chyby z auta, Moje problémy).

## Datový model (návrh)

```ts
type Car = { id: string; name: string; plate?: string; engine?: string; odometerKm?: number };

type FuelEntry = {
  id: string; carId: string; date: string;      // ISO
  liters: number; pricePerLiter: number; totalCzk: number;
  odometerKm: number;
};

type Issue = {
  id: string; carId: string; title: string; note?: string;
  createdAt: string; odometerKm?: number;
  status: 'open' | 'resolved'; resolvedAt?: string;
  source: 'text' | 'voice' | 'kyra';
};

type Reminder = {
  id: string; carId: string;
  kind: 'insurance' | 'inspection' | 'vignette' | 'oil' | 'custom';
  label: string; dueDate?: string; dueKm?: number;
};
```

Spotřeba v l/100 km = litry z tankování / kilometry od předchozího tankování × 100. Počítá se z tankování do plna, to ať appka v záznamu umožní označit.

## Kyra (asistent přes Groq)

- Route `POST /api/kyra` volá Groq chat completions s function callingem. Název modelu nehardcoduj, drž ho v `GROQ_MODEL` a aktuální modely s podporou nástrojů si ověř v dokumentaci Groqu.
- Data jsou v `localStorage` v prohlížeči, takže nástroje musí běžet na klientovi. Server vrátí `tool_calls`, klient je vykoná nad úložištěm a pošle výsledky zpět. Smyčku řiď z klienta.
- Nástroje: `get_car_profile`, `get_fuel_stats`, `add_fuel_entry`, `list_issues`, `add_issue`, `resolve_issue`, ve fázi 2 i `get_fault_codes`.
- Systémový prompt česky: krátké odpovědi, nic si nevymýšlet, říct, že data nemá, když je nemá. U věcí kolem brzd a řízení vždy doporučit kontrolu v servisu.
- Hlas: Web Speech API (SpeechRecognition) bývá na iOS v režimu plochy nespolehlivé, takže nestav hlasový vstup jen na něm. Počítej s nahráním přes `MediaRecorder` a přepisem přes Groq (Whisper, `/api/transcribe`). Přesný název modelu si ověř v dokumentaci. Čtení odpovědí nahlas může dělat `speechSynthesis`.
- Hlas Kyry ve vzhledu: její odpovědi jsou v písmu Cormorant Garamond 500 (viz níže).

## Fáze 1: pořadí práce (bez OBD)

Každý krok by měl jít nasadit na Vercel a otevřít na iPhonu.

1. Scaffold, PWA (manifest, ikony včetně `apple-touch-icon`, `theme-color` `#0B0C0B`, `display: standalone`, safe-area), designové tokeny, spodní navigace.
2. Garáž: profil auta, přepínač aut, připomínky, `lib/storage.ts`.
3. Deník: tankování, výpočty, graf.
4. Servis, Moje problémy.
5. Jízda: rychlost z GPS (`watchPosition`, m/s na km/h), Wake Lock. Dlaždice bez zdroje dat ukazují "—". Falešná data jen za příznakem pro vývoj.
6. Kyra: chat, nástroje, mikrofon.
7. Servis, Chyby z auta: zatím ruční zadání kódu a jeho vysvětlení od Kyry.

## Fáze 2: čtení z auta

- Danny objednal VAG KKL USB kabel (K-line) a redukci USB-C na USB-A pro MacBook. Fabia z ročníku 2001 mluví po pomalé K-line (ISO 9141, KW1281, kolem 10 400 baud), takže hodnoty chodí po pár za sekundu. Teplotu oleje ani hladinu paliva neposílá.
- Abstrakce `ObdSource` s metodami `connect()`, `readFaultCodes()` a `readLive()` jako asynchronní proud vzorků. Implementace `MockSource` hned, `Kw1281Source` později, další zdroje (bezdrátový adaptér, ESP32) se zapojí stejným rozhraním.
- Riziko: 5baudová inicializace spojení v prohlížeči přes Web Serial není samozřejmá. Možná bude potřeba malý lokální most v Node na MacBooku. Dobrý referenční zdroj je open-source projekt `gmenounos/kw1281test` na GitHubu. Použij jen čtecí funkce (chybové kódy, identifikace, měřicí bloky).
- Web Serial funguje jen v Chromiu na desktopu, na iPhonu ne.

## Pravidla vzhledu

- Barvy: pozadí `#0B0C0B`, plocha `#141614`, plocha 2 `#1B1E1B`, linka `#262A27`, text `#ECE7DA`, tlumený text `#8C897E`, hlavní akcent zlatá `#D6B36A`, zelená `#7FA58A`, varování `#E2634A`. Karta od Kyry má pozadí `#101A15` a ohraničení `#22352B`.
- Písma: Manrope pro celé rozhraní, nadpisy Manrope 700 s mezerou písmen −0,8 px. Cormorant Garamond 500 jen pro hlas Kyry. Žádný italic.
- Ikony jako inline SVG se stopou 1,6, bez emoji. Dotykové cíle alespoň 44 px. Čísla s tabulárními číslicemi. Kontrast textu na tmavém aspoň 4,5:1. Skutečné `<button>` a `<a>`, ne divy s onClick.
- Styl: japonský minimalismus a dark academia, dotažení na úrovni Apple nebo Revolut. Střídmě, žádné záře, přechody ani ozdoby navíc. Ciferník rychlosti už dvakrát vyšel moc, finální verze je jeden tenký oblouk kolem velkého čísla.

## Jak pracovat

Dělej to po krocích a po každém ukaž, co běží. Ptej se jen na věci, které ví jenom Danny (třeba jaké má iPhone, kde chce nasadit, co chce v dalším kroku). Danny je solo vývojář, píše česky a má rád rychlé iterace.

## Next.js

@AGENTS.md

