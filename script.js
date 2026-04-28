// Luxury Document Builder (3 templates) — Live Preview + Auto Download PDF (NO blank page)

const $ = (q, el=document) => el.querySelector(q);
const $$ = (q, el=document) => [...el.querySelectorAll(q)];

/* =========================
   Footer Info
========================= */
const FOOTER_INFO = {
  line1: "CORE NATIVES",
  line2: "Jl. DR. Soedjono, Lingkar Permai Blok R7 A-B Tanjung Karang - Mataram 83115 – Lombok – NTB – Indonesia",
  line3: "Telp: +62 811 359 019",
  line4: "contact@corenatives.com",
  specialist: "TOUR PACKAGE | RINJANI TREKKING | OUTBOUND | MICE | HOTEL VOUCHER | KOMODO PACKAGE | GOLF | TRANSPORT"
};

/* =========================
   DEFAULTS (IMPORTANT for date picker)
   NOTE: input type="date" needs ISO format: YYYY-MM-DD
========================= */
const DEFAULTS = {
  confirmation: {
    fromName: "MEMED / CORE NATIVES",
    fromTelp: "+62 811 359 019",
    contact: "corenatives.com",
    date: "2021-06-15", // ✅ was "15-Jun-2021"
    toName: "Ms Nini (Panorama JTB UPG)",
    toTelp: "+64 11 853366",
    toFax: "+64 11 857676",
    subject: "Confirmation",
    resNo: "CNL/2026/DAY/MONTH/001",
    guestName: "HIS GROUP (58 + 1 Pax)",
    period: "March 13–15, 2019",
    notes:
      "Terima kasih atas kepercayaan Anda. Dokumen ini merupakan konfirmasi reservasi sesuai detail di bawah.",
    signatureName: "Muhamad Isnaini",
    signatureRole: "Reservation / Operations"
  },

  invoice: {
    invoiceNo: "CNL/2026/DAY/MONTH/001",
    toCompany: "ACC Dept. Sentosa World Tour & Travel",
    phoneFax: "+62-21-7311111",
    guestPax: "HIS GROUP (58 + 1 Pax)",
    period: "March 13–15, 2019",
    email: "info@sentosaworldtour.com",
    currency: "IDR",
    items: [
      { desc: "Hotel Accommodation (2 Nights)", qty: 1, price: 12500000 },
      { desc: "Private Transport + Driver", qty: 1, price: 4500000 },
      { desc: "Tour & Entrance Fees", qty: 1, price: 2350000 },
    ],
    paid: 0,
    note:
      "1. A 50% deposit is required to secure the reservation. \n 2. The remaining balance must be settled no later than 14 days prior to the arrival date, unless otherwise agreed     in advance. \n 3. Payment shall be made via international bank transfer to the following account: \n\n Bank Name: Bank Mandiri \n Account Name: CV Coren Lombok \n Account Number: 1610018000005 \n SWIFT Code: BMRIIDJA \n Bank Branch: Mandiri KCP Mataram Cakranegara, Mataram, Lombok, West Nusa Tenggara, Indonesia \n\n 4. All travel arrangements will be confirmed once the required deposit has been received. \n 5. Any additional services requested beyond the scope of this agreement will be subject to additional charges. \n 'We look forward to curating a memorable tailor-made experience for you'.",
    signatureName: "Muhamad Isnaini",
    signatureRole: "Director"
  },

  reservation: {
    fromPic: "Muhamad Isnaini",
    fromCompany: "CORE NATIVES",
    date: "2021-04-30", // ✅ was "30/04/2021"
    telpWa: "++62 811 359 019",
    contact: "@corenatives.com",
    web: "corenatives.com",
    attention: "Ibu Ajeng",
    toCompany: "Sudamala Suite Villas",
    toTelp: "+62 370 693111",
    toWa: "+62 823-5948-9455",
    toWeb: "www.sudamalaresorts.com",
    guestName: "Mr/Mrs …",
    checkIn: "",   // ✅ date picker friendly
    checkOut: "",  // ✅ date picker friendly
    roomType: "…",
    pax: "…",
    request:
      "Mohon dibantu untuk konfirmasi ketersediaan kamar dan kebijakan pembayaran sesuai reservasi ini.",
    signatureName: "Muhamad Isnaini",
    signatureRole: "Reservation / Operations"
  }
};

// store per template (biar saat pindah tab data tidak reset)
const STORE = {
  confirmation: structuredClone(DEFAULTS.confirmation),
  invoice: structuredClone(DEFAULTS.invoice),
  reservation: structuredClone(DEFAULTS.reservation)
};

let state = {
  template: "reservation",
  data: STORE.reservation
};

const formHost = $("#formHost");
const paper = $("#paper");

/* =========================
   Utils
========================= */
function escapeHtml(str){
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}
function escapeAttr(str){ return escapeHtml(str).replaceAll("\n"," "); }
function h(str){ return escapeHtml(str ?? ""); }

function formatMoney(n, currency="IDR"){
  const v = Number(n || 0);
  return new Intl.NumberFormat("id-ID", {
    style:"currency",
    currency,
    maximumFractionDigits:0
  }).format(v);
}

/* ✅ Format tanggal ISO (YYYY-MM-DD) -> "15 June 2021" */
function formatDateLong(iso){
  if(!iso) return "";
  const [y,m,d] = String(iso).split("-").map(Number);
  if(!y || !m || !d) return String(iso);

  const dt = new Date(Date.UTC(y, m-1, d));
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  }).format(dt);
}

function computeInvoiceTotals(inv){
  const subtotal = (inv.items || []).reduce(
    (a,it)=> a + (Number(it.qty||0)*Number(it.price||0)),
    0
  );
  const paid = Number(inv.paid||0);
  const balance = Math.max(0, subtotal - paid);
  return { subtotal, paid, balance };
}

function setActiveNav(){
  $$(".nav__btn").forEach(btn=>{
    btn.classList.toggle("is-active", btn.dataset.template === state.template);
  });
}

/* =========================
   Form Builders
========================= */
function inputField({ key, label, type="text", placeholder="", hint="", options=[] }){
  const id = `f_${key}`;
  const value = state.data[key] ?? "";

  let control = "";
  if(type === "textarea"){
    control = `<textarea class="textarea" id="${id}" data-key="${key}" placeholder="${placeholder}">${escapeHtml(String(value))}</textarea>`;
  } else if(type === "select"){
    control = `
      <select class="select" id="${id}" data-key="${key}">
        ${options.map(o => `<option value="${escapeHtml(o)}" ${String(value)===String(o)?"selected":""}>${escapeHtml(o)}</option>`).join("")}
      </select>`;
  } else if(type === "number"){
    control = `<input class="input" id="${id}" data-key="${key}" type="number" value="${escapeAttr(String(value))}" placeholder="${placeholder}" />`;
  } else if(type === "date"){
    // ✅ date picker: value harus "YYYY-MM-DD"
    control = `<input class="input" id="${id}" data-key="${key}" type="date" value="${escapeAttr(String(value))}" />`;
  } else {
    control = `<input class="input" id="${id}" data-key="${key}" type="text" value="${escapeAttr(String(value))}" placeholder="${placeholder}" />`;
  }

  return `
    <div class="field">
      <div class="label">${label}${hint ? ` <span class="small">— ${escapeHtml(hint)}</span>` : ""}</div>
      ${control}
    </div>`;
}

function itemsEditor(inv){
  const rows = (inv.items || []).map((it, idx)=> {
    return `
      <div class="p-card" style="padding:10px 12px;">
        <div class="grid2">
          <div class="field">
            <div class="label">Deskripsi</div>
            <input class="input" data-item-desc="${idx}" type="text" value="${escapeAttr(it.desc||"")}" />
          </div>
          <div class="grid2">
            <div class="field">
              <div class="label">Qty</div>
              <input class="input" data-item-qty="${idx}" type="number" value="${escapeAttr(String(it.qty||0))}" />
            </div>
            <div class="field">
              <div class="label">Harga</div>
              <input class="input" data-item-price="${idx}" type="number" value="${escapeAttr(String(it.price||0))}" />
            </div>
          </div>
        </div>
        <div style="margin-top:10px; display:flex; gap:8px;">
          <button class="btn btn--ghost" type="button" data-item-remove="${idx}">Hapus</button>
        </div>
      </div>`;
  }).join("");

  return `
    <div class="field">
      <div class="label">Items</div>
      <div style="display:grid; gap:10px;">
        ${rows || `<div class="small">Belum ada item.</div>`}
      </div>
      <div style="margin-top:10px;">
        <button class="btn btn--primary" type="button" id="btnAddItem">
          <span class="btn__shine"></span>
          Tambah Item
        </button>
      </div>
    </div>`;
}

function renderForm(){
  const t = state.template;
  const d = state.data;
  let html = "";

  if(t === "confirmation"){
    html += `
      <div class="grid2">
        ${inputField({key:"date", label:"Date", type:"date"})}
        ${inputField({key:"subject", label:"Subject"})}
      </div>
      <div class="grid2">
        ${inputField({key:"fromName", label:"From"})}
        ${inputField({key:"toName", label:"To"})}
      </div>
      <div class="grid3">
        ${inputField({key:"fromTelp", label:"From Telp"})}
        ${inputField({key:"toTelp", label:"To Telp"})}
        ${inputField({key:"toFax", label:"To Fax"})}
      </div>
      <div class="grid2">
        ${inputField({key:"fromEmail", label:"From Email"})}
        ${inputField({key:"resNo", label:"Reservation / Ref No"})}
      </div>
      ${inputField({key:"guestName", label:"Guest Name / Pax"})}
      ${inputField({key:"period", label:"Period of Service"})}
      ${inputField({key:"notes", label:"Notes / Message", type:"textarea"})}
      <div class="grid2">
        ${inputField({key:"signatureName", label:"Signature Name"})}
        ${inputField({key:"signatureRole", label:"Signature Role"})}
      </div>`;
  }

  if(t === "invoice"){
    html += `
      <div class="grid2">
        ${inputField({key:"invoiceNo", label:"Invoice No"})}
        ${inputField({key:"currency", label:"Currency", type:"select", options:["IDR","USD","EUR","SGD"]})}
      </div>
      ${inputField({key:"toCompany", label:"To (Company)"})}
      <div class="grid2">
        ${inputField({key:"phoneFax", label:"Phone/Fax"})}
        ${inputField({key:"email", label:"Email"})}
      </div>
      <div class="grid2">
        ${inputField({key:"guestPax", label:"Guest Name / Pax"})}
        ${inputField({key:"period", label:"Period of Service"})}
      </div>

      ${itemsEditor(d)}

      <div class="grid2">
        ${inputField({key:"paid", label:"Paid Amount", type:"number", hint:"diisi jika sudah ada pembayaran"})}
        ${inputField({key:"note", label:"Note", type:"textarea"})}
      </div>

      <div class="grid2">
        ${inputField({key:"signatureName", label:"Signature Name"})}
        ${inputField({key:"signatureRole", label:"Signature Role"})}
      </div>`;
  }

  if(t === "reservation"){
    html += `
      <div class="grid2">
        ${inputField({key:"date", label:"Date", type:"date"})}
        ${inputField({key:"attention", label:"Attention"})}
      </div>
      ${inputField({key:"fromPic", label:"From (PIC)"})}
      ${inputField({key:"fromCompany", label:"From Company"})}
      <div class="grid2">
        ${inputField({key:"telpWa", label:"From Telp/WA"})}
        ${inputField({key:"email", label:"From Email"})}
      </div>
      ${inputField({key:"web", label:"From Website"})}

      <div class="grid2">
        ${inputField({key:"toCompany", label:"To Company"})}
        ${inputField({key:"toTelp", label:"To Telp"})}
      </div>
      <div class="grid2">
        ${inputField({key:"toWa", label:"To WA"})}
        ${inputField({key:"toWeb", label:"To Website"})}
      </div>

      <div class="grid2">
        ${inputField({key:"guestName", label:"Guest Name"})}
        ${inputField({key:"pax", label:"Pax"})}
      </div>
      <div class="grid2">
        ${inputField({key:"checkIn", label:"Check-in", type:"date"})}
        ${inputField({key:"checkOut", label:"Check-out", type:"date"})}
      </div>
      ${inputField({key:"roomType", label:"Room Type"})}
      ${inputField({key:"request", label:"Request / Notes", type:"textarea"})}

      <div class="grid2">
        ${inputField({key:"signatureName", label:"Signature Name"})}
        ${inputField({key:"signatureRole", label:"Signature Role"})}
      </div>`;
  }

  formHost.innerHTML = html;

  applyDefaultStyle();

  // common fields listener
  $$("#formHost [data-key]").forEach(el=>{
    el.addEventListener("input", ()=>{
      const key = el.dataset.key;
      state.data[key] = (el.type === "number") ? Number(el.value) : el.value;
      renderPaper();
    });
  });

  // Invoice item listeners
  if(t === "invoice"){
    $("#btnAddItem")?.addEventListener("click", ()=>{
      state.data.items = state.data.items || [];
      state.data.items.push({ desc:"New Item", qty:1, price:0 });
      renderForm();
      renderPaper();
    });

    $$("#formHost [data-item-desc]").forEach(el=>{
      el.addEventListener("input", ()=>{
        const idx = Number(el.dataset.itemDesc);
        state.data.items[idx].desc = el.value;
        renderPaper();
      });
    });
    $$("#formHost [data-item-qty]").forEach(el=>{
      el.addEventListener("input", ()=>{
        const idx = Number(el.dataset.itemQty);
        state.data.items[idx].qty = Number(el.value || 0);
        renderPaper();
      });
    });
    $$("#formHost [data-item-price]").forEach(el=>{
      el.addEventListener("input", ()=>{
        const idx = Number(el.dataset.itemPrice);
        state.data.items[idx].price = Number(el.value || 0);
        renderPaper();
      });
    });
    $$("#formHost [data-item-remove]").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        const idx = Number(btn.dataset.itemRemove);
        state.data.items.splice(idx,1);
        renderForm();
        renderPaper();
      });
    });
  }
}

/* =========================
   PAPER RENDER
========================= */
function renderPaper(){
  paper.innerHTML = getPaperInnerHTML(state.template, state.data);
}

function getPaperInnerHTML(t, d){
  if(t === "confirmation"){
    return `
      <section class="p-head">
        <div class="docHeader">
          <div class="docLogo"></div>

          <div class="docTitle">
            <h2>CONFIRMATION LETTER</h2>
            <div class="sub">${h(d.resNo)}</div>
          </div>

          <div class="docRight">
            Date: ${h(formatDateLong(d.date) || d.date)}<br/>
            Subject: ${h(d.subject)}
          </div>
        </div>
      </section>

      <section class="p-body">
        <div class="p-section">
          <table class="doc-table">
            <tr>
              <td class="lbl tight">FROM</td>
              <td class="value tight">${h(d.fromName)}</td>
              <td class="lbl2 tight">TO</td>
              <td class="value tight">${h(d.toName)}</td>
            </tr>
            <tr>
              <td class="lbl tight">TELP</td>
              <td class="value tight">${h(d.fromTelp)}</td>
              <td class="lbl2 tight">TELP</td>
              <td class="value tight">${h(d.toTelp)}</td>
            </tr>
            <tr>
              <td class="lbl tight">EMAIL</td>
              <td class="value tight">${h(d.fromEmail)}</td>
              <td class="lbl2 tight">FAX</td>
              <td class="value tight">${h(d.toFax)}</td>
            </tr>
            <tr>
              <td class="lbl tight">REF</td>
              <td class="value tight">${h(d.resNo)}</td>
              <td class="lbl2 tight">SUB</td>
              <td class="value tight">${h(d.subject)}</td>
            </tr>
          </table>
        </div>

        <div class="p-section">
          <div class="p-h3">Reservation Details</div>
          <table class="doc-table">
            <tr>
              <td class="lbl">Guest</td>
              <td class="value">${h(d.guestName)}</td>
            </tr>
            <tr>
              <td class="lbl">Period</td>
              <td class="value">${h(d.period)}</td>
            </tr>
          </table>
        </div>

        <div class="p-section">
          <div class="p-h3">Message</div>
          <div style="margin-top:2mm;">
            ${h(d.notes).replace(/\n/g,"<br/>")}
          </div>
        </div>
      </section>

      <section class="p-foot">
        <div class="footGrid">
          <div class="small">
            <b>${h(FOOTER_INFO.line1)}</b><br/>
            ${h(FOOTER_INFO.line2)}<br/>
            ${h(FOOTER_INFO.line3)}<br/>
            ${h(FOOTER_INFO.line4)}<br/>
            <div style="margin-top:2mm;">
              <b>TAILOR-MADE EVENT SPESIALIST</b><br/>
              ${h(FOOTER_INFO.specialist)}
            </div>
          </div>

          <div class="sigBox">
            Best Regards<br/>
            <div class="sigLine"></div>
            <b>${h(d.signatureName)}</b><br/>
            ${h(d.signatureRole)}
          </div>
        </div>
      </section>
    `;
  }

  if(t === "invoice"){
    const { subtotal, paid, balance } = computeInvoiceTotals(d);
    const currency = d.currency || "IDR";

    return `
      <section class="p-head">
        <div class="docHeader">
          <div class="docLogo"></div>

          <div class="docTitle">
            <h2>INVOICE</h2>
            <div class="sub">No. ${h(d.invoiceNo)}</div>
          </div>

          <div class="docRight">
            Currency: ${h(currency)}<br/>
            Period: ${h(d.period)}
          </div>
        </div>
      </section>

      <section class="p-body">
        <div class="p-section">
          <table class="doc-table">
            <tr>
              <td class="lbl">To</td>
              <td class="value">${h(d.toCompany)}</td>
              <td class="lbl2">Phone/Fax</td>
              <td class="value">${h(d.phoneFax)}</td>
            </tr>
            <tr>
              <td class="lbl">Guest</td>
              <td class="value">${h(d.guestPax)}</td>
              <td class="lbl2">Email</td>
              <td class="value">${h(d.email)}</td>
            </tr>
          </table>
        </div>

        <div class="p-section">
          <table class="doc-items">
            <thead>
              <tr>
                <th style="width:10%;">QTY</th>
                <th style="width:55%;">DESCRIPTION</th>
                <th style="width:17%;" class="right">UNIT PRICE</th>
                <th style="width:18%;" class="right">AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              ${(d.items||[]).map(it=>{
                const amount = Number(it.qty||0) * Number(it.price||0);
                return `
                  <tr>
                    <td class="right">${h(String(it.qty||0))}</td>
                    <td>${h(it.desc||"")}</td>
                    <td class="right">${h(formatMoney(it.price, currency))}</td>
                    <td class="right">${h(formatMoney(amount, currency))}</td>
                  </tr>
                `;
              }).join("")}
              <tr>
                <td colspan="3" class="right"><b>SUB TOTAL</b></td>
                <td class="right"><b>${h(formatMoney(subtotal, currency))}</b></td>
              </tr>
              <tr>
                <td colspan="3" class="right">PAID</td>
                <td class="right">${h(formatMoney(paid, currency))}</td>
              </tr>
              <tr>
                <td colspan="3" class="right"><b>BALANCE</b></td>
                <td class="right"><b>${h(formatMoney(balance, currency))}</b></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="p-section">
          <div class="p-h3">Note (Payment Terms)</div>
          <div style="margin-top:2mm;">
            ${h(d.note||"").replace(/\n/g,"<br/>")}
          </div>
        </div>
      </section>

      <section class="p-foot">
        <div class="footGrid">
          <div class="small">
            <b>${h(FOOTER_INFO.line1)}</b><br/>
            ${h(FOOTER_INFO.line2)}<br/>
            ${h(FOOTER_INFO.line3)}<br/>
            ${h(FOOTER_INFO.line4)}<br/>
            <div style="margin-top:2mm;">
              <b>TAILOR-MADE EVENTS SPECIALIST</b><br/>
              ${h(FOOTER_INFO.specialist)}
            </div>
          </div>

          <div class="sigBox">
            <div class="sigLine"></div>
            <b>${h(d.signatureName)}</b><br/>
            ${h(d.signatureRole)}
          </div>
        </div>
      </section>
    `;
  }

  if(t === "reservation"){
    return `
      <section class="p-head">
        <div class="docHeader">
          <div class="docLogo"></div>

          <div class="docTitle">
            <h2>RESERVATION FORM</h2>
            <div class="sub">Date: ${h(formatDateLong(d.date) || d.date)}</div>
          </div>

          <div class="docRight">
            Attention: ${h(d.attention)}
          </div>
        </div>
      </section>

      <section class="p-body">
        <div class="p-section">
          <table class="doc-table">
            <tr>
              <td class="lbl tight">From</td>
              <td class="value tight">${h(d.fromCompany)}</td>
              <td class="lbl2 tight">To</td>
              <td class="value tight">${h(d.toCompany)}</td>
            </tr>
            <tr>
              <td class="lbl tight">PIC</td>
              <td class="value tight">${h(d.fromPic)}</td>
              <td class="lbl2 tight">Telp</td>
              <td class="value tight">${h(d.toTelp)}</td>
            </tr>
            <tr>
              <td class="lbl tight">Telp/WA</td>
              <td class="value tight">${h(d.telpWa)}</td>
              <td class="lbl2 tight">WA</td>
              <td class="value tight">${h(d.toWa)}</td>
            </tr>
            <tr>
              <td class="lbl tight">Email</td>
              <td class="value tight">${h(d.email)}</td>
              <td class="lbl2 tight">Web</td>
              <td class="value tight">${h(d.toWeb)}</td>
            </tr>
            <tr>
              <td class="lbl tight">Web</td>
              <td class="value tight">${h(d.web)}</td>
              <td class="lbl2 tight"></td>
              <td class="value tight"></td>
            </tr>
          </table>
        </div>

        <div class="p-section">
          <div class="p-h3">Guest & Stay Details</div>
          <table class="doc-table">
            <tr>
              <td class="lbl">Guest</td>
              <td class="value">${h(d.guestName)}</td>
            </tr>
            <tr>
              <td class="lbl">Pax</td>
              <td class="value">${h(d.pax)}</td>
            </tr>
            <tr>
              <td class="lbl">Check-in</td>
              <td class="value">${h(formatDateLong(d.checkIn) || d.checkIn)}</td>
            </tr>
            <tr>
              <td class="lbl">Check-out</td>
              <td class="value">${h(formatDateLong(d.checkOut) || d.checkOut)}</td>
            </tr>
            <tr>
              <td class="lbl">Room</td>
              <td class="value">${h(d.roomType)}</td>
            </tr>
          </table>
        </div>

        <div class="p-section">
          <div class="p-h3">Request</div>
          <div style="margin-top:2mm;">
            ${h(d.request||"").replace(/\n/g,"<br/>")}
          </div>
        </div>
      </section>

      <section class="p-foot">
        <div class="footGrid">
          <div class="small">
            <b>${h(FOOTER_INFO.line1)}</b><br/>
            ${h(FOOTER_INFO.line2)}<br/>
            ${h(FOOTER_INFO.line3)}<br/>
            ${h(FOOTER_INFO.line4)}<br/>
            <div style="margin-top:2mm;">
              <b>TAILOR-MADE EVENTS SPECIALIST</b><br/>
              ${h(FOOTER_INFO.specialist)}
            </div>
          </div>

          <div class="sigBox">
            Best Regard<br/>
            <div class="sigLine"></div>
            <b>${h(d.signatureName)}</b><br/>
            ${h(d.signatureRole)}
          </div>
        </div>
      </section>
    `;
  }

  return "";
}

/* =========================
   Default text dim effect logic
========================= */
function applyDefaultStyle() {
  $$("#formHost .input, #formHost .textarea, #formHost .select").forEach(el => {
    const key = el.dataset.key;
    const defaultValue = DEFAULTS[state.template][key];

    const isDefault = (defaultValue !== undefined && el.value === String(defaultValue));
    el.classList.toggle("is-default", isDefault);

    el.addEventListener("focus", () => {
      el.classList.remove("is-default");
    });

    el.addEventListener("blur", () => {
      if (el.value.trim() === "" && defaultValue !== undefined) {
        el.value = defaultValue;
        state.data[key] = defaultValue;
        el.classList.add("is-default");
        renderPaper();
      }
    });

    el.addEventListener("input", () => {
      const nowDefault = (defaultValue !== undefined && el.value === String(defaultValue));
      el.classList.toggle("is-default", nowDefault);
    });
  });
}

/* =========================
   Switching / Reset
========================= */
function switchTemplate(next){
  state.template = next;
  state.data = STORE[next];
  setActiveNav();
  renderForm();
  renderPaper();
}

function resetCurrent(){
  const t = state.template;
  STORE[t] = structuredClone(DEFAULTS[t]);
  state.data = STORE[t];
  renderForm();
  renderPaper();
}

/* =========================
   AUTO DOWNLOAD PDF (NO BLANK PAGE)
   Order:
   Page 1: Reservation Form
   Page 2: Invoice
   Page 3: Confirmation Letter
========================= */
async function downloadPDF(mode = "current"){
  const { jsPDF } = window.jspdf;

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  // Determine which templates to download
  let order = [];
  if (mode === "all") {
    order = ["reservation", "invoice", "confirmation"];
  } else {
    order = [state.template];
  }

  for (let i = 0; i < order.length; i++) {
    const t = order[i];

    // render hidden A4 page
    const tempContainer = document.createElement("div");
    tempContainer.style.position = "absolute";
    tempContainer.style.left = "-9999px";
    tempContainer.style.top = "0";
    tempContainer.style.width = "210mm";
    tempContainer.style.background = "#fff";
    tempContainer.innerHTML = `
      <article class="paper">
        ${getPaperInnerHTML(t, STORE[t])}
      </article>
    `;
    document.body.appendChild(tempContainer);

    // capture canvas
    const canvas = await html2canvas(tempContainer, {
      scale: 2,
      useCORS: true,
      backgroundColor: null
    });

    const imgData = canvas.toDataURL("image/jpeg", 1.0);

    // A4 size
    // A4 size
    const pageW = 210;
    const pageH = 297;
    const safeH = pageH - 5; // beri jarak 5mm di bawah agar tidak mentok

    // Calc height based on canvas ratio
    let imgW = pageW;
    let imgH = (canvas.height * imgW) / canvas.width;

    // If content is taller than safe area, scale it down
    let xOffset = 0;
    if (imgH > safeH) {
      const ratio = safeH / imgH;
      imgW = imgW * ratio;
      imgH = safeH;
      xOffset = (pageW - imgW) / 2; // center it
    }

    if (i > 0) pdf.addPage();

    pdf.addImage(imgData, "JPEG", xOffset, 0, imgW, imgH);

    // cleanup
    document.body.removeChild(tempContainer);
  }

  // save (download) with dynamic filename
  const fileName = mode === "all" ? "CORE_NATIVES_Full_Bundle.pdf" : `CORE_NATIVES_${state.template.toUpperCase()}.pdf`;
  pdf.save(fileName);
}

/* =========================
   Init
========================= */
function init(){
  // nav
  $$(".nav__btn").forEach(btn=>{
    btn.addEventListener("click", ()=> switchTemplate(btn.dataset.template));
  });

  // actions
  $("#btnPrint").addEventListener("click", () => downloadPDF("current"));
  $("#btnDownloadAll").addEventListener("click", () => downloadPDF("all"));
  $("#btnReset").addEventListener("click", resetCurrent);

  // first render
  setActiveNav();
  renderForm();
  renderPaper();
}

init();