/* script.js — plain JS app: products, modal, cart, reviews, razorpay demo */

// ---------- Data ----------
const PRODUCTS = [
  { id:1, title:'Shivaji Maharaj Tee', price:849, cat:'maratha', img:'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=1200&auto=format&fit=crop', colors:['Black','Saffron'], sizes:['S','M','L','XL','XXL'] },
  { id:2, title:'Maharana Pratap Tee', price:849, cat:'rajput', img:'https://images.unsplash.com/photo-1520975916090-3105956dac38?q=80&w=1200&auto=format&fit=crop', colors:['Black','White'], sizes:['S','M','L','XL','XXL'] },
  { id:3, title:'Mahabharat Warrior Tee', price:799, cat:'epic', img:'https://images.unsplash.com/photo-1516822003754-cca485356ecb?q=80&w=1200&auto=format&fit=crop', colors:['Black'], sizes:['S','M','L','XL','XXL'] },
  { id:4, title:'Bhagat Singh Tee', price:799, cat:'epic', img:'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=1200&auto=format&fit=crop', colors:['Olive','Black'], sizes:['S','M','L','XL','XXL'] },
  { id:5, title:'Rajputana Crest Tee', price:899, cat:'rajput', img:'https://images.unsplash.com/photo-1548892656-53779bea9f1a?q=80&w=1200&auto=format&fit=crop', colors:['Black'], sizes:['S','M','L','XL','XXL'] },
  { id:6, title:'Maratha Seal Tee', price:899, cat:'maratha', img:'https://images.unsplash.com/photo-1514329926535-7f6dbfbfb274?q=80&w=1200&auto=format&fit=crop', colors:['Saffron','Black'], sizes:['S','M','L','XL','XXL'] },
];

const SOON = [
  { title:'Karna – The Archer', note:'Epic Series' },
  { title:'Bajrang – Trident', note:'Mythic Series' },
  { title:'Mewar – Sun Crest', note:'Heritage Series' },
  { title:'Chhatrapati – Navy', note:'Legacy Series' },
];

const IG = [
  'https://images.unsplash.com/photo-1520975916090-3105956dac38?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1516822003754-cca485356ecb?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1548892656-53779bea9f1a?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1514329926535-7f6dbfbfb274?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=600&auto=format&fit=crop'
];

// ---------- Utilities ----------
const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
const LS = {
  get(k,d){ try{return JSON.parse(localStorage.getItem(k)) ?? d}catch(e){return d} },
  set(k,v){ localStorage.setItem(k, JSON.stringify(v)) }
};
const currency = n => `₹${n.toLocaleString('en-IN')}`;
const toast = (msg) => {
  const t = $('#toast'); t.textContent = msg; t.classList.add('open');
  setTimeout(()=> t.classList.remove('open'), 1800);
};

// ---------- App State ----------
let cart = LS.get('yodha_cart', []);
let reviews = LS.get('yodha_reviews', {});
let subs = LS.get('yodha_subs', []);
let currentDetail = null;

// ---------- Render Helpers ----------
function renderProducts(list = PRODUCTS) {
  const grid = $('#grid');
  grid.innerHTML = list.map(p => `
    <article class="card" data-id="${p.id}">
      <div class="media"><img src="${p.img}" alt="${p.title}"></div>
      <div class="body">
        <div class="title">${p.title}</div>
        <div class="meta">${p.colors.join(' • ')} <span style="float:right">240 GSM</span></div>
        <div style="display:flex;gap:8px;margin-top:12px">
          <button class="btn add" data-id="${p.id}">Add to Cart</button>
          <button class="btn ghost view" data-id="${p.id}">View</button>
        </div>
      </div>
    </article>
  `).join('');
}

function renderSoon(){ $('#soonStrip').innerHTML = SOON.map(s=>`<div class="panel"><div style="padding:20px;text-align:center;font-family:Cinzel,serif;color:var(--accent-2)">${s.title}</div><div style="padding:12px">${s.note}<br/><span class="muted">Next Drop</span></div></div>`).join(''); }
function renderInsta(){ $('#instagrid').innerHTML = IG.map(src=>`<a href="#" class="panel"><img src="${src}" style="width:100%;height:160px;object-fit:cover;border-radius:8px" /></a>`).join(''); }

// ---------- Cart ----------
function persistCart(){ LS.set('yodha_cart', cart); updateCartUI(); }
function updateCartUI(){
  $('#cart-count').textContent = cart.reduce((s,it)=>s+it.qty,0);
  const items = $('#cartItems'); items.innerHTML = '';
  if(cart.length===0){ items.innerHTML = '<div class="chip">Cart is empty</div>'; $('#cartSubtotal').textContent='₹0'; $('#cartShipping').textContent='FREE'; $('#cartTotal').textContent='₹0'; return; }
  let sub = 0;
  cart.forEach((it, idx)=>{
    sub += it.price*it.qty;
    const el = document.createElement('div'); el.className = 'panel';
    el.innerHTML = `<div style="display:flex;gap:10px;align-items:center"><img src="${it.img}" style="width:64px;height:64px;object-fit:cover;border-radius:8px"><div style="flex:1"><strong>${it.title}</strong><div class="muted">Size: ${it.size}</div><div style="margin-top:6px">${currency(it.price)} x ${it.qty}</div></div><div style="display:grid;gap:6"><button class="chip dec" data-idx="${idx}">-</button><button class="chip inc" data-idx="${idx}">+</button><button class="btn ghost rem" data-idx="${idx}">Remove</button></div></div>`;
    items.appendChild(el);
  });
  const shipping = sub>1500?0: (sub===0?0:79);
  $('#cartSubtotal').textContent = currency(sub);
  $('#cartShipping').textContent = shipping===0? 'FREE': currency(shipping);
  $('#cartTotal').textContent = currency(sub+shipping);
}

function addToCartById(id, size='M'){
  const p = PRODUCTS.find(x=>x.id===+id); if(!p) return;
  const idx = cart.findIndex(c=> c.id===p.id && c.size===size);
  if(idx>-1) cart[idx].qty = Math.min(10, cart[idx].qty+1);
  else cart.push({ id:p.id, title:p.title, price:p.price, img:p.img, size, qty:1});
  persistCart();
  toast(`${p.title} added to cart`);
}

function removeCart(idx){ cart.splice(idx,1); persistCart(); }
function changeQty(idx, q){ cart[idx].qty = Math.max(1, Math.min(10, q)); persistCart(); }

// ---------- Modal (detail) ----------
function openDetail(id){
  const p = PRODUCTS.find(x=>x.id===+id); if(!p) return;
  currentDetail = p;
  $('#pImg').src = p.img;
  $('#pTitle').textContent = p.title;
  $('#pCat').textContent = p.cat.toUpperCase();
  $('#pPrice').textContent = p.price;
  $('#pColors').textContent = p.colors.join(' • ');
  $('#pSizes').innerHTML = p.sizes.map(s=>`<button class="chip sizebtn" data-size="${s}">${s}</button>`).join('');
  renderReviewsFor(p.id);
  $('#pMask').classList.remove('hide');
}

function closeDetail(){ $('#pMask').classList.add('hide'); currentDetail = null; }

// zoom lens
(function attachZoom(){
  const box = document.querySelector('.pmedia');
  document.addEventListener('mousemove', (e)=>{
    const pm = $('#pMask');
    if(pm.classList.contains('hide')) return;
    const pbox = $('.pmedia');
    if(!pbox) return;
    const img = $('#pImg');
    const zoom = $('#zoom');
    const rect = pbox.getBoundingClientRect();
    if(e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom){ zoom.style.opacity=0; return; }
    const x = ((e.clientX - rect.left)/rect.width)*100;
    const y = ((e.clientY - rect.top)/rect.height)*100;
    zoom.style.opacity = 1;
    zoom.style.backgroundImage = `url(${img.src})`;
    zoom.style.backgroundPosition = `${x}% ${y}%`;
  });
})();

// reviews
function renderReviewsFor(pid){
  const list = reviews[pid] || [];
  const box = $('#revList'); box.innerHTML = '';
  if(list.length===0) box.innerHTML = '<div class="chip">No reviews yet</div>';
  else list.forEach(r=>{
    const d = document.createElement('div'); d.className='panel';
    d.innerHTML = `<div style="font-weight:700">${r.name} • ${'★'.repeat(r.stars)}</div><div class="muted">${r.text}</div>`;
    box.appendChild(d);
  });
}

// ---------- Subscribe/contact -->
function subscribe(email){
  if(!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){ toast('Enter valid email'); return; }
  if(!subs.includes(email)) subs.unshift(email);
  LS.set('yodha_subs', subs);
  toast('Subscribed (demo)');
}
function saveContact(data){
  const arr = LS.get('yodha_messages', []);
  arr.unshift({...data, ts: Date.now()});
  LS.set('yodha_messages', arr);
  toast('Message saved (demo)');
}

// ---------- Razorpay (client demo) ----------
let razorpayLoaded = false;
function loadRazorpay(){
  return new Promise(resolve=>{
    if(razorpayLoaded) return resolve(true);
    const s = document.createElement('script'); s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = ()=>{ razorpayLoaded = true; resolve(true) };
    s.onerror = ()=> resolve(false);
    document.body.appendChild(s);
  });
}

/*
 IMPORTANT:
 Replace 'RAZORPAY_KEY_ID' below with your Razorpay Key ID (starts rzp_test_... in test mode).
 For production, do NOT use client-only order creation. Create an order on server using your
 RAZORPAY_KEY_SECRET and return order.id — then pass order_id in options.
*/
async function payNow(form){
  const sub = cart.reduce((s,it)=> s + it.price*it.qty,0);
  if(sub<=0){ toast('Cart is empty'); return; }
  const ok = await loadRazorpay(); if(!ok){ toast('Payment library failed to load'); return; }
  const amount = Math.round((sub + (sub>1500||sub===0?0:79)) * 100); // paise
  const options = {
    key: 'RAZORPAY_KEY_ID', // <-- REPLACE with your key
    amount,
    currency: 'INR',
    name: 'Yodha',
    description: 'Yodha Order Payment',
    prefill: { name: form.name, email: form.email, contact: form.phone },
    theme: { color: '#e27a19' },
    handler: function(response){
      LS.set('yodha_last_payment', response);
      cart = []; persistCart();
      toast('Payment success: ' + (response.razorpay_payment_id||''));
      closeCart();
    },
    modal: { ondismiss(){ toast('Payment cancelled') } }
  };
  const rzp = new window.Razorpay(options);
  rzp.open();
}

// ---------- UI events ----------
document.addEventListener('click', (e)=>{
  // add/view buttons
  if(e.target.matches('.add')) addToCartById(e.target.dataset.id);
  if(e.target.matches('.view')) openDetail(e.target.dataset.id);

  // cart open/close
  if(e.target.id === 'openCart') openCart();
  if(e.target.id === 'closeCart') closeCart();

  // cart item controls
  if(e.target.matches('.rem')) { removeCart(+e.target.dataset.idx); updateCartUI(); }
  if(e.target.matches('.dec')) { const i=+e.target.dataset.idx; changeQty(i, Math.max(1, cart[i].qty-1)); }
  if(e.target.matches('.inc')) { const i=+e.target.dataset.idx; changeQty(i, cart[i].qty+1); }

  // size select in modal
  if(e.target.matches('.sizebtn')){
    $$('.sizebtn').forEach(b=>b.style.background='transparent');
    e.target.style.background = 'var(--accent)';
    e.target.style.color = '#111';
  }

  // modal add / buy
  if(e.target.id === 'pAdd'){ const size = $('.sizebtn')?.dataset?.size || 'M'; addToCartById(currentDetail.id, size); }
  if(e.target.id === 'pBuy'){ const size = $('.sizebtn')?.dataset?.size || 'M'; addToCartById(currentDetail.id, size); openCart(); closeDetail(); }

  // modal close
  if(e.target.id === 'pClose' || e.target.id === 'pMask') closeDetail();

  // notify open/close
  if(e.target.id === 'openNotify' || e.target.id === 'notify2') $('#mask').classList.remove('hide');
  if(e.target.id === 'closeNotify' || e.target.id === 'mask') $('#mask').classList.add('hide');

  // checkout open
  if(e.target.id === 'goCheckout') { closeCart(); openCheckout(); }

  // toast close on click
  if(e.target.id === 'toast') $('#toast').classList.remove('open');
});

// attach some element-specific listeners (forms)
document.addEventListener('DOMContentLoaded', ()=>{
  // render initial
  renderProducts();
  renderSoon();
  renderInsta();
  updateCartUI();
  $('#year').textContent = new Date().getFullYear();

  // filters buttons
  const filters = ['all','maratha','rajput','epic'];
  $('#filters').innerHTML = filters.map(f=>`<button class="chip filter-btn" data-cat="${f}">${f==='all'?'All':f[0].toUpperCase()+f.slice(1)}</button>`).join('');
  $('#filters').addEventListener('click', (ev)=>{ const b = ev.target.closest('button'); if(!b) return; const cat = b.dataset.cat; $$('.filter-btn').forEach(x=>x.classList.remove('active')); b.classList.add('active'); const q = $('#search').value.trim().toLowerCase(); renderProducts(PRODUCTS.filter(p=>(cat==='all'||p.cat===cat) && p.title.toLowerCase().includes(q))); });

  // search
  $('#search').addEventListener('input', ()=>{ const q = $('#search').value.trim().toLowerCase(); const active = $('.filter-btn.active')?.dataset?.cat || 'all'; renderProducts(PRODUCTS.filter(p=>(active==='all'||p.cat===active) && p.title.toLowerCase().includes(q))); });

  // contact form
  $('#contactForm').addEventListener('submit', (e)=>{
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.target).entries());
    saveContact(fd);
    e.target.reset();
  });

  // newsletter
  $('#subBtn').addEventListener('click', ()=>{ const v = $('#subEmail').value.trim(); subscribe(v); $('#subEmail').value=''; });

  // notify modal
  $('#notifyBtn').addEventListener('click', ()=>{ const v = $('#notifyEmail').value.trim(); subscribe(v); $('#notifyEmail').value=''; $('#mask').classList.add('hide'); });

  // rev form
  $('#revForm').addEventListener('submit', (e)=>{
    e.preventDefault();
    const fd = new FormData(e.target);
    const entry = { name: fd.get('name'), text: fd.get('text'), stars: +fd.get('rating'), ts: Date.now() };
    const pid = currentDetail?.id;
    if(!pid){ toast('Open product then post review'); return; }
    reviews[pid] = reviews[pid] || [];
    reviews[pid].unshift(entry);
    LS.set('yodha_reviews', reviews);
    renderReviewsFor(pid);
    e.target.reset();
    toast('Review posted');
  });

  // cart item inc/dec/rem handled by document click via delegation

});

// Cart open/close / checkout simple pages
function openCart(){ $('#cart').classList.add('open'); updateCartUI(); }
function closeCart(){ $('#cart').classList.remove('open'); }
function openCheckout(){
  // simple modal flow: prompt for name/email/phone/address then call payNow
  const name = prompt('Full name:'); if(!name) return;
  const email = prompt('Email:'); if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){ alert('Invalid email'); return; }
  const phone = prompt('Phone (10 digits):'); if(!/^\d{10}$/.test(phone)){ alert('Invalid phone'); return; }
  const address = prompt('Shipping address:'); if(!address) return;
  payNow({ name, email, phone, address });
  // store inputs for convenience
  LS.set('yodha_name', name); LS.set('yodha_email', email); LS.set('yodha_phone', phone); LS.set('yodha_address', address);
}

// ---------- init on load ----------
window.addEventListener('load', ()=> {
  // progressive: nothing to do here; DOMContentLoaded handled
});
