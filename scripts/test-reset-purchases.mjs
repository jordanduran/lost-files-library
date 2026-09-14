import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";

const db = new PGlite();
try {
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create table auth.users(id uuid primary key,email text);
    create function auth.uid() returns uuid language sql stable as $$select null::uuid$$;`);
  for (const name of ["202609120001_accounts_and_catalog", "202609120002_test_checkout", "202609130001_purchase_emails", "202609140004_pack_guest_checkout", "202609140005_verified_downloads"]) {
    await db.exec(await readFile(new URL(`../supabase/migrations/${name}.sql`, import.meta.url), "utf8"));
  }
  const user = "00000000-0000-0000-0000-000000000001";
  await db.query("insert into auth.users values($1,'test@example.test')", [user]);
  await db.exec(`insert into public.products(id,slug,title,producer,genre,bpm,musical_key,duration_seconds,artwork)
    values('pack','pack','Pack','Demo','Demo',80,'C',10,'paper');
    insert into public.product_licenses(product_id,id,name,description,price_cents) values('pack','pack','License','Terms',100);`);
  // Paid account test, pending guest test, and real paid order.
  for (let i=1;i<=3;i++) {
    const id = `10000000-0000-0000-0000-00000000000${i}`;
    const request = `20000000-0000-0000-0000-00000000000${i}`;
    await db.query("insert into public.orders(id,user_id,total_cents,is_test,status,paid_at) values($1,$2,100,$3,$4,now())", [id,i===2?null:user,i!==3,i===2?'pending':'paid']);
    await db.query("insert into public.order_items(order_id,product_id,license_id,product_title,license_name,license_terms,unit_price_cents) values($1,'pack','pack','Pack','License','Terms',100)",[id]);
    await db.query("insert into public.order_access(order_id,token,request_id) values($1,$2,$3)", [id,String(i).repeat(64),request]);
    await db.query("insert into public.purchase_emails(order_id,recipient) values($1,'test@example.test')", [id]);
    await db.query("insert into public.download_browser_sessions values($1,$2,now()+interval '7 days')",[id,"a".repeat(64)]);
    await db.query("insert into public.download_email_codes(order_id,challenge_id,code_hash,browser_hash,expires_at,last_sent_at,window_started_at,send_count) values($1,$2,$3,$3,now()+interval '10 minutes',now(),now(),1)",[id,request,"b".repeat(64)]);
  }
  const reset = await readFile(new URL("../supabase/maintenance/reset_test_purchases.sql",import.meta.url),"utf8");
  await db.exec(reset);
  for (const table of ["orders","order_items","order_access","purchase_emails","download_browser_sessions","download_email_codes"]) {
    const rows=(await db.query(`select * from public.${table}`)).rows;
    assert.equal(rows.length,1,`${table}: preserve real purchase only`);
    assert.equal(rows[0].order_id ?? rows[0].id,"10000000-0000-0000-0000-000000000003");
  }
  assert.equal((await db.query("select * from auth.users")).rows.length,1);
  assert.equal((await db.query("select * from public.products")).rows.length,1);
  await db.exec(reset);
  assert.equal((await db.query("select * from public.orders")).rows.length,1,"Safe to repeat");
  console.log("Reset passed: account/guest test orders removed, real purchases and accounts preserved, repeat run succeeds.");
} finally { await db.close(); }
