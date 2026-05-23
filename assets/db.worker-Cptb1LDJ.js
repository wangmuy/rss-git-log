import{PGlite as p}from"https://cdn.jsdelivr.net/npm/@electric-sql/pglite@0.4.5/dist/index.min.js";let t=null,_=null;async function u(e){if(t){console.log("[W1] already initialized, skipping duplicate init"),self.postMessage({seq:e.seq,type:"DB_READY"});return}console.log("[W1] init start"),_=e.embedPort,t=new p("idb://rss-reader"),await t.waitReady,console.log("[W1] PGlite ready"),await t.exec(`
    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      item_id TEXT NOT NULL,
      site_id TEXT NOT NULL,
      guid TEXT NOT NULL DEFAULT '',
      title TEXT NOT NULL DEFAULT '',
      link TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      pub_date TEXT NOT NULL DEFAULT '',
      is_read INTEGER NOT NULL DEFAULT 0,
      read_at TEXT,
      fetched_at TEXT NOT NULL DEFAULT (now()),
      lang TEXT NOT NULL DEFAULT 'en',
      search_vector tsvector
    )
  `),await t.exec("CREATE INDEX IF NOT EXISTS idx_items_site ON items(site_id)"),await t.exec("CREATE INDEX IF NOT EXISTS idx_items_read ON items(is_read)"),await t.exec("CREATE INDEX IF NOT EXISTS idx_items_pub_date ON items(pub_date DESC)");try{await t.exec("CREATE INDEX IF NOT EXISTS idx_items_fts ON items USING gin(search_vector)"),console.log("[W1] GIN index created")}catch{console.log("[W1] GIN index not supported, tsvector may be unavailable")}console.log("[W1] init done"),self.postMessage({seq:e.seq,type:"DB_READY"})}function m(e){return/[\u4e00-\u9fff]/.test(e)?"zh":"en"}async function L(e){if(!t)return;const{siteId:s,items:i}=e;console.log(`[W1] upsertItems: ${i.length} items for ${s}`);const a=20;for(let r=0;r<i.length;r+=a){const o=i.slice(r,r+a),E=[],T=[];let n=1;for(const c of o){const d=m((c.title||"")+" "+(c.description||"")),l=`${c.title||""} ${c.description||""}`;E.push(`(md5($${n}),$${n},$${n+1},$${n+2},$${n+3},$${n+4},$${n+5},$${n+6},$${n+7},$${n+8},$${n+9},
        CASE WHEN $${n+10} = 'zh' THEN to_tsvector('simple', $${n+10}) ELSE to_tsvector('english', $${n+10}) END
      )`),T.push(c.itemId,s,c.itemId,c.title||"",c.link||"",c.description||"",c.pubDate||"",c.readAt?1:0,c.readAt||null,d,l),n+=11}try{await t.query(`INSERT INTO items (id, item_id, site_id, guid, title, link, description, pub_date, is_read, read_at, lang, search_vector)
         VALUES ${E.join(",")}
         ON CONFLICT (id) DO UPDATE SET
           title = COALESCE(NULLIF(EXCLUDED.title, ''), items.title),
           link = COALESCE(NULLIF(EXCLUDED.link, ''), items.link),
           description = COALESCE(NULLIF(EXCLUDED.description, ''), items.description),
           pub_date = COALESCE(NULLIF(EXCLUDED.pub_date, ''), items.pub_date),
           is_read = items.is_read,
           read_at = items.read_at`,T)}catch(c){console.error("[W1] batch insert error:",c?.message||c);for(const d of o)try{const l=m((d.title||"")+" "+(d.description||"")),N=`${d.title||""} ${d.description||""}`;await t.query(`INSERT INTO items (id, item_id, site_id, guid, title, link, description, pub_date, is_read, read_at, lang, search_vector)
             VALUES (md5($1), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
               CASE WHEN $10 = 'zh' THEN to_tsvector('simple', $11) ELSE to_tsvector('english', $11) END)
             ON CONFLICT (id) DO UPDATE SET
               is_read = items.is_read,
               read_at = items.read_at`,[d.itemId,s,d.itemId,d.title||"",d.link||"",d.description||"",d.pubDate||"",d.readAt?1:0,d.readAt||null,l,N])}catch(l){console.error("[W1] individual insert error:",l?.message||l,"itemId:",d.itemId?.slice(0,40))}}}console.log(`[W1] UPSERT_DONE for ${s}: ${i.length} items`),self.postMessage({seq:e.seq,type:"UPSERT_DONE"}),_?(_.postMessage({type:"embed",items:i.map(r=>({id:r.itemId,text:`${r.title||""} ${r.description||""}`}))}),console.log(`[W1] relayed ${i.length} items to W2 for embedding`)):console.warn(`[W1] embedPort is null, cannot relay ${i.length} items to W2`)}async function I(e){if(!t)return;const{query:s,siteId:i}=e,a=performance.now();let r=[];try{const E=m(s)==="zh"?"simple":"english",n=[s.trim().replace(/\s+/g," & "),E];let c=`SELECT item_id, site_id, title, description, pub_date
       FROM items
       WHERE search_vector @@ to_tsquery($2, $1)
       ORDER BY ts_rank(search_vector, to_tsquery($2, $1)) DESC
       LIMIT 20`;i&&(c=`SELECT item_id, site_id, title, description, pub_date
         FROM items
         WHERE site_id = $3 AND search_vector @@ to_tsquery($2, $1)
         ORDER BY ts_rank(search_vector, to_tsquery($2, $1)) DESC
         LIMIT 20`,n.push(i)),r=(await t.query(c,n)).rows,r.length>0&&console.log(`[W1] tsvector search "${s}" found ${r.length} results (${(performance.now()-a).toFixed(0)}ms)`)}catch(o){console.log("[W1] tsvector search failed, falling back to ~*:",o?.message?.slice(0,60))}if(r.length===0)try{const o=s.replace(/[.*+?^${}()|[\]\\]/g,"\\$&").replace(/'/g,"''"),E=i?` AND site_id = '${i.replace(/'/g,"''")}'`:"";r=(await t.query(`SELECT item_id, site_id, title, description, pub_date
         FROM items
         WHERE (title ~* '${o}' OR description ~* '${o}')
         ${E}
         LIMIT 20`)).rows}catch(o){console.error("[W1] ~* search error:",o?.message||o)}self.postMessage({seq:e.seq,type:"SEARCH_RESULTS",items:r.map((o,E)=>({itemId:o.item_id,siteId:o.site_id,title:o.title,snippet:(o.description||"").slice(0,200),pubDate:o.pub_date,rank:E+1}))})}async function $(e){if(t){console.log(`[W1] fetchDetails: ${e.ids?.length} IDs`);try{const s=e.ids.map((a,r)=>`$${r+1}`).join(","),i=await t.query(`SELECT item_id, site_id, title, description, pub_date
       FROM items
       WHERE item_id IN (${s})`,e.ids);self.postMessage({seq:e.seq,type:"FETCH_DETAILS",items:i.rows.map((a,r)=>({itemId:a.item_id,siteId:a.site_id,title:a.title,snippet:(a.description||"").slice(0,200),pubDate:a.pub_date,rank:r+1}))})}catch(s){console.error("[W1] fetchDetails error:",s?.message||s),self.postMessage({seq:e.seq,type:"FETCH_DETAILS",items:[]})}}}async function D(e){t&&(await t.query("UPDATE items SET is_read = 1, read_at = now() WHERE id = md5($1)",[e.itemId]),self.postMessage({seq:e.seq,type:"MARK_READ_DONE"}))}async function f(e){t&&(await t.query("UPDATE items SET is_read = 1, read_at = now() WHERE site_id = $1",[e.siteId]),self.postMessage({seq:e.seq,type:"MARK_SITE_READ_DONE"}))}async function g(){t&&await t.query("UPDATE items SET is_read = 1, read_at = now()")}async function A(e){if(t)try{const s=await t.query("SELECT is_read FROM items WHERE id = md5($1)",[e.itemId]);self.postMessage({seq:e.seq,type:"IS_READ",isRead:s.rows?.[0]?.is_read===1})}catch{self.postMessage({seq:e.seq,type:"IS_READ",isRead:!1})}}async function O(e){if(t)try{const s=await t.query("SELECT COUNT(*) AS cnt FROM items WHERE site_id = $1 AND is_read = 0",[e.siteId]);self.postMessage({seq:e.seq,type:"UNREAD_COUNT",count:s.rows?.[0]?.cnt??0})}catch{self.postMessage({seq:e.seq,type:"UNREAD_COUNT",count:0})}}async function R(e){if(t)try{const s=await t.query("SELECT site_id, COUNT(*) AS cnt FROM items WHERE is_read = 0 GROUP BY site_id"),i={};for(const a of s.rows??[])i[a.site_id]=a.cnt;self.postMessage({seq:e,type:"ALL_UNREAD_COUNTS",counts:i})}catch{self.postMessage({seq:e,type:"ALL_UNREAD_COUNTS",counts:{}})}}async function S(e){if(t)try{const s=await t.query("SELECT item_id, title, pub_date, read_at FROM items WHERE site_id = $1",[e.siteId]);self.postMessage({seq:e.seq,type:"ITEMS_FOR_COMMIT",items:s.rows.map(i=>({itemId:i.item_id,title:i.title,pubDate:i.pub_date,readAt:i.read_at||void 0}))})}catch{self.postMessage({seq:e.seq,type:"ITEMS_FOR_COMMIT",items:[]})}}async function U(e){if(t){await t.exec("DROP TABLE IF EXISTS items CASCADE"),await t.exec(`
    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      item_id TEXT NOT NULL,
      site_id TEXT NOT NULL,
      guid TEXT NOT NULL DEFAULT '',
      title TEXT NOT NULL DEFAULT '',
      link TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      pub_date TEXT NOT NULL DEFAULT '',
      is_read INTEGER NOT NULL DEFAULT 0,
      read_at TEXT,
      fetched_at TEXT NOT NULL DEFAULT (now()),
      lang TEXT NOT NULL DEFAULT 'en',
      search_vector tsvector
    )
  `),await t.exec("CREATE INDEX IF NOT EXISTS idx_items_site ON items(site_id)"),await t.exec("CREATE INDEX IF NOT EXISTS idx_items_read ON items(is_read)"),await t.exec("CREATE INDEX IF NOT EXISTS idx_items_pub_date ON items(pub_date DESC)");try{await t.exec("CREATE INDEX IF NOT EXISTS idx_items_fts ON items USING gin(search_vector)")}catch{}console.log("[W1] cleared"),self.postMessage({seq:e.seq,type:"CLEAR_DONE"})}}self.onmessage=async e=>{const{seq:s,type:i,...a}=e.data;try{switch(i){case"init":await u({seq:s,...a});break;case"upsert":await L({seq:s,...a});break;case"search":await I({seq:s,...a});break;case"fetchDetails":await $({seq:s,...a});break;case"markRead":await D({seq:s,...a});break;case"markSiteRead":await f({seq:s,...a});break;case"markAllRead":await g();break;case"isRead":await A({seq:s,...a});break;case"getUnreadCount":await O({seq:s,...a});break;case"getAllUnreadCounts":await R(s);break;case"getItemsForCommit":await S({seq:s,...a});break;case"clear":await U({seq:s,...a});break;default:console.warn("[W1] unknown message type:",i)}}catch(r){console.error("[W1] handler error:",i,r?.message||r),self.postMessage({seq:s,type:"ERROR",error:r?.message||String(r)})}};
//# sourceMappingURL=db.worker-Cptb1LDJ.js.map
