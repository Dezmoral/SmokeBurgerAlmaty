import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { menuSections, products } from './data.js';
import { business } from './business.js';
import { categoriesByLang, sectionText, ui } from './i18n.js';
import '../styles.css';

const INSTAGRAM = 'https://www.instagram.com/smoke.burger.kz/';
const productById = new Map(products.map(item => [item.id, item]));
const tx = (lang, key) => ui[lang]?.[key] ?? ui.ru[key] ?? key;
const productName = (item, lang) => lang === 'kk' ? item.nameKk : item.name;
const productDescription = (item, lang) => lang === 'kk' ? item.descKk : item.desc;
const money = (value, lang) => `${new Intl.NumberFormat(lang === 'kk' ? 'kk-KZ' : 'ru-RU').format(value)} ₸`;

function BurgerIcon() {
  return <svg viewBox="0 0 40 40" aria-hidden="true"><path d="M7 19a13 10 0 0 1 26 0H7Z"/><path d="M8 22h24M10 26h20M12 30h16"/><path d="M15 13h.2M21 10h.2M26 14h.2"/></svg>;
}

function SiteLink({ to, navigate, children, ...props }) {
  return <a href={to} onClick={event => {
    if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
      event.preventDefault();
      navigate(to);
    }
  }} {...props}>{children}</a>;
}

function Brand({ navigate }) {
  return <SiteLink className="brand" to="/" navigate={navigate} aria-label="Smoke Burger — главная">
    <span className="brand-mark"><BurgerIcon/></span><span className="brand-name">SMOKE<span>BURGER</span></span>
  </SiteLink>;
}

function Header({ page, navigate, itemCount, openCart, lang, setLang }) {
  return <>
    <div className="topline"><span>SMOKE BURGER</span><span>{tx(lang,'tagline')}</span><a href={INSTAGRAM} target="_blank" rel="noreferrer">INSTAGRAM ↗</a></div>
    <header className="site-header">
      <Brand navigate={navigate}/>
      <nav className="main-nav" aria-label={lang==='ru'?'Основная навигация':'Негізгі навигация'}>
        <SiteLink to="/" navigate={navigate} className={page==='home'?'active':''}>{tx(lang,'home')}</SiteLink>
        <SiteLink to="/menu" navigate={navigate} className={page==='menu'?'active':''}>{tx(lang,'menu')}</SiteLink>
        <SiteLink to="/contacts" navigate={navigate} className={page==='contacts'?'active':''}>{tx(lang,'contacts')}</SiteLink>
        <button className="language-toggle" onClick={()=>setLang(lang==='ru'?'kk':'ru')} aria-label={lang==='ru'?'Қазақшаға ауысу':'Переключить на русский'}>{lang==='ru'?<>RU <span>/</span> ҚАЗ</>:<>ҚАЗ <span>/</span> RU</>}</button>
      </nav>
      <button className="cart-trigger" onClick={openCart}><span className="cart-icon">▱</span><span>{tx(lang,'cart')}</span><b className="cart-count">{itemCount}</b></button>
    </header>
  </>;
}

function Footer({ navigate, lang }) {
  return <footer className="site-footer">
    <Brand navigate={navigate}/><p>{tx(lang,'footerTagline')}</p>
    <div><SiteLink to="/menu" navigate={navigate}>{tx(lang,'menu')}</SiteLink><SiteLink to="/contacts" navigate={navigate}>{tx(lang,'contacts')}</SiteLink><a href={INSTAGRAM} target="_blank" rel="noreferrer">Instagram ↗</a></div>
    <small>© 2026 Smoke Burger · {tx(lang,'studentProject')}</small>
  </footer>;
}

function ProductCard({ item, onCustomize, lang }) {
  return <article className="product-card">
    <div className="product-photo"><img className={item.imageFit==='contain'?'image-contain':''} src={item.image} alt={productName(item,lang)} loading="lazy" onError={event=>{event.currentTarget.style.display='none'}}/>{item.badge&&<span className="product-badge">{item.badge}</span>}</div>
    <div className="product-info"><h3>{productName(item,lang)}</h3><p>{productDescription(item,lang)}</p>
      <div className="product-calories" aria-label={`≈ ${item.calories} ${tx(lang,'calorieUnit')}`}>≈ {item.calories} {tx(lang,'calorieUnit')}</div>
      <div className="product-bottom"><span className="product-price">{money(item.price,lang)}</span><button className="add-button" onClick={()=>onCustomize(item)} aria-label={`${tx(lang,'customize')}: ${productName(item,lang)}`}>+</button></div>
    </div>
  </article>;
}

function HomePage({ navigate, onCustomize, lang }) {
  const featured = ['chicken-burger','chicken-lavash','wings-10','box-chicken'].map(id=>products.find(item=>item.id===id));
  const words = ui[lang].heroWords;
  const [highlight,...lastWords] = words[2].split(' ');
  return <main>
    <section className="hero">
      <div className="hero-copy"><p className="eyebrow"><i/>{tx(lang,'heroEyebrow')}</p>
        <h1><span>{words[0]}</span><span>{words[1]}</span><span className="hero-desire"><em>{highlight}</em> {lastWords.join(' ')}</span></h1>
        <p className="hero-sub">{tx(lang,'heroSub')}</p>
        <div className="hero-actions"><SiteLink className="btn btn-primary" to="/menu" navigate={navigate}>{tx(lang,'viewMenu')} <span>↗</span></SiteLink><a className="text-link" href="#popular">{tx(lang,'chooseFavorites')} <span>↓</span></a></div>
        <div className="hero-note"><span className="note-icon">✳</span><span>{tx(lang,'buildOrder')}<br/><b>{tx(lang,'inFewTaps')}</b></span></div>
      </div>
      <div className="hero-visual"><div className="hero-stamp">SMOKE<br/><b>BURGER</b></div><div className="hero-image"/><div className="hero-swipe">SMOKE<br/>IT UP <span>↗</span></div><div className="hero-number">01 <span>/ 03</span></div></div>
      <div className="hero-bottom"><span>{tx(lang,'heroCategories')}</span><span>{tx(lang,'buildOrder').toUpperCase()} <b>↓</b></span></div>
    </section>
    <div className="ticker" aria-label={tx(lang,'menuTicker')}><div className="ticker-track">{[0,1].map(copy=><span className="ticker-copy" key={copy}>{Array.from({length:3},(_,index)=><React.Fragment key={index}>{tx(lang,'menuTicker')} • </React.Fragment>)}</span>)}</div></div>
    <section className="section popular" id="popular">
      <div className="section-head"><div><p className="eyebrow"><i/>{tx(lang,'favoritesEyebrow')}</p><h2>{tx(lang,'favorites')}</h2></div><SiteLink className="text-link" to="/menu" navigate={navigate}>{tx(lang,'allMenu')} <span>↗</span></SiteLink></div>
      <div className="product-grid">{featured.map(item=><ProductCard key={item.id} item={item} onCustomize={onCustomize} lang={lang}/>)}</div><p className="nutrition-note">{tx(lang,'calorieNote')}</p>
    </section>
    <section className="promo-band"><div className="promo-copy"><p className="eyebrow"><i/>{tx(lang,'comboEyebrow')}</p><h2>{tx(lang,'comboTitle1')}<br/><em>{tx(lang,'comboTitle2')}</em></h2><p>{tx(lang,'comboDescription')}</p><SiteLink className="btn btn-primary" to="/menu#combos" navigate={navigate}>{tx(lang,'chooseCombo')} <span>↗</span></SiteLink></div>
      <div className="promo-art"><div className="promo-food-grid"><img className="promo-food-main" src="/assets/instagram/chicken-box.png" alt={`${tx(lang,'foodBurger')} Smoke Burger`}/><img src="https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=500&q=85" alt={tx(lang,'foodFries')}/><img src="https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=500&q=85" alt={tx(lang,'foodCola')}/></div><div className="promo-art-caption"><b>{tx(lang,'foodBurger')}</b><span>+</span><b>{tx(lang,'foodFries')}</b><span>+</span><b>{tx(lang,'foodCola')}</b></div></div>
    </section>
    <section className="section promise"><div><span className="promise-number">01</span><h3>{tx(lang,'promise1Title')}</h3><p>{tx(lang,'promise1Text')}</p></div><div><span className="promise-number">02</span><h3>{tx(lang,'promise2Title')}</h3><p>{tx(lang,'promise2Text')}</p></div><div><span className="promise-number">03</span><h3>{tx(lang,'promise3Title')}</h3><p>{tx(lang,'promise3Text')}</p></div></section>
    <section className="instagram-block"><div><p className="eyebrow"><i/>{tx(lang,'instaEyebrow')}</p><h2>SMOKE BURGER<br/><em>{tx(lang,'instaTitle').includes('INSTAGRAM')?'В INSTAGRAM':'INSTAGRAM-ДА'}</em></h2><p>{tx(lang,'instaDescription')}</p><a className="btn btn-outline" href={INSTAGRAM} target="_blank" rel="noreferrer">@smoke.burger.kz <span>↗</span></a></div>
      <a className="insta-art" href={INSTAGRAM} target="_blank" rel="noreferrer" aria-label="@smoke.burger.kz"><div className="insta-card-header"><span className="insta-avatar"><BurgerIcon/></span><span className="insta-account"><b>@smoke.burger.kz</b><small>{tx(lang,'instaOfficial')}</small></span><span className="insta-open">{tx(lang,'openProfile')}</span></div><div className="insta-photos"><img src="/assets/instagram/chicken-box.png" alt={`${tx(lang,'foodBurger')} Smoke Burger`}/><img src="/assets/instagram/wings.png" alt={lang==='ru'?'Крылышки Smoke Burger':'Smoke Burger қанаттары'}/><img src="/assets/instagram/pizza.png" alt={lang==='ru'?'Пицца Smoke Burger':'Smoke Burger пиццасы'}/></div></a>
    </section>
  </main>;
}

function MenuPage({ onCustomize, lang }) {
  const categories = categoriesByLang[lang];
  return <main>
    <section className="page-hero menu-hero"><div><p className="eyebrow"><i/>{tx(lang,'menuEyebrow')}</p><h1>{tx(lang,'menuTitle')}</h1><p>{tx(lang,'menuDescription')}</p></div><div className="menu-hero-art"><img src="/assets/menu/maki/combo.jpg" alt={lang==='ru'?'Комбо с бургером, фри и напитком':'Бургер, фри және сусыны бар комбо'}/><div><small>SMOKE BURGER</small><b>{lang==='ru'?'МЕНЮ':'МӘЗІР'}<br/>{lang==='ru'?'БЕЗ ЛИШНИХ':'ТАҢДАУ ӨЗІҢДЕ'}<br/>{lang==='ru'?'СЛОВ':''}</b></div><span>{lang==='ru'?'100% ВКУС':'100% ДӘМ'}</span></div></section>
    <div className="menu-toolbar"><div className="menu-cats">{categories.map(([id,label])=><a key={id} href={`#${id}`}>{label}</a>)}</div></div>
    <p className="nutrition-note menu-nutrition-note">{tx(lang,'calorieNote')}</p>
    {menuSections.map(section=>{const items=products.filter(item=>item.category===section.category);const [title,note]=sectionText[lang][section.category];return <section className="menu-section" id={section.id} key={section.id}><div className="menu-section-head"><h2>{title}</h2><p>{note}</p></div><div className="product-grid">{items.map(item=><ProductCard key={item.id} item={item} onCustomize={onCustomize} lang={lang}/>)}</div></section>})}
  </main>;
}

function ContactsPage({ navigate, lang }) {
  const address = lang==='ru'?business.address:business.addressKk;
  const hours = lang==='ru'?business.hours:business.hoursKk;
  const closed = lang==='ru'?business.closedDay:business.closedDayKk;
  const delivery = lang==='ru'?business.deliveryNote:business.deliveryNoteKk;
  return <main>
    <section className="page-hero contact-hero"><div><p className="eyebrow"><i/>{tx(lang,'contactEyebrow')}</p><h1>{tx(lang,'contactTitle')}</h1><p>{tx(lang,'contactDescription')}</p><a className="btn btn-primary contact-cta" href={`tel:${business.phoneLink}`}>{tx(lang,'callRestaurant')} <span>↗</span></a></div>
      <div className="contact-card"><span className="contact-card-label">@SMOKE.BURGER.KZ</span><div className="contact-ig">◎</div><b>{business.phoneDisplay}</b><p>{tx(lang,'delivery')}</p><a href={INSTAGRAM} target="_blank" rel="noreferrer">INSTAGRAM ↗</a></div>
    </section>
    <section className="contact-details business-details">
      <div><span className="promise-number">01</span><h2>{tx(lang,'findUs')}</h2><p>{address}</p><a className="text-link" href={business.mapUrl} target="_blank" rel="noreferrer">{lang==='ru'?'Открыть карту ↗':'Картаны ашу ↗'}</a></div>
      <div><span className="promise-number">02</span><h2>{tx(lang,'hours')}</h2><p>{hours}<br/>{closed}</p><a className="text-link" href={`tel:${business.phoneLink}`}>{business.phoneDisplay} ↗</a></div>
      <div className="contact-note"><span>ℹ</span><p>{delivery}</p></div>
      <div className="contact-details-cta"><span className="promise-number">03</span><h2>{tx(lang,'orderOnline')}</h2><p>{tx(lang,'messageUs')}</p><SiteLink className="text-link" to="/menu" navigate={navigate}>{tx(lang,'viewMenu')} ↗</SiteLink></div>
    </section>
  </main>;
}

function CustomizeDialog({ item, lang, onClose, onAdd }) {
  const [extras,setExtras] = useState({cheese:false,sauce:false,fries:false});
  const [note,setNote] = useState('');
  const selected = item;
  const meatBurger = ['chicken-burger','chicken-burger-cheese','double-chicken','beef-burger','beef-burger-cheese','double-beef'].includes(selected.id);
  const cheeseIncluded = selected.id.includes('cheese') || selected.id.startsWith('double-');
  const basePrice = selected.price + (extras.cheese&&!cheeseIncluded?100:0) + (extras.sauce?250:0) + (extras.fries?900:0);
  const calories = selected.calories + (extras.cheese&&!cheeseIncluded?50:0) + (extras.sauce?100:0) + (extras.fries?350:0);
  const toggle = key => setExtras(current=>({...current,[key]:!current[key]}));
  const add = () => {
    const addons = {cheese:extras.cheese&&!cheeseIncluded,sauce:extras.sauce,fries:extras.fries};
    const entry = {...selected,price:basePrice,calories,addons,note:note.trim(),itemKey:`${selected.id}:${Object.values(addons).join('')}:${note.trim()}`,qty:1};
    onAdd(entry);
  };
  return <div className="customize-overlay" onMouseDown={event=>{if(event.target===event.currentTarget)onClose()}}>
    <section className="customize-dialog compact-options single-item" role="dialog" aria-modal="true" aria-label={tx(lang,'customize')}>
      <div className="customize-head"><div className="customize-product-image"><img className={selected.imageFit==='contain'?'image-contain':''} src={selected.image} alt="" onError={event=>{event.currentTarget.style.visibility='hidden'}}/></div><div className="customize-title"><p className="eyebrow">{tx(lang,'customize')}</p><h2>{productName(selected,lang)}</h2><span>{money(selected.price,lang)}</span></div><button className="icon-button" onClick={onClose} aria-label={tx(lang,'close')}>×</button></div>
      <fieldset className="customize-options"><legend>{tx(lang,'extras')}</legend>
        {meatBurger&&!cheeseIncluded&&<label className={`addon-option ${extras.cheese?'is-selected':''}`}><input type="checkbox" checked={extras.cheese} onChange={()=>toggle('cheese')}/><span>{tx(lang,'addCheese')}</span><b>+100 ₸</b></label>}
        {selected.category!=='drinks'&&<label className={`addon-option ${extras.sauce?'is-selected':''}`}><input type="checkbox" checked={extras.sauce} onChange={()=>toggle('sauce')}/><span>{tx(lang,'extraSauce')}</span><b>+250 ₸</b></label>}
        {selected.category!=='drinks'&&selected.category!=='snacks'&&<label className={`addon-option ${extras.fries?'is-selected':''}`}><input type="checkbox" checked={extras.fries} onChange={()=>toggle('fries')}/><span>{tx(lang,'extraFries')}</span><b>+900 ₸</b></label>}
      </fieldset>
      <label className="customize-note">{tx(lang,'commentForDish')}<textarea value={note} onChange={event=>setNote(event.target.value)} maxLength={140} placeholder={tx(lang,'commentPlaceholder')}/></label>
      <div className="customize-footer"><span>≈ {calories} {tx(lang,'calorieUnit')}</span><button className="btn btn-primary" onClick={add}>{tx(lang,'addToCart')} · {money(basePrice,lang)}</button></div>
    </section>
  </div>;
}

function addonLabels(item,lang) {
  const labels=[];
  if(item.addons?.cheese)labels.push(tx(lang,'extraCheeseLabel'));
  if(item.addons?.sauce)labels.push(tx(lang,'extraSauceLabel'));
  if(item.addons?.fries)labels.push(tx(lang,'extraFriesLabel'));
  return labels;
}

function CartDrawer({ cart, setCart, closeCart, navigate, lang }) {
  const [step,setStep] = useState('cart');
  const [customer,setCustomer] = useState(null);
  const [sent,setSent] = useState(false);
  const sum = cart.reduce((total,item)=>total+item.price*item.qty,0);
  const changeQty = (key,delta)=>setCart(current=>current.map(item=>(item.itemKey||item.id)===key?{...item,qty:item.qty+delta}:item).filter(item=>item.qty>0));
  const remove = key=>setCart(current=>current.filter(item=>(item.itemKey||item.id)!==key));
  const submitDetails = event=>{event.preventDefault();const data=new FormData(event.currentTarget);setCustomer({name:String(data.get('name')).trim(),phone:String(data.get('phone')).trim(),address:String(data.get('address')).trim(),comment:String(data.get('comment')).trim()});setStep('review')};
  const messageLines = [
    lang==='ru'?'Здравствуйте! Хочу оформить заказ в Smoke Burger:':'Сәлеметсіз бе! Smoke Burger-ден тапсырыс бергім келеді:',
    ...cart.map(item=>`• ${productName(item,lang)} × ${item.qty} — ${money(item.price*item.qty,lang)}${addonLabels(item,lang).length?` (${addonLabels(item,lang).join(', ')})`:''}${item.note?` — ${item.note}`:''}`),
    `${tx(lang,'reviewTotal')}: ${money(sum,lang)}`,
    `${tx(lang,'name')}: ${customer?.name||''}`,
    `${tx(lang,'phone')}: ${customer?.phone||''}`,
    `${tx(lang,'address')}: ${customer?.address||''}`,
    customer?.comment?`${tx(lang,'orderComment')}: ${customer.comment}`:'',
  ].filter(Boolean).join('\n');
  const whatsAppUrl=`https://wa.me/77770403407?text=${encodeURIComponent(messageLines)}`;
  return <>
    <div className="cart-overlay" aria-hidden="true" onClick={closeCart}/>
    <aside className="cart-drawer" role="dialog" aria-modal="true" aria-label={tx(lang,'cart')}>
      <div className="cart-head"><div><p className="eyebrow">{tx(lang,'cartTitle')}</p><h2>{tx(lang,'cart')} <span className="cart-count">{cart.reduce((n,item)=>n+item.qty,0)}</span></h2></div><button className="icon-button" onClick={closeCart} aria-label={tx(lang,'close')}>×</button></div>
      {sent?<div className="order-success"><span>✓</span><h3>{tx(lang,'orderReady')}</h3><p>{tx(lang,'orderReadyText')}</p><button className="btn btn-primary" onClick={closeCart}>{tx(lang,'continueShopping')}</button></div>:step==='cart'?<>
        <div className="cart-items">{cart.map(item=><div className="cart-row" key={item.itemKey||item.id}><span className="cart-row-name">{productName(item,lang)}</span><span className="cart-row-price">{money(item.price*item.qty,lang)}</span><small className="cart-row-calories">≈ {item.calories} {tx(lang,'calorieUnit')} · {tx(lang,'perServing')}</small>{addonLabels(item,lang).length>0&&<small className="cart-row-calories">{addonLabels(item,lang).join(' · ')}</small>}{item.note&&<small className="cart-row-calories">{item.note}</small>}<div className="cart-row-controls"><button className="qty-btn" onClick={()=>changeQty(item.itemKey||item.id,-1)} aria-label="−">−</button><span className="qty">{item.qty}</span><button className="qty-btn" onClick={()=>changeQty(item.itemKey||item.id,1)} aria-label="+">+</button><button className="remove-item" onClick={()=>remove(item.itemKey||item.id)}>{tx(lang,'remove')}</button></div></div>)}</div>
        {cart.length===0?<div className="cart-empty"><span>▱</span><b>{tx(lang,'emptyCart')}</b><p>{tx(lang,'emptyCartText')}</p><button className="btn btn-primary" onClick={()=>{closeCart();navigate('/menu')}}>{tx(lang,'openMenu')} ↗</button></div>:<div className="cart-footer"><div className="cart-total"><span>{tx(lang,'total')}</span><b>{money(sum,lang)}</b></div><button className="btn btn-primary" onClick={()=>setStep('checkout')}>{tx(lang,'toCheckout')} <span>↗</span></button></div>}
      </>:step==='checkout'?<form className="checkout-form checkout-form-active" onSubmit={submitDetails}><button className="back-link" type="button" onClick={()=>setStep('cart')}>← {tx(lang,'backToCart')}</button><p className="eyebrow">{tx(lang,'checkoutTitle')}</p><h3>{tx(lang,'checkoutTitle')}</h3><label>{tx(lang,'name')}<input name="name" autoComplete="name" required placeholder={tx(lang,'namePlaceholder')}/></label><label>{tx(lang,'phone')}<input name="phone" type="tel" autoComplete="tel" required placeholder="+7 (___) ___-__-__"/></label><label>{tx(lang,'address')}<textarea name="address" autoComplete="street-address" required placeholder={tx(lang,'addressPlaceholder')}/></label><label>{tx(lang,'orderComment')}<input name="comment" placeholder={tx(lang,'orderCommentPlaceholder')}/></label><button className="btn btn-primary" type="submit">{tx(lang,'continueReview')} <span>↗</span></button></form>
      :<div className="order-review"><button className="back-link" type="button" onClick={()=>setStep('checkout')}>← {tx(lang,'checkoutTitle')}</button><p className="eyebrow">{tx(lang,'reviewTitle')}</p><h3>{tx(lang,'reviewTitle')}</h3><div className="review-items"><h4>{tx(lang,'reviewItems')}</h4>{cart.map(item=><div className="review-row" key={item.itemKey||item.id}><span>{productName(item,lang)} × {item.qty}</span><b>{money(item.price*item.qty,lang)}</b>{addonLabels(item,lang).length>0&&<small>{addonLabels(item,lang).join(' · ')}</small>}{item.note&&<small>{item.note}</small>}</div>)}</div><div className="review-recipient"><h4>{tx(lang,'recipient')}</h4><p>{customer?.name} · {customer?.phone}<br/>{customer?.address}{customer?.comment&&<><br/>{customer.comment}</>}</p></div><div className="cart-total"><span>{tx(lang,'reviewTotal')}</span><b>{money(sum,lang)}</b></div><a className="btn btn-primary send-order" href={whatsAppUrl} target="_blank" rel="noreferrer" onClick={()=>setSent(true)}>{tx(lang,'sendWhatsApp')} <span>↗</span></a><small className="whatsapp-note">{tx(lang,'whatsAppNote')}</small></div>}
    </aside>
  </>;
}

function App() {
  const [path,setPath] = useState(window.location.pathname);
  const [cartOpen,setCartOpen] = useState(false);
  const [lang,setLang] = useState(()=>localStorage.getItem('smokeBurgerLang')==='kk'?'kk':'ru');
  const [customizeProduct,setCustomizeProduct] = useState(null);
  const [cart,setCart] = useState(()=>{
    try {
      const saved=JSON.parse(localStorage.getItem('smokeBurgerCart')||'[]');
      return Array.isArray(saved)?saved.filter(item=>item&&productById.has(item.id)&&Number.isInteger(item.qty)&&item.qty>0).map(item=>({...productById.get(item.id),...item,price:Number.isFinite(item.price)?item.price:productById.get(item.id).price,calories:Number.isFinite(item.calories)?item.calories:productById.get(item.id).calories,itemKey:item.itemKey||item.id,addons:item.addons||{}})):[];
    } catch { return []; }
  });
  const [toast,setToast] = useState('');
  const page=path==='/menu'?'menu':path==='/contacts'?'contacts':'home';
  const itemCount=useMemo(()=>cart.reduce((sum,item)=>sum+item.qty,0),[cart]);
  const navigate=to=>{const [pathname,hash]=to.split('#');const destination=pathname||window.location.pathname;window.history.pushState({},'',`${destination}${hash?`#${hash}`:''}`);setPath(destination);setCartOpen(false);window.setTimeout(()=>{if(hash)document.getElementById(hash)?.scrollIntoView({behavior:'smooth'});else window.scrollTo({top:0,behavior:'smooth'})},0)};
  useEffect(()=>{const onPop=()=>{setPath(window.location.pathname);setCartOpen(false)};window.addEventListener('popstate',onPop);return()=>window.removeEventListener('popstate',onPop)},[]);
  useEffect(()=>{try{localStorage.setItem('smokeBurgerCart',JSON.stringify(cart))}catch{}},[cart]);
  useEffect(()=>{localStorage.setItem('smokeBurgerLang',lang);document.documentElement.lang=lang},[lang]);
  useEffect(()=>{document.body.classList.toggle('cart-open',cartOpen);return()=>document.body.classList.remove('cart-open')},[cartOpen]);
  useEffect(()=>{if(!cartOpen)return;const onKeyDown=event=>{if(event.key==='Escape')setCartOpen(false)};window.addEventListener('keydown',onKeyDown);return()=>window.removeEventListener('keydown',onKeyDown)},[cartOpen]);
  useEffect(()=>{if(!toast)return;const timeout=window.setTimeout(()=>setToast(''),1900);return()=>window.clearTimeout(timeout)},[toast]);
  const addToCart=item=>{setCart(current=>{const existing=current.find(entry=>(entry.itemKey||entry.id)===item.itemKey);return existing?current.map(entry=>(entry.itemKey||entry.id)===item.itemKey?{...entry,qty:entry.qty+1}:entry):[...current,item]});setCustomizeProduct(null);setToast(`${productName(item,lang)} ${tx(lang,'added')}`)};
  return <>
    <Header page={page} navigate={navigate} itemCount={itemCount} openCart={()=>setCartOpen(true)} lang={lang} setLang={setLang}/>
    {page==='menu'?<MenuPage onCustomize={setCustomizeProduct} lang={lang}/>:page==='contacts'?<ContactsPage navigate={navigate} lang={lang}/>:<HomePage navigate={navigate} onCustomize={setCustomizeProduct} lang={lang}/>}
    <Footer navigate={navigate} lang={lang}/>
    {cartOpen&&<CartDrawer cart={cart} setCart={setCart} closeCart={()=>setCartOpen(false)} navigate={navigate} lang={lang}/>}
    {customizeProduct&&<CustomizeDialog key={customizeProduct.id} item={customizeProduct} lang={lang} onClose={()=>setCustomizeProduct(null)} onAdd={addToCart}/>}
    <div className={`toast ${toast?'show':''}`}>{toast}</div>
  </>;
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>);
