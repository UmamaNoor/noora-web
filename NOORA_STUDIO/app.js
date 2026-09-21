const products=[];
let cart=JSON.parse(localStorage.getItem("nooraCart")||"[]"),filter="All";const $=s=>document.querySelector(s),money=n=>"PKR "+n.toLocaleString("en-PK");
function renderProducts(){}
function setFilter(f){filter=f;document.querySelectorAll("#filters button").forEach(b=>b.classList.toggle("active",b.dataset.filter===f));renderProducts();}
const filters=document.querySelector("#filters");if(filters)filters.addEventListener("click",e=>{let b=e.target.closest("[data-filter]");if(b)setFilter(b.dataset.filter)});document.querySelectorAll(".categories [data-filter]").forEach(a=>a.addEventListener("click",()=>setFilter(a.dataset.filter)));
function persist(){localStorage.setItem("nooraCart",JSON.stringify(cart));renderCart()}function renderCart(){let n=cart.reduce((s,x)=>s+x.qty,0);$("#count").textContent=n;$("#drawerCount").textContent="("+n+")";$("#subtotal").textContent=money(cart.reduce((s,x)=>s+(products.find(p=>p.id===x.id)?.price||0)*x.qty,0));if(!cart.length){$("#items").innerHTML='<div class="empty">Your bag is waiting for something lovely.</div>';return;}$("#items").innerHTML=cart.map(x=>{let p=products.find(p=>p.id===x.id);if(!p)return '';return `<div class="cart-item"><img src="${p.img}"><div><h4>${p.name}</h4><p>${x.size} · ${money(p.price)}</p><div class="qty"><button data-qty="-1" data-id="${x.id}" data-size="${x.size}">−</button>${x.qty}<button data-qty="1" data-id="${x.id}" data-size="${x.size}">+</button></div></div><button class="remove" data-remove="${x.id}" data-size="${x.size}">×</button></div>`}).join("")}
function openCart(){$("#drawer").classList.add("open");$("#overlay").classList.add("show");document.body.style.overflow="hidden"}function closeCart(){$("#drawer").classList.remove("open");$("#overlay").classList.remove("show");document.body.style.overflow=""}$("#openCart").onclick=openCart;$("#closeCart").onclick=closeCart;$("#overlay").onclick=closeCart;
$("#items").addEventListener("click",e=>{let q=e.target.closest("[data-qty]"),r=e.target.closest("[data-remove]");if(q){let x=cart.find(x=>x.id===+q.dataset.id&&x.size===q.dataset.size);if(!x)return;x.qty+=+q.dataset.qty;if(x.qty<=0)cart=cart.filter(y=>y!==x);persist()}if(r){cart=cart.filter(x=>!(x.id===+r.dataset.remove&&x.size===r.dataset.size));persist()}});
function quickView(id){let p=products.find(x=>x.id===id);if(!p)return;$("#quickContent").innerHTML=`<div class="quick-layout"><img src="${p.img}" alt="${p.name}"><div class="quick-details"><p class="eyebrow">${p.category} · NOORA STUDIO</p><h2>${p.name}</h2><b>${money(p.price)}</b><p>${p.desc}</p><label for="size">Select Size</label><select id="size"><option value="">Choose a size</option><option>Small</option><option>Medium</option><option>Large</option><option>XL</option></select><button class="btn" id="add">Add to Bag ＋</button><small id="sizeErr"></small></div></div>`;$("#add").onclick=()=>{let size=$("#size").value;if(!size){$("#sizeErr").textContent="Please select a size.";return}let old=cart.find(x=>x.id===id&&x.size===size);if(old)old.qty++;else cart.push({id,size,qty:1});$("#quick").close();persist();openCart()};$("#quick").showModal()}
const productGrid=$("#products");if(productGrid)productGrid.addEventListener("click",e=>{let el=e.target.closest("[data-quick]");if(el)quickView(+el.dataset.quick)});$("#closeQuick").onclick=()=>$("#quick").close();$("#checkout").onclick=()=>{$("#checkoutNote").textContent=cart.length?"The collection is launching soon. Use the interest form below to contact us.":"Your bag is empty.";if(cart.length){closeCart();document.querySelector('#order-interest').scrollIntoView({behavior:'smooth'})}};
$("#menu").onclick=()=>$("#nav").classList.toggle("open");$("#nav").querySelectorAll("a").forEach(a=>a.onclick=()=>$("#nav").classList.remove("open"));$("#news").onsubmit=e=>{e.preventDefault();$("#newsMsg").textContent="Thank you for joining the NOORA list!";e.target.reset()};

// Submit a pre-launch interest request to Supabase. This is not a confirmed sale.
const orderForm=$("#orderForm");
if(orderForm){
  orderForm.addEventListener("submit",async e=>{
    e.preventDefault();const msg=$("#orderMessage"),btn=$("#submitOrder");msg.className="form-message";msg.textContent="";
    const cfg=window.NOORA_SUPABASE;const sb=window.supabase;
    if(!cfg?.url||!cfg?.publishableKey||!sb?.createClient){msg.classList.add("error");msg.textContent="Connection setup is missing. Please contact NOORA STUDIO directly.";return;}
    const fd=new FormData(orderForm);const data=Object.fromEntries(fd.entries());
    data.quantity=Number(data.quantity);data.total_amount=0;data.order_status="Pending";
    if(!Number.isInteger(data.quantity)||data.quantity<1||data.quantity>20){msg.classList.add("error");msg.textContent="Please enter a quantity between 1 and 20.";return;}
    btn.disabled=true;btn.textContent="Sending…";
    try{
      const client=sb.createClient(cfg.url,cfg.publishableKey);
      const {error}=await client.from("orders").insert(data);
      if(error)throw error;
      // Email notification is configured separately through a secured Supabase Database Webhook.
      msg.textContent="Thank you! Your interest request has been received. NOORA STUDIO will contact you to confirm availability and pricing.";orderForm.reset();orderForm.querySelector('[name="quantity"]').value="1";
    }catch(err){console.error(err);msg.classList.add("error");msg.textContent="We couldn’t submit your request right now. Please try again later or contact us directly."}
    finally{btn.disabled=false;btn.textContent="Send my interest ↗"}
  });
}
renderProducts();renderCart();
