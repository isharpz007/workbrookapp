import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { prepare: false });
const cols = await sql`
  select column_name from information_schema.columns
  where table_name = 'memories'
    and column_name in ('company','work_location','month','day','person_phone','thank_you_message')
  order by column_name`;
const tbl = await sql`
  select table_name from information_schema.tables
  where table_name = 'thank_you_messages'`;
console.log("new columns:", cols.map((c) => c.column_name).join(", ") || "NONE");
console.log("thank_you_messages table:", tbl.length ? "exists" : "MISSING");
await sql.end();
