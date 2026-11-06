// Diagnostic: try pooler endpoints and report the distinct error signatures.
import postgres from "postgres";

const url = new URL(process.env.DATABASE_URL);
const ref = url.hostname.split(".")[1];
const pass = decodeURIComponent(url.password);

const regions = [
  "us-east-1", "us-east-2", "us-west-1", "us-west-2",
  "ca-central-1", "sa-east-1",
  "eu-west-1", "eu-west-2", "eu-west-3", "eu-central-1", "eu-central-2",
  "eu-north-1", "eu-south-1", "eu-south-2",
  "ap-southeast-1", "ap-southeast-2", "ap-southeast-3",
  "ap-south-1", "ap-south-2",
  "ap-northeast-1", "ap-northeast-2", "ap-northeast-3",
  "af-south-1", "me-south-1", "me-central-1", "il-central-1", "mx-central-1",
];

const seen = new Map();
for (const port of [6543, 5432]) {
  for (const aws of ["aws-0", "aws-1"]) {
    for (const region of regions) {
      const host = `${aws}-${region}.pooler.supabase.com`;
      const uri = `postgresql://postgres.${ref}:${encodeURIComponent(pass)}@${host}:${port}/postgres`;
      try {
        const sql = postgres(uri, { prepare: false, max: 1, connect_timeout: 3 });
        await sql`select 1 as ok`;
        console.log(`SUCCESS port=${port} host=${host}`);
        await sql.end();
        process.exit(0);
      } catch (e) {
        const key = `${e.code || ""} ${String(e.message).slice(0, 80)}`;
        if (!seen.has(key)) {
          seen.set(key, host);
          console.log(`ERR [${host}:${port}] ${key}`);
        }
      }
    }
  }
}
console.log("done. distinct errors:", seen.size);
process.exit(1);
