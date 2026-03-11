import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url)
  throw new Error("SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL is required");
if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required");

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

type Placement = {
  stage_id: number;
  side: "player" | "enemy";
  row_no: number;
  col_no: number;
  piece_id: number;
};

function stats(values: number[]) {
  if (values.length === 0) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  return { min, max, avg: Number(avg.toFixed(2)) };
}

const { data, error } = await supabase
  .schema("master")
  .from("m_stage_initial_placement")
  .select("stage_id,side,row_no,col_no,piece_id")
  .order("stage_id", { ascending: true });

if (error) throw new Error(error.message);

const rows = (data ?? []) as Placement[];
console.log(`total placements: ${rows.length}`);

if (rows.length === 0) {
  console.log("No placement data found.");
  process.exit(0);
}

const bySide = {
  player: rows.filter((r) => r.side === "player"),
  enemy: rows.filter((r) => r.side === "enemy"),
};

for (const side of ["player", "enemy"] as const) {
  const arr = bySide[side];
  const rowStats = stats(arr.map((r) => r.row_no));
  const colStats = stats(arr.map((r) => r.col_no));
  console.log(`\n[${side}] count=${arr.length}`);
  console.log(` row stats: ${JSON.stringify(rowStats)}`);
  console.log(` col stats: ${JSON.stringify(colStats)}`);
}

// Detect same cell occupied by both sides in same stage.
const crossSideOverlaps: Array<{
  stageId: number;
  rowNo: number;
  colNo: number;
}> = [];
const cellMap = new Map<string, Set<string>>();

for (const r of rows) {
  const key = `${r.stage_id}:${r.row_no}:${r.col_no}`;
  const sides = cellMap.get(key) ?? new Set<string>();
  sides.add(r.side);
  cellMap.set(key, sides);
}

for (const [key, sides] of cellMap.entries()) {
  if (sides.size > 1) {
    const [stageId, rowNo, colNo] = key.split(":").map(Number);
    crossSideOverlaps.push({ stageId, rowNo, colNo });
  }
}

console.log(`\ncross-side overlap cells: ${crossSideOverlaps.length}`);
if (crossSideOverlaps.length > 0) {
  console.log("sample overlaps (max 20):");
  for (const row of crossSideOverlaps.slice(0, 20)) {
    console.log(` stage=${row.stageId} row=${row.rowNo} col=${row.colNo}`);
  }
}

// Show per-stage side row ranges for orientation check.
const stageIds = Array.from(new Set(rows.map((r) => r.stage_id))).sort(
  (a, b) => a - b,
);
console.log("\nper-stage row ranges (player vs enemy):");
for (const stageId of stageIds.slice(0, 100)) {
  const stageRows = rows.filter((r) => r.stage_id === stageId);
  const p = stageRows.filter((r) => r.side === "player").map((r) => r.row_no);
  const e = stageRows.filter((r) => r.side === "enemy").map((r) => r.row_no);
  const ps = stats(p);
  const es = stats(e);
  console.log(
    ` stage=${stageId} player=${ps ? `${ps.min}-${ps.max} (avg:${ps.avg})` : "none"} enemy=${es ? `${es.min}-${es.max} (avg:${es.avg})` : "none"}`,
  );
}
