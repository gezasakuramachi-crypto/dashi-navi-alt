/* =========================
 *  桜町区 山車ナビ - app.js（完成版）
 *  - 経路図：data/ 配下の k*.geojson（青い実線）
 *  - 交通規制：GeoJSON（従来どおり）
 *  - 配信時間内のみライブ更新／時間外は固定座標
 *  - 現在地：青点＋誤差円（最前面）
 * ========================= */

/* ========= 基本設定 ========= */
const CONFIG = {
  SERVER_BASE: "https://traccar-railway.fly.dev",
  DEVICE_ID: 1,
  PUBLIC_BEARER:
    "RzBFAiEAgbx61XQasV2upPQVJbBqrLh-xXi3-itlpVvbfW8XyGQCIEltaFXtQnEqVcz0W1Ajxc202t3DYetBvT4LIi1_B5B_eyJ1Ijo3LCJlIjoiMjAyNS0wOS0wM1QxNTowMDowMC4wMDArMDA6MDAifQ",
  POLL_MS: 5000,

  ICONS: {
    sakura: "https://gezasakuramachi-crypto.github.io/dashi-navi/mark/sakura.png",
  },
};

const MAP_CENTER = { lat: 35.966, lng: 140.628 };
const MAP_ZOOM   = 15;

/* 配信外：固定表示座標（35°57'50.5"N 140°37'53.3"E） */
const OFF_MARK_POS = { lat: 35.9640278, lng: 140.6314722 };

/* ========= スタイル ========= */
/* 交通規制 */
const STYLE = {
  line:   { strokeColor:"#ff0000", strokeOpacity:1, strokeWeight:1.0, zIndex:3002 },
  polygon:{ strokeColor:"#ff0000", strokeOpacity:1, strokeWeight:1.0, fillColor:"#ff99cc", fillOpacity:0.35, zIndex:3002 }
};
/* 経路線（青） */
const ROUTE_STYLE = {
  strokeColor: "#1e88e5",
  strokeOpacity: 1,
  strokeWeight: 3,
  zIndex: 3200
};
/* 走行エリア（外周青線・塗り無し） */
const RUNAREA_STYLE = { strokeColor:"#1e88e5", strokeOpacity:0.95, strokeWeight:2, fillOpacity:0, zIndex:2900 };

/* ========= データURL ========= */
const DATA_BASE = "https://gezasakuramachi-crypto.github.io/dashi-navi/data/";
const routeUrl  = (name) => DATA_BASE + encodeURIComponent(name);

const RUNAREA_SRC       = DATA_BASE + "run-area.geojson";
const MAP_VIEWPORT_SRC  = DATA_BASE + "map-viewport.geojson";

/* === 交通規制スロット === */
const DAYS = [
  { id:"d1", label:"9/1", slots:[
    { shortLabel:"10:30-", key:"91-1030-1500", src: DATA_BASE + "91-1030-1500.geojson" },
    { shortLabel:"15:00-", key:"91-1500-1600", src: DATA_BASE + "91-1500-1600.geojson" },
    { shortLabel:"16:00-", key:"91-1600-1930", src: DATA_BASE + "91-1600-1930.geojson" },
    { shortLabel:"19:30-", key:"91-1930-2045", src: DATA_BASE + "91-1930-2045.geojson" },
    { shortLabel:"20:45-", key:"91-2045-2200", src: DATA_BASE + "91-2045-2200.geojson" },
  ]},
  { id:"d2", label:"9/2", slots:[
    { shortLabel:"11:00-", key:"92-1100-1230", src: DATA_BASE + "92-1100-1230.geojson" },
    { shortLabel:"12:30-", key:"92-1230-1400", src: DATA_BASE + "92-1230-1400.geojson" },
    { shortLabel:"14:00-", key:"92-1400-1630", src: DATA_BASE + "92-1400-1630.geojson" },
    { shortLabel:"16:30-", key:"92-1630-1900", src: DATA_BASE + "92-1630-1900.geojson" },
    { shortLabel:"19:00-", key:"92-1900-1930", src: DATA_BASE + "92-1900-1930.geojson" },
    { shortLabel:"19:30-", key:"92-1930-2200", src: DATA_BASE + "92-1930-2200.geojson" },
  ]},
];

/* === 経路図（k*.geojson：ファイル名にスペースあり対応）=== */
const ROUTES = [
  { id:"r831", label:"8/31", slots:[
    { shortLabel:"18:00-", src: routeUrl("k831 1800-1930.geojson") },
    { shortLabel:"19:30-", src: routeUrl("k831 1930-2200.geojson") },
  ]},
  { id:"r91", label:"9/1", slots:[
    { shortLabel:"10:00-", src: routeUrl("k91 1000-1200.geojson") },
    { shortLabel:"13:00-", src: routeUrl("k91 1300-1700.geojson") },
    { shortLabel:"18:00-", src: routeUrl("k91 1800-2200.geojson") },
  ]},
  { id:"r92", label:"9/2", slots:[
    { shortLabel:"11:30-", src: routeUrl("k92 1130-1300.geojson") },
    { shortLabel:"13:30-", src: routeUrl("k92 1330-1500.geojson") },
    { shortLabel:"15:30-", src: routeUrl("k92 1530-1700.geojson") },
    { shortLabel:"18:40-", src: routeUrl("k92 1840-2200.geojson") },
  ]},
];

/* === 経路図（Googleサイトへのリンク：InfoWindow用） === */
const ROUTE_URLS = {
  "0831":"https://sites.google.com/view/sakuramachiku/%E4%BB%A4%E5%92%8C%E5%B9%B4%E7%A5%9E%E5%B9%B8%E7%A5%AD/8%E6%9C%8831%E6%97%A5%E5%89%8D%E5%A4%9C%E7%A5%AD%E7%B5%8C%E8%B7%AF%E5%9B%B3",
  "0901":"https://sites.google.com/view/sakuramachiku/%E4%BB%A4%E5%92%8C%E5%B9%B4%E7%A5%9E%E5%B9%B8%E7%A5%AD/9%E6%9C%881%E6%97%A5-%E7%A5%9E%E5%B9%B8%E7%A5%AD%E7%B5%8C%E8%B7%AF%E5%9B%B3",
  "0902":"https://sites.google.com/view/sakuramachiku/%E4%BB%A4%E5%92%8C%E5%B9%B4%E7%A5%9E%E5%B9%B8%E7%A5%AD/9%E6%9C%882%E6%97%A5-%E7%A5%9E%E5%B9%B8%E7%A5%AD%E7%B5%8C%E8%B7%AF%E5%9B%B3",
};
function getRouteMapUrlByDateJST() {
  const params = new URLSearchParams(location.search);
  const override = params.get("route");
  if (override && ROUTE_URLS[override]) return ROUTE_URLS[override];
  const jstNow = nowJST();
  const m = jstNow.getMonth() + 1, d = jstNow.getDate();
  if (m < 8 || (m === 8 && d <= 31)) return ROUTE_URLS["0831"];
  if (m === 9 && d === 1)  return ROUTE_URLS["0901"];
  if (m === 9 && d === 2)  return ROUTE_URLS["0902"];
  return ROUTE_URLS["0901"];
}

/* ========= 変数 ========= */
let map, dashiMarker, infoWindow;
let trafficOverlays = [], runAreaOverlays = [];
let routeOverlays = [];
let latestPositionTime = null;
let pollTimer = null, liveScheduler = null;
let isLive = false;

/* ========= ユーティリティ ========= */
function nowJST(){ return new Date(new Date().toLocaleString("en-US",{ timeZone:"Asia/Tokyo"})); }
function withinOnDay(jst, m, d, sh, sm, eh, em){
  const mm=jst.getMonth()+1, dd=jst.getDate(); if(mm!==m||dd!==d) return false;
  const t=jst.getHours()*60+jst.getMinutes(), s=sh*60+sm, e=eh*60+em; return t>=s && t<e;
}
function isWithinLiveWindowJST(jst=nowJST()){
  return withinOnDay(jst,8,31,18,0,22,0) || withinOnDay(jst,9,1,10,0,22,0) || withinOnDay(jst,9,2,11,30,22,0);
}

/* ========= API ========= */
async function fetchLatestPosition(){
  const url = `${CONFIG.SERVER_BASE}/api/positions?deviceId=${CONFIG.DEVICE_ID}&limit=1`;
  const res = await fetch(url,{ headers:{ Authorization:`Bearer ${CONFIG.PUBLIC_BEARER}` }});
  if(!res.ok) throw new Error("位置取得失敗");
  const arr = await res.json(); return arr && arr[0];
}

/* ========= 地図補助 ========= */
function makeMarker({lat,lng}, iconUrl, title, sizePX=40){
  return new google.maps.Marker({
    position:{lat,lng}, map, title,
    icon:{ url:iconUrl, scaledSize:new google.maps.Size(sizePX,sizePX) }, zIndex:3000
  });
}

/* GeoJSON → Overlay（cache-busting付き） */
async function addGeoJsonAsOverlays(url, style){
  const u = url + (url.includes("?") ? "&" : "?") + "ts=" + Date.now(); // キャッシュ回避
  const res = await fetch(u);
  if(!res.ok){
    console.error("[GeoJSON fetch failed]", res.status, res.statusText, u);
    throw new Error("fetch failed: "+res.status);
  }
  const gj = await res.json();
  const added=[];
  for(const f of (gj.features||[])){
    const g=f.geometry; if(!g) continue; const st=style||{};
    if(g.type==="LineString"){
      const path=g.coordinates.map(([lng,lat])=>({lat,lng}));
      const pl=new google.maps.Polyline({ path, ...ROUTE_STYLE, ...st }); pl.setMap(map); added.push(pl);
    } else if(g.type==="MultiLineString"){
      g.coordinates.forEach(ls=>{
        const path=ls.map(([lng,lat])=>({lat,lng}));
        const pl=new google.maps.Polyline({ path, ...ROUTE_STYLE, ...st }); pl.setMap(map); added.push(pl);
      });
    } else if(g.type==="Polygon"){
      const paths=g.coordinates.map(r=>r.map(([lng,lat])=>({lat,lng})));
      const po=new google.maps.Polygon({ paths, ...STYLE.polygon, ...st }); po.setMap(map); added.push(po);
    } else if(g.type==="MultiPolygon"){
      g.coordinates.forEach(pg=>{
        const paths=pg.map(r=>r.map(([lng,lat])=>({lat,lng})));
        const po=new google.maps.Polygon({ paths, ...STYLE.polygon, ...st }); po.setMap(map); added.push(po);
      });
    }
  }
  return added;
}

/* 交通規制表示 */
async function showTrafficBySrc(src){
  trafficOverlays.forEach(o=>o.setMap(null)); trafficOverlays=[];
  if(!src) return; trafficOverlays = await addGeoJsonAsOverlays(src,{});
}

/* 経路（青線）表示：失敗時はトースト */
async function showRouteBySrc(src){
  routeOverlays.forEach(o=>o.setMap(null)); routeOverlays=[];
  if(!src) return;
  try{
    routeOverlays = await addGeoJsonAsOverlays(src, {}); // ROUTE_STYLEは関数内で適用
    if(routeOverlays.length === 0) throw new Error("features=0");
  }catch(e){
    console.error("経路図読み込み失敗:", src, e);
    const fail = document.getElementById("fail") || (()=>{ const d=document.createElement("div"); d.id="fail"; d.style.cssText="position:fixed;left:8px;right:8px;bottom:64px;background:#fffb;color:#000;border-radius:12px;padding:10px;font-size:13px;z-index:99999;"; document.body.appendChild(d); return d; })();
    fail.textContent = "経路図の読み込みに失敗しました。URL/ファイル名/Pages設定をご確認ください。";
    fail.style.display = "block";
    setTimeout(()=>{ fail.style.display="none"; }, 5000);
  }
}

/* ========= 初期化 ========= */
async function initMap(){
  try{
    map = new google.maps.Map(document.getElementById("map"),{
      center: MAP_CENTER, zoom: MAP_ZOOM,
      mapTypeControl:false, fullscreenControl:true, streetViewControl:false,
      clickableIcons:true, gestureHandling:"greedy",
    });
    infoWindow = new google.maps.InfoWindow();

    // 表示範囲制限＋fit
    try{
      const res = await fetch(MAP_VIEWPORT_SRC);
      if(res.ok){
        const gj = await res.json(); const coords=[];
        (gj.features||[]).forEach(f=>{
          const g=f.geometry; if(!g) return;
          const push=([lng,lat])=>coords.push({lat,lng});
          if(g.type==="Polygon") g.coordinates.flat().forEach(push);
          if(g.type==="LineString") g.coordinates.forEach(push);
          if(g.type==="MultiPolygon") g.coordinates.flat(2).forEach(push);
          if(g.type==="MultiLineString") g.coordinates.flat().forEach(push);
        });
        if(coords.length){
          const bounds=new google.maps.LatLngBounds();
          coords.forEach(c=>bounds.extend(c));
          map.fitBounds(bounds);
          google.maps.event.addListenerOnce(map,"idle",()=>{
            const z=map.getZoom()??15; map.setZoom(Math.min(z+2,20));
          });
          map.setOptions({ restriction:{ latLngBounds:bounds, strictBounds:true }});
        }
      }
    }catch(e){ console.warn(e); }

    // 走行エリア（外周ガイド）
    runAreaOverlays = await addGeoJsonAsOverlays(RUNAREA_SRC, RUNAREA_STYLE);

    // ===== 交通規制UI =====
    const $ = (id)=>document.getElementById(id);
    const pill=$("regPill"), drawer=$("regDrawer"), close=$("regClose");
    const tabAuto=$("tabAuto"), tabD1=$("tabD1"), tabD2=$("tabD2"), slotList=$("slotList");
    const openDrawer=()=>drawer.style.display="block";
    const closeDrawer=()=>drawer.style.display="none";
    pill.addEventListener("click", openDrawer); close.addEventListener("click", closeDrawer);
    document.addEventListener("click", (e)=>{ if(!drawer.contains(e.target) && e.target!==pill && !pill.contains(e.target)) closeDrawer(); });

    function buildSlotButtons(day){
      slotList.innerHTML="";
      day.slots.forEach(slot=>{
        const btn=document.createElement("button");
        btn.className="slotbtn"; btn.textContent=slot.shortLabel;
        btn.addEventListener("click", async ()=>{
          await showTrafficBySrc(slot.src);
          [...slotList.children].forEach(c=>c.classList.remove("active"));
          btn.classList.add("active");
          pill.textContent = `${day.label} ${slot.shortLabel}`;
        });
        slotList.appendChild(btn);
      });
    }
    async function autoUpdateTraffic(){
      pill.textContent="交通規制";
      const jst=nowJST(); const m=jst.getMonth()+1, d=jst.getDate();
      if(m===9 && d===1){ await showTrafficBySrc(DAYS[0].slots[0].src); }
      else if(m===9 && d===2){ await showTrafficBySrc(DAYS[1].slots[0].src); }
      else { await showTrafficBySrc(null); }
      slotList.innerHTML="";
    }
    tabAuto.addEventListener("click", async ()=>{
      tabAuto.classList.add("active"); tabD1.classList.remove("active"); tabD2.classList.remove("active");
      await autoUpdateTraffic();
    });
    tabD1.addEventListener("click", ()=>{
      tabD1.classList.add("active"); tabAuto.classList.remove("active"); tabD2.classList.remove("active");
      buildSlotButtons(DAYS[0]);
    });
    tabD2.addEventListener("click", ()=>{
      tabD2.classList.add("active"); tabAuto.classList.remove("active"); tabD1.classList.remove("active");
      buildSlotButtons(DAYS[1]);
    });
    await autoUpdateTraffic();

    // ===== 経路図UI（左のドロワーは index.html 側で; ここでは自動表示のみ） =====
    function autoSelectRouteByDate(){
      const j = nowJST();
      const m = j.getMonth()+1, d = j.getDate();
      let day = null;
      if (m===8 && d===31) day = ROUTES[0];
      else if (m===9 && d===1) day = ROUTES[1];
      else if (m===9 && d===2) day = ROUTES[2];
      if(day && day.slots && day.slots.length){
        showRouteBySrc(day.slots[0].src); // 当日先頭スロットを青線で表示
      }
    }
    autoSelectRouteByDate();

    // ===== 現在地（青点＋誤差円・最前面） =====
    $("bMyLoc").addEventListener("click", ()=>{
      if(!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition((pos)=>{
        const p={ lat:pos.coords.latitude, lng:pos.coords.longitude };
        const acc=Math.max(5, pos.coords.accuracy||0);
        map.panTo(p); if((map.getZoom()??0)<16) map.setZoom(16);

        if(window.myLocMarker) window.myLocMarker.setMap(null);
        if(window.myLocCircle) window.myLocCircle.setMap(null);

        window.myLocMarker=new google.maps.Marker({
          position:p, map, title:"現在地",
          icon:{ path:google.maps.SymbolPath.CIRCLE, scale:6, fillColor:"#4285f4", fillOpacity:1, strokeColor:"#fff", strokeWeight:2 },
          zIndex: 9999
        });
        window.myLocCircle=new google.maps.Circle({
          strokeColor:"#4285f4", strokeOpacity:.5, strokeWeight:1,
          fillColor:"#4285f4", fillOpacity:.15, map, center:p, radius:acc, zIndex: 9998
        });
      }, console.warn, { enableHighAccuracy:true, maximumAge:10000, timeout:10000 });
    });

    // ===== 山車マーカー（配信時間内：ライブ、外：固定） =====
    async function startLive(){
      if(isLive) return; isLive=true;

      if(!dashiMarker){
        dashiMarker = makeMarker(OFF_MARK_POS, CONFIG.ICONS.sakura, "桜町区", 40);
      }
      google.maps.event.clearInstanceListeners(dashiMarker);

      const pos = await fetchLatestPosition().catch(()=>null);
      if(pos){
        dashiMarker.setPosition({lat:pos.latitude,lng:pos.longitude});
        latestPositionTime = new Date(pos.deviceTime || pos.fixTime || pos.serverTime || Date.now());
      }

      dashiMarker.addListener("click", ()=>{
        const ll=dashiMarker.getPosition();
        const dirUrl=`https://www.google.com/maps/dir/?api=1&destination=${ll.lat()},${ll.lng()}&travelmode=walking`;
        const routeUrl=getRouteMapUrlByDateJST();
        infoWindow.setContent(`
          <div class="iw iw-narrow">
            <div class="title">桜町区</div>
            <div class="status">ライブ配信中</div>
            <a class="btn" href="${dirUrl}" target="_blank" rel="noopener">経路</a>
            <a class="btn" href="${routeUrl}" target="_blank" rel="noopener">経路図</a>
          </div>
        `);
        infoWindow.open({ anchor:dashiMarker, map });
      });

      clearInterval(pollTimer);
      pollTimer = setInterval(async ()=>{
        if(!isLive) return;
        const np = await fetchLatestPosition().catch(()=>null);
        if(np && dashiMarker){
          dashiMarker.setPosition({lat:np.latitude,lng:np.longitude});
          latestPositionTime = new Date(np.deviceTime || np.fixTime || np.serverTime || Date.now());
        }
      }, CONFIG.POLL_MS);

      document.getElementById("bDashi").onclick = ()=>{
        if(dashiMarker){ map.panTo(dashiMarker.getPosition()); if((map.getZoom()??0)<16) map.setZoom(16); }
      };
    }

    function stopLive(){
      isLive=false;
      clearInterval(pollTimer); pollTimer=null;

      if(!dashiMarker){
        dashiMarker = makeMarker(OFF_MARK_POS, CONFIG.ICONS.sakura, "桜町区", 40);
      }else{
        dashiMarker.setMap(map);
        dashiMarker.setPosition(OFF_MARK_POS);
      }
      google.maps.event.clearInstanceListeners(dashiMarker);
      dashiMarker.addListener("click", ()=>{
        const ll=dashiMarker.getPosition();
        const dirUrl=`https://www.google.com/maps/dir/?api=1&destination=${ll.lat()},${ll.lng()}&travelmode=walking`;
        const routeUrl=getRouteMapUrlByDateJST();
        infoWindow.setContent(`
          <div class="iw iw-narrow">
            <div class="title">桜町区（配信外）</div>
            <div class="status">現在は固定表示です</div>
            <a class="btn" href="${dirUrl}" target="_blank" rel="noopener">経路</a>
            <a class="btn" href="${routeUrl}" target="_blank" rel="noopener">経路図</a>
          </div>
        `);
        infoWindow.open({ anchor:dashiMarker, map });
      });

      document.getElementById("bDashi").onclick = ()=>{
        map.panTo(OFF_MARK_POS); if((map.getZoom()??0)<16) map.setZoom(16);
      };
    }

    // ライブ配信の自動切替（30秒ごとに再評価）
    const applyByNow = ()=>{ (isWithinLiveWindowJST() ? startLive : stopLive)(); };
    applyByNow();
    clearInterval(liveScheduler);
    liveScheduler = setInterval(applyByNow, 30000);

    // 下段：交通規制ボタン → ドロワー開閉
    const toggleDrawer = (e)=>{ e.preventDefault(); const dr=document.getElementById("regDrawer"); dr.style.display = (dr.style.display==="block"?"none":"block"); };
    document.getElementById("bTraffic").addEventListener("click", toggleDrawer, {passive:false});
    document.getElementById("bTraffic").addEventListener("touchstart", toggleDrawer, {passive:false});

    // ヘルプ
    document.getElementById("bHelp").addEventListener("click", ()=>{ document.getElementById("helpModal").style.display="flex"; });
    document.getElementById("helpClose").addEventListener("click", ()=>{ document.getElementById("helpModal").style.display="none"; });

  }catch(err){
    console.error(err);
    const el=document.getElementById("fail") || (()=>{ const d=document.createElement("div"); d.id="fail"; d.style.cssText="position:fixed;left:8px;right:8px;bottom:64px;background:#fffb;color:#000;border-radius:12px;padding:10px;font-size:13px;z-index:99999;"; document.body.appendChild(d); return d; })();
    el.textContent = "アプリの初期化に失敗しました：" + (err.message||err);
    el.style.display="block";
  }
}

/* Google Maps callback */
window.initMap = initMap;
