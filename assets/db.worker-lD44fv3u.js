import{PGlite as L}from"https://cdn.jsdelivr.net/npm/@electric-sql/pglite@0.4.5/dist/index.min.js";let t=null,u=null;async function I(e){if(t){console.log("[W1] already initialized, skipping duplicate init"),self.postMessage({seq:e.seq,type:"DB_READY"});return}console.log("[W1] init start"),u=e.embedPort,t=new L("idb://rss-reader"),await t.waitReady,console.log("[W1] PGlite ready"),await t.exec(`
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
  `),await t.exec("CREATE INDEX IF NOT EXISTS idx_items_site ON items(site_id)"),await t.exec("CREATE INDEX IF NOT EXISTS idx_items_read ON items(is_read)"),await t.exec("CREATE INDEX IF NOT EXISTS idx_items_pub_date ON items(pub_date DESC)");try{await t.exec("CREATE INDEX IF NOT EXISTS idx_items_fts ON items USING gin(search_vector)"),console.log("[W1] GIN index created")}catch{console.log("[W1] GIN index not supported, tsvector may be unavailable")}console.log("[W1] init done"),self.postMessage({seq:e.seq,type:"DB_READY"})}function N(e){return/[\u4e00-\u9fff]/.test(e)?"zh":"en"}async function f(e){if(!t)return;const{siteId:s,items:r}=e,i=new Set,a=r.filter(c=>i.has(c.itemId)?!1:(i.add(c.itemId),!0));a.length!==r.length&&console.log(`[W1] upsertItems: deduped ${r.length-a.length} duplicates for ${s}`),console.log(`[W1] upsertItems: ${a.length} items for ${s}`);const n=20;for(let c=0;c<a.length;c+=n){const m=a.slice(c,c+n),T=[],_=[];let o=1;for(const d of m){const E=N((d.title||"")+" "+(d.description||"")),l=`${d.title||""} ${d.description||""}`;T.push(`(md5($${o}),$${o},$${o+1},$${o+2},$${o+3},$${o+4},$${o+5},$${o+6},$${o+7},$${o+8},$${o+9},
        CASE WHEN $${o+10} = 'zh' THEN to_tsvector('simple', $${o+10}) ELSE to_tsvector('english', $${o+10}) END
      )`),_.push(d.itemId,s,d.itemId,d.title||"",d.link||"",d.description||"",d.pubDate||"",d.readAt?1:0,d.readAt||null,E,l),o+=11}try{await t.query(`INSERT INTO items (id, item_id, site_id, guid, title, link, description, pub_date, is_read, read_at, lang, search_vector)
         VALUES ${T.join(",")}
         ON CONFLICT (id) DO UPDATE SET
           title = COALESCE(NULLIF(EXCLUDED.title, ''), items.title),
           link = COALESCE(NULLIF(EXCLUDED.link, ''), items.link),
           description = COALESCE(NULLIF(EXCLUDED.description, ''), items.description),
           pub_date = COALESCE(NULLIF(EXCLUDED.pub_date, ''), items.pub_date),
           is_read = items.is_read,
           read_at = items.read_at`,_)}catch(d){console.error("[W1] batch insert error:",d?.message||d);for(const E of m)try{const l=N((E.title||"")+" "+(E.description||"")),p=`${E.title||""} ${E.description||""}`;await t.query(`INSERT INTO items (id, item_id, site_id, guid, title, link, description, pub_date, is_read, read_at, lang, search_vector)
             VALUES (md5($1), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
               CASE WHEN $10 = 'zh' THEN to_tsvector('simple', $11) ELSE to_tsvector('english', $11) END)
             ON CONFLICT (id) DO UPDATE SET
               is_read = items.is_read,
               read_at = items.read_at`,[E.itemId,s,E.itemId,E.title||"",E.link||"",E.description||"",E.pubDate||"",E.readAt?1:0,E.readAt||null,l,p])}catch(l){console.error("[W1] individual insert error:",l?.message||l,"itemId:",E.itemId?.slice(0,40))}}}console.log(`[W1] UPSERT_DONE for ${s}: ${a.length} items`),self.postMessage({seq:e.seq,type:"UPSERT_DONE"}),u?(u.postMessage({type:"embed",items:a.map(c=>({id:c.itemId,text:`${c.title||""} ${c.description||""}`}))}),console.log(`[W1] relayed ${a.length} items to W2 for embedding`)):console.warn(`[W1] embedPort is null, cannot relay ${a.length} items to W2`)}async function g(e){if(!t)return;const{query:s,siteId:r}=e,i=performance.now();let a=[];try{const c=N(s)==="zh"?"simple":"english",T=[s.trim().replace(/\s+/g," & "),c];let _=`SELECT item_id, site_id, title, description, pub_date
       FROM items
       WHERE search_vector @@ to_tsquery($2, $1)
       ORDER BY ts_rank(search_vector, to_tsquery($2, $1)) DESC
       LIMIT 20`;r&&(_=`SELECT item_id, site_id, title, description, pub_date
         FROM items
         WHERE site_id = $3 AND search_vector @@ to_tsquery($2, $1)
         ORDER BY ts_rank(search_vector, to_tsquery($2, $1)) DESC
         LIMIT 20`,T.push(r)),a=(await t.query(_,T)).rows,a.length>0&&console.log(`[W1] tsvector search "${s}" found ${a.length} results (${(performance.now()-i).toFixed(0)}ms)`)}catch(n){console.log("[W1] tsvector search failed, falling back to ~*:",n?.message?.slice(0,60))}if(a.length===0)try{const n=s.replace(/[.*+?^${}()|[\]\\]/g,"\\$&").replace(/'/g,"''"),c=r?` AND site_id = '${r.replace(/'/g,"''")}'`:"";a=(await t.query(`SELECT item_id, site_id, title, description, pub_date
         FROM items
         WHERE (title ~* '${n}' OR description ~* '${n}')
         ${c}
         LIMIT 20`)).rows}catch(n){console.error("[W1] ~* search error:",n?.message||n)}self.postMessage({seq:e.seq,type:"SEARCH_RESULTS",items:a.map((n,c)=>({itemId:n.item_id,siteId:n.site_id,title:n.title,snippet:(n.description||"").slice(0,200),pubDate:n.pub_date,rank:c+1}))})}async function $(e){if(t){console.log(`[W1] fetchDetails: ${e.ids?.length} IDs`);try{const s=e.ids.map((i,a)=>`$${a+1}`).join(","),r=await t.query(`SELECT item_id, site_id, title, description, pub_date
       FROM items
       WHERE item_id IN (${s})`,e.ids);self.postMessage({seq:e.seq,type:"FETCH_DETAILS",items:r.rows.map((i,a)=>({itemId:i.item_id,siteId:i.site_id,title:i.title,snippet:(i.description||"").slice(0,200),pubDate:i.pub_date,rank:a+1}))})}catch(s){console.error("[W1] fetchDetails error:",s?.message||s),self.postMessage({seq:e.seq,type:"FETCH_DETAILS",items:[]})}}}async function D(e){t&&(await t.query("UPDATE items SET is_read = 1, read_at = now() WHERE id = md5($1)",[e.itemId]),self.postMessage({seq:e.seq,type:"MARK_READ_DONE"}))}async function A(e){t&&(await t.query("UPDATE items SET is_read = 1, read_at = now() WHERE site_id = $1",[e.siteId]),self.postMessage({seq:e.seq,type:"MARK_SITE_READ_DONE"}))}async function O(){t&&await t.query("UPDATE items SET is_read = 1, read_at = now()")}async function R(e){if(t)try{const s=await t.query("SELECT is_read FROM items WHERE id = md5($1)",[e.itemId]);self.postMessage({seq:e.seq,type:"IS_READ",isRead:s.rows?.[0]?.is_read===1})}catch{self.postMessage({seq:e.seq,type:"IS_READ",isRead:!1})}}async function S(e){if(t)try{const s=await t.query("SELECT COUNT(*) AS cnt FROM items WHERE site_id = $1 AND is_read = 0",[e.siteId]);self.postMessage({seq:e.seq,type:"UNREAD_COUNT",count:s.rows?.[0]?.cnt??0})}catch{self.postMessage({seq:e.seq,type:"UNREAD_COUNT",count:0})}}async function h(e){if(t)try{const s=await t.query("SELECT site_id, COUNT(*) AS cnt FROM items WHERE is_read = 0 GROUP BY site_id"),r={};for(const i of s.rows??[])r[i.site_id]=i.cnt;self.postMessage({seq:e,type:"ALL_UNREAD_COUNTS",counts:r})}catch{self.postMessage({seq:e,type:"ALL_UNREAD_COUNTS",counts:{}})}}async function U(e){if(t)try{const s=await t.query("SELECT item_id, title, pub_date, read_at FROM items WHERE site_id = $1",[e.siteId]);self.postMessage({seq:e.seq,type:"ITEMS_FOR_COMMIT",items:s.rows.map(r=>({itemId:r.item_id,title:r.title,pubDate:r.pub_date,readAt:r.read_at||void 0}))})}catch{self.postMessage({seq:e.seq,type:"ITEMS_FOR_COMMIT",items:[]})}}async function C(e){if(t){await t.exec("DROP TABLE IF EXISTS items CASCADE"),await t.exec(`
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
  `),await t.exec("CREATE INDEX IF NOT EXISTS idx_items_site ON items(site_id)"),await t.exec("CREATE INDEX IF NOT EXISTS idx_items_read ON items(is_read)"),await t.exec("CREATE INDEX IF NOT EXISTS idx_items_pub_date ON items(pub_date DESC)");try{await t.exec("CREATE INDEX IF NOT EXISTS idx_items_fts ON items USING gin(search_vector)")}catch{}console.log("[W1] cleared"),self.postMessage({seq:e.seq,type:"CLEAR_DONE"})}}self.onmessage=async e=>{const{seq:s,type:r,...i}=e.data;try{switch(r){case"init":await I({seq:s,...i});break;case"upsert":await f({seq:s,...i});break;case"search":await g({seq:s,...i});break;case"fetchDetails":await $({seq:s,...i});break;case"markRead":await D({seq:s,...i});break;case"markSiteRead":await A({seq:s,...i});break;case"markAllRead":await O();break;case"isRead":await R({seq:s,...i});break;case"getUnreadCount":await S({seq:s,...i});break;case"getAllUnreadCounts":await h(s);break;case"getItemsForCommit":await U({seq:s,...i});break;case"clear":await C({seq:s,...i});break;default:console.warn("[W1] unknown message type:",r)}}catch(a){console.error("[W1] handler error:",r,a?.message||a),self.postMessage({seq:s,type:"ERROR",error:a?.message||String(a)})}};
//# sourceMappingURL=db.worker-lD44fv3u.js.map
