// Tool schemas sent to Groq. Executed on the client (data lives in localStorage),
// see lib/kyra/tool-runner.ts.

export type ToolName =
  | "get_car_profile"
  | "get_fuel_stats"
  | "add_fuel_entry"
  | "list_issues"
  | "add_issue"
  | "resolve_issue"
  | "get_reminders"
  | "get_fault_codes";

type ToolDef = {
  type: "function";
  function: {
    name: ToolName;
    description: string;
    parameters: Record<string, unknown>;
  };
};

const noParams = { type: "object", properties: {} };

export const TOOL_DEFS: ToolDef[] = [
  {
    type: "function",
    function: {
      name: "get_car_profile",
      description: "Aktivní auto uživatele: název, motor, SPZ a stav tachometru.",
      parameters: noParams,
    },
  },
  {
    type: "function",
    function: {
      name: "get_fuel_stats",
      description:
        "Statistiky tankování aktivního auta: průměrná spotřeba v l/100 km, útrata a počet tankování za aktuální měsíc a posledních 5 tankování.",
      parameters: noParams,
    },
  },
  {
    type: "function",
    function: {
      name: "add_fuel_entry",
      description:
        "Zapíše tankování do deníku aktivního auta. Potřebuje litry, stav tachometru a buď celkovou cenu, nebo cenu za litr.",
      parameters: {
        type: "object",
        properties: {
          liters: { type: "number", description: "Natankované litry." },
          total_czk: { type: "number", description: "Celková cena v Kč." },
          price_per_liter: { type: "number", description: "Cena za litr v Kč." },
          odometer_km: { type: "number", description: "Stav tachometru v km při tankování." },
          is_full: {
            type: "boolean",
            description: "Natankováno do plna. Výchozí true, pokud uživatel neřekne jinak.",
          },
          date: { type: "string", description: "Datum YYYY-MM-DD, výchozí dnes." },
        },
        required: ["liters", "odometer_km"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_issues",
      description: "Problémy s autem, které si uživatel zapsal, s jejich id.",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["open", "resolved", "all"], description: "Výchozí open." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_issue",
      description: "Zapíše nový problém s autem (co se děje, krátce).",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Krátký název problému, např. „Skřípe přední brzda“." },
          note: { type: "string", description: "Podrobnosti, kdy a jak se to projevuje." },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "resolve_issue",
      description: "Označí problém jako vyřešený. Id získáš z list_issues.",
      parameters: {
        type: "object",
        properties: { issue_id: { type: "string" } },
        required: ["issue_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_reminders",
      description: "Připomínky aktivního auta (pojištění, STK, dálniční známka, olej, vlastní) a kolik zbývá.",
      parameters: noParams,
    },
  },
  {
    type: "function",
    function: {
      name: "get_fault_codes",
      description:
        "Chybové kódy aktivního auta (zadané ručně nebo přečtené z auta) s vysvětlením a závažností, pokud už je má.",
      parameters: noParams,
    },
  },
];
