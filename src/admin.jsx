import React, { useEffect, useMemo, useState } from 'react';
import {
  backendConfigured, demoMode, signIn, signOut, verifyStaff,
  fetchMenu, fetchPromotions, fetchReviews,
  fetchOrders,
  saveMenuItem, deleteMenuItem, savePromotion, deletePromotion,
  setReviewStatus, deleteReview,
  updateOrderStatus, deleteOrder,
} from './backend.js';
import { menuSections } from './data.js';
import { ui } from './i18n.js';

const t = (lang, key) => ui[lang]?.[key] ?? ui.ru[key] ?? key;
const makeEmptyOffer = () => ({ title_ru:'',title_kk:'',description_ru:'',description_kk:'',terms_ru:'',terms_kk:'',valid_from:'',valid_until:'',active:true });
const localDate = value => value ? new Date(`${value}T00:00:00`).toLocaleDateString() : '';

function DemoNotice({ lang }) {
  return <div className="admin-notice"><b>DEMO</b><span>{t(lang,'adminDemo')} {t(lang,'adminBackend')}</span></div>;
}

function Login({ lang, onLogin, error }) {
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  return <form className="admin-login" onSubmit={event=>{event.preventDefault();onLogin(email,password)}}>
    <p className="eyebrow">{t(lang,'adminTitle')}</p><h2>{t(lang,'adminLoginTitle')}</h2>
    <label>{t(lang,'adminEmail')}<input className="admin-input" type="email" value={email} onChange={event=>setEmail(event.target.value)} required autoComplete="username"/></label>
    <label>{t(lang,'adminPassword')}<input className="admin-input" type="password" value={password} onChange={event=>setPassword(event.target.value)} required autoComplete="current-password"/></label>
    {error&&<p className="admin-error" role="alert">{error}</p>}
    <button className="btn btn-primary" type="submit">{t(lang,'adminSignIn')} <span>↗</span></button>
  </form>;
}

function MenuEditor({ lang, items, onSave, onDelete, onMessage }) {
  const [search,setSearch]=useState('');
  const [selectedId,setSelectedId]=useState(items[0]?.id || '');
  const [draft,setDraft]=useState(null);
  const [dirty,setDirty]=useState(false);
  const [saving,setSaving]=useState(false);
  const filtered=useMemo(()=>items.filter(item=>`${item.name} ${item.nameKk} ${item.id}`.toLowerCase().includes(search.toLowerCase())),[items,search]);
  useEffect(()=>{if(dirty)return;const match=items.find(item=>item.id===selectedId)||items[0];if(match){setSelectedId(match.id);setDraft({...match,available:match.available!==false})}else setDraft(null)},[items,selectedId,dirty]);
  const selectItem=id=>{setDirty(false);setSelectedId(id);const item=items.find(entry=>entry.id===id);setDraft(item?{...item,available:item.available!==false}:null)};
  const change=(key,value)=>{setDirty(true);setDraft(current=>({...current,[key]:value}))};
  const addItem=()=>{
    const id=`new-${Date.now()}`;
    setDirty(true);
    setSelectedId(id);
    setDraft({id,name:'',nameKk:'',desc:'',descKk:'',price:0,category:'burgers',image:items[0]?.image || '',badge:'',calories:0,available:true});
  };
  const submit=async event=>{
    event.preventDefault();setSaving(true);
    try{await onSave(draft);setDirty(false);onMessage(t(lang,'adminSaved'))}
    catch(error){onMessage(error.message || t(lang,'adminFailed'))}
    finally{setSaving(false)}
  };
  const remove=async()=>{
    if(!draft||!items.some(item=>item.id===draft.id)){setDirty(false);setDraft(null);setSelectedId(items[0]?.id||'');return}
    if(!window.confirm(`${t(lang,'adminDelete')}: ${draft.name}?`))return;
    setSaving(true);try{await onDelete(draft.id);const next=items.filter(item=>item.id!==draft.id);setDirty(false);setDraft(next[0]?{...next[0]}:null);setSelectedId(next[0]?.id||'');onMessage(t(lang,'adminSaved'))}catch(error){onMessage(error.message||t(lang,'adminFailed'))}finally{setSaving(false)}
  };
  return <div className="admin-editor-layout">
    <aside className="admin-item-list"><input className="admin-input" placeholder="Поиск / Іздеу" value={search} onChange={event=>setSearch(event.target.value)}/>
      <div className="admin-item-options">{filtered.map(item=><button type="button" key={item.id} className={`admin-item-option ${selectedId===item.id?'active':''}`} onClick={()=>selectItem(item.id)}><span>{item.name}</span><b>{item.available===false?'—':`${item.price} ₸`}</b></button>)}</div>
      <button type="button" className="admin-add-button" onClick={addItem}>＋ {t(lang,'adminAddDish')}</button>
    </aside>
    {draft?<form className="admin-form" onSubmit={submit}>
      <div className="admin-form-title"><div><p className="eyebrow">{t(lang,'adminMenuTab')}</p><h3>{draft.name||t(lang,'adminAddDish')}</h3></div>{items.some(item=>item.id===draft.id)&&<button className="admin-danger" type="button" onClick={remove}>{t(lang,'adminDelete')}</button>}</div>
      <div className="admin-fields two-columns">
        <label>{t(lang,'adminNameRu')}<input className="admin-input" required maxLength={100} value={draft.name||''} onChange={e=>change('name',e.target.value)}/></label>
        <label>{t(lang,'adminNameKk')}<input className="admin-input" required maxLength={100} value={draft.nameKk||''} onChange={e=>change('nameKk',e.target.value)}/></label>
        <label>{t(lang,'adminDescRu')}<textarea className="admin-input" required maxLength={280} value={draft.desc||''} onChange={e=>change('desc',e.target.value)}/></label>
        <label>{t(lang,'adminDescKk')}<textarea className="admin-input" required maxLength={280} value={draft.descKk||''} onChange={e=>change('descKk',e.target.value)}/></label>
        <label>{t(lang,'adminPrice')}<input className="admin-input" type="number" min="0" step="1" required value={draft.price} onChange={e=>change('price',Number(e.target.value))}/></label>
        <label>{t(lang,'adminCalories')}<input className="admin-input" type="number" min="0" step="1" required value={draft.calories||0} onChange={e=>change('calories',Number(e.target.value))}/></label>
        <label>{t(lang,'adminCategory')}<select className="admin-input" value={draft.category} onChange={e=>change('category',e.target.value)}>{menuSections.map(section=><option value={section.category} key={section.id}>{section.title}</option>)}</select></label>
        <label>{t(lang,'adminImage')}<select className="admin-input" required value={draft.image} onChange={e=>change('image',e.target.value)}>{[...new Set(items.map(item=>item.image).filter(Boolean))].map(image=><option value={image} key={image}>{image.split('/').pop()}</option>)}</select></label>
        <label className="admin-check"><input type="checkbox" checked={draft.available!==false} onChange={e=>change('available',e.target.checked)}/><span>{t(lang,'adminAvailable')}</span></label>
      </div>
      <div className="admin-form-actions"><button className="btn btn-primary" disabled={saving} type="submit">{saving?'…':t(lang,'adminSave')}</button></div>
    </form>:<p className="admin-empty">{t(lang,'adminSelectDish')}</p>}
  </div>;
}

function PromotionEditor({ lang, promotions, onSave, onDelete, onMessage }) {
  const [draft,setDraft]=useState(null);
  const [saving,setSaving]=useState(false);
  const beginNew=()=>setDraft(makeEmptyOffer());
  const change=(key,value)=>setDraft(current=>({...current,[key]:value}));
  const submit=async event=>{event.preventDefault();setSaving(true);try{const saved=await onSave(draft);setDraft(null);onMessage(t(lang,'adminSaved'));return saved}catch(error){onMessage(error.message||t(lang,'adminFailed'))}finally{setSaving(false)}};
  const remove=async id=>{if(!window.confirm(t(lang,'adminDelete')))return;try{await onDelete(id);if(draft?.id===id)setDraft(null);onMessage(t(lang,'adminSaved'))}catch(error){onMessage(error.message||t(lang,'adminFailed'))}};
  return <div className="admin-promotions">
    <div className="admin-list-heading"><div><p className="eyebrow">{t(lang,'adminPromotionsTab')}</p><h3>{t(lang,'promotionsTitle')}</h3></div><button className="btn btn-primary" type="button" onClick={beginNew}>＋ {t(lang,'adminAddOffer')}</button></div>
    {promotions.length===0&&!draft&&<p className="admin-empty">{t(lang,'adminNoOffers')}</p>}
    {promotions.map(promo=><article className="admin-promo-row" key={promo.id}><div><b>{promo.title_ru}</b><small>{promo.active?'Активна':'Скрыта'}{promo.valid_until?` · ${t(lang,'promoUntil')} ${localDate(promo.valid_until)}`:''}</small></div><button className="admin-secondary" type="button" onClick={()=>setDraft({...promo})}>{t(lang,'adminSave')}</button><button className="admin-danger" type="button" onClick={()=>remove(promo.id)}>{t(lang,'adminDelete')}</button></article>)}
    {draft&&<form className="admin-form admin-offer-form" onSubmit={submit}><div className="admin-form-title"><h3>{draft.id?draft.title_ru:t(lang,'adminAddOffer')}</h3><button type="button" className="admin-secondary" onClick={()=>setDraft(null)}>{t(lang,'cancel')}</button></div>
      <div className="admin-fields two-columns">
        <label>{t(lang,'adminOfferTitleRu')}<input className="admin-input" value={draft.title_ru} onChange={e=>change('title_ru',e.target.value)} required maxLength={100}/></label>
        <label>{t(lang,'adminOfferTitleKk')}<input className="admin-input" value={draft.title_kk} onChange={e=>change('title_kk',e.target.value)} required maxLength={100}/></label>
        <label>{t(lang,'adminOfferDescRu')}<textarea className="admin-input" value={draft.description_ru} onChange={e=>change('description_ru',e.target.value)} required maxLength={280}/></label>
        <label>{t(lang,'adminOfferDescKk')}<textarea className="admin-input" value={draft.description_kk} onChange={e=>change('description_kk',e.target.value)} required maxLength={280}/></label>
        <label>{t(lang,'adminOfferTermsRu')}<textarea className="admin-input" value={draft.terms_ru} onChange={e=>change('terms_ru',e.target.value)} required maxLength={500}/></label>
        <label>{t(lang,'adminOfferTermsKk')}<textarea className="admin-input" value={draft.terms_kk} onChange={e=>change('terms_kk',e.target.value)} required maxLength={500}/></label>
        <label>{t(lang,'adminValidFrom')}<input className="admin-input" type="date" value={draft.valid_from||''} onChange={e=>change('valid_from',e.target.value||null)}/></label>
        <label>{t(lang,'adminValidUntil')}<input className="admin-input" type="date" value={draft.valid_until||''} onChange={e=>change('valid_until',e.target.value||null)}/></label>
        <label className="admin-check"><input type="checkbox" checked={draft.active!==false} onChange={e=>change('active',e.target.checked)}/><span>{t(lang,'adminOfferActive')}</span></label>
      </div><div className="admin-form-actions"><button className="btn btn-primary" disabled={saving} type="submit">{saving?'…':t(lang,'adminSave')}</button></div>
    </form>}
  </div>;
}

function ReviewModeration({ lang, reviews, onStatus, onDelete }) {
  const [savingId,setSavingId]=useState('');
  const statusKey={pending:'adminReviewStatusPending',approved:'adminReviewStatusApproved',rejected:'adminReviewStatusRejected'};
  return <div className="admin-reviews"><div className="admin-list-heading"><div><p className="eyebrow">{t(lang,'adminReviewsTab')}</p><h3>{t(lang,'reviewModeration')}</h3></div><span className="admin-count">{reviews.filter(review=>review.status==='pending').length}</span></div>
    {reviews.length===0&&<p className="admin-empty">{t(lang,'adminNoReviews')}</p>}
    {reviews.map(review=><article className="admin-review-row" key={review.id}><div className="admin-review-meta"><b>{review.author}</b><span>{'★'.repeat(review.rating)}{'☆'.repeat(5-review.rating)}</span><small>{new Date(review.created_at).toLocaleDateString()} · {t(lang,statusKey[review.status]||statusKey.pending)}</small></div><p>{review.body}</p><div className="admin-row-actions"><button disabled={savingId===review.id} className="admin-secondary" onClick={async()=>{setSavingId(review.id);await onStatus(review,review.status==='approved'?'rejected':'approved');setSavingId('')}}>{review.status==='approved'?t(lang,'adminReject'):t(lang,'adminApprove')}</button><button disabled={savingId===review.id} className="admin-danger" onClick={async()=>{setSavingId(review.id);await onDelete(review.id);setSavingId('')}}>{t(lang,'adminDelete')}</button></div></article>)}
  </div>;
}

function OrderManagement({ lang, orders, onStatus, onDelete }) {
  const [savingId,setSavingId]=useState('');
  const statuses=['new','accepted','preparing','ready','delivered','cancelled'];
  const statusLabels={new:'orderStatusNew',accepted:'orderStatusAccepted',preparing:'orderStatusPreparing',ready:'orderStatusReady',delivered:'orderStatusDelivered',cancelled:'orderStatusCancelled'};
  const money=value=>`${new Intl.NumberFormat(lang==='kk'?'kk-KZ':'ru-RU').format(value)} ₸`;
  return <div className="admin-orders"><div className="admin-list-heading"><div><p className="eyebrow">{t(lang,'adminOrdersTab')}</p><h3>{t(lang,'adminOrdersTab')}</h3></div><span className="admin-count">{orders.filter(order=>order.status==='new').length}</span></div>
    {!orders.length&&<p className="admin-empty">{t(lang,'orderNoOrders')}</p>}
    {orders.map(order=><article className="admin-order-card" key={order.id}>
      <div className="admin-order-head"><div><p className="eyebrow">{t(lang,'orderCode')}</p><h4>{order.order_code}</h4><small>{t(lang,'orderCreated')}: {new Date(order.created_at).toLocaleString(lang==='kk'?'kk-KZ':'ru-RU')}</small></div><select className="admin-input order-status" aria-label={t(lang,'orderStatus')} value={order.status} disabled={savingId===order.id||(['freedompay','mock'].includes(order.payment_provider)&&order.payment_status!=='paid')} onChange={async event=>{setSavingId(order.id);await onStatus(order,event.target.value);setSavingId('')}}>{statuses.map(status=><option key={status} value={status}>{t(lang,statusLabels[status])}</option>)}</select></div>
      <p className={`order-payment-status payment-${order.payment_status||'unpaid'}`}>{t(lang,'paymentStatus')}: <b>{t(lang,`paymentStatus_${order.payment_status||'unpaid'}`)}</b></p>
      <div className="admin-order-details"><div><b>{t(lang,'orderCustomer')}</b><p>{order.customer_name}<br/><a href={`tel:${order.customer_phone.replace(/[^\d+]/g,'')}`}>{order.customer_phone}</a></p></div><div><b>{t(lang,'orderAddress')}</b><p>{order.delivery_address}</p></div></div>
      <div className="admin-order-items"><b>{t(lang,'orderItems')}</b>{order.items.map((item,index)=><p key={`${item.id}-${index}`}><span>{lang==='kk'?(item.name_kk||item.name_ru):item.name_ru} × {item.qty}</span><strong>{money(item.line_total)}</strong>{item.addons?.length>0&&<small>{item.addons.join(' · ')}</small>}{item.note&&<small>{item.note}</small>}</p>)}</div>
      {order.customer_comment&&<p className="admin-order-comment"><b>{t(lang,'orderComment')}</b> {order.customer_comment}</p>}
      <div className="admin-order-total"><b>{t(lang,'orderTotal')}</b><strong>{money(order.total)}</strong><button className="admin-danger" disabled={savingId===order.id} onClick={async()=>{if(window.confirm(t(lang,'adminDelete'))){setSavingId(order.id);await onDelete(order.id);setSavingId('')}}}>{t(lang,'adminDelete')}</button></div>
    </article>)}
  </div>;
}

export default function AdminPage({ lang, menuItems, setMenuItems, promotions, setPromotions, reviews, setReviews, orders, setOrders }) {
  const [authenticated,setAuthenticated]=useState(demoMode);
  const [authChecked,setAuthChecked]=useState(demoMode);
  const [activeTab,setActiveTab]=useState('menu');
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [adminReviews,setAdminReviews]=useState(reviews);
  useEffect(()=>{
    if(!backendConfigured)return;
    let cancelled=false;
    verifyStaff().then(async allowed=>{
      if(cancelled)return;
      if(!allowed){setAuthChecked(true);return}
      setAuthenticated(true);
      const [menuRows,promoRows,reviewRows,orderRows]=await Promise.all([fetchMenu(),fetchPromotions(true),fetchReviews(true),fetchOrders()]);
      if(cancelled)return;
      const remoteMenu=menuRows.map(row=>({...row.product,available:row.available}));
      if(remoteMenu.length)setMenuItems(remoteMenu);
      setPromotions(promoRows);setAdminReviews(reviewRows);setReviews(reviewRows);setOrders(orderRows);
      setAuthChecked(true);
    }).catch(err=>{if(!cancelled){setError(err.message);setAuthChecked(true)}});
    return()=>{cancelled=true};
  },[]);
  useEffect(()=>{
    if(!backendConfigured||!authenticated||activeTab!=='orders')return;
    const refresh=()=>fetchOrders().then(setOrders).catch(err=>console.error('Orders could not be refreshed:',err));
    const timer=window.setInterval(refresh,12000);
    return()=>window.clearInterval(timer);
  },[activeTab,authenticated]);
  const notify=message=>{setNotice(message);window.setTimeout(()=>setNotice(''),2600)};
  const handleLogin=async(email,password)=>{
    setError('');
    try{await signIn(email,password);const allowed=await verifyStaff();if(!allowed){await signOut();throw new Error('У этой учётной записи нет доступа к панели сотрудников.')}
      setAuthenticated(true);setAuthChecked(false);
      const [menuRows,promoRows,reviewRows,orderRows]=await Promise.all([fetchMenu(),fetchPromotions(true),fetchReviews(true),fetchOrders()]);
      const remoteMenu=menuRows.map(row=>({...row.product,available:row.available}));
      if(remoteMenu.length)setMenuItems(remoteMenu);
      setPromotions(promoRows);setAdminReviews(reviewRows);setReviews(reviewRows);setOrders(orderRows);setAuthChecked(true);
    }catch(err){setAuthenticated(false);setAuthChecked(true);setError(err.message||t(lang,'adminFailed'))}
  };
  const persistMenu=async item=>{
    const {available=true,...product}=item;
    if(backendConfigured)await saveMenuItem({id:item.id,product,available});
    const next=menuItems.some(entry=>entry.id===item.id)?menuItems.map(entry=>entry.id===item.id?{...product,available}:entry):[...menuItems,{...product,available}];
    setMenuItems(next);
  };
  const removeMenuItem=async id=>{
    if(backendConfigured)await deleteMenuItem(id);
    setMenuItems(menuItems.filter(item=>item.id!==id));
  };
  const persistPromotion=async promo=>{
    const result=backendConfigured?await savePromotion(promo):null;
    const saved=Array.isArray(result)&&result[0]?result[0]:{...promo,id:promo.id||`offer-${Date.now()}`,created_at:new Date().toISOString()};
    setPromotions(current=>current.some(item=>item.id===saved.id)?current.map(item=>item.id===saved.id?saved:item):[saved,...current]);
  };
  const removePromo=async id=>{if(backendConfigured)await deletePromotion(id);setPromotions(current=>current.filter(item=>item.id!==id))};
  const moderate=async(review,status)=>{
    try{
      if(backendConfigured)await setReviewStatus(review.id,status);
      const next=adminReviews.map(item=>item.id===review.id?{...item,status}:item);
      setAdminReviews(next);setReviews(next);notify(t(lang,'adminSaved'));
    }catch(err){notify(err.message||t(lang,'adminFailed'))}
  };
  const removeReview=async id=>{
    try{
      if(backendConfigured)await deleteReview(id);
      const next=adminReviews.filter(item=>item.id!==id);setAdminReviews(next);setReviews(next);notify(t(lang,'adminSaved'));
    }catch(err){notify(err.message||t(lang,'adminFailed'))}
  };
  const changeOrderStatus=async(order,status)=>{
    try{
      if(backendConfigured)await updateOrderStatus(order.id,status);
      setOrders(current=>current.map(item=>item.id===order.id?{...item,status}:item));notify(t(lang,'adminSaved'));
    }catch(err){notify(err.message||t(lang,'adminFailed'))}
  };
  const removeOrder=async id=>{
    try{
      if(backendConfigured)await deleteOrder(id);
      setOrders(current=>current.filter(item=>item.id!==id));notify(t(lang,'adminSaved'));
    }catch(err){notify(err.message||t(lang,'adminFailed'))}
  };
  const logout=async()=>{await signOut();setAuthenticated(false);setAuthChecked(true);onSignOut?.()};
  return <main className="admin-page">
    <section className="admin-page-head"><div><p className="eyebrow"><i/>{t(lang,'adminTitle')}</p><h1>{t(lang,'adminTitle')}</h1></div>{authenticated&&!demoMode&&<button className="admin-secondary" onClick={logout}>{t(lang,'adminSignOut')}</button>}</section>
    {demoMode&&<DemoNotice lang={lang}/>}
    {!demoMode&&!authenticated&&authChecked?<Login lang={lang} onLogin={handleLogin} error={error}/>:!authChecked?<p className="admin-empty">Загрузка…</p>:authenticated&&<>
      <div className="admin-tabs" role="tablist"><button className={activeTab==='menu'?'active':''} onClick={()=>setActiveTab('menu')}>{t(lang,'adminMenuTab')}</button><button className={activeTab==='promotions'?'active':''} onClick={()=>setActiveTab('promotions')}>{t(lang,'adminPromotionsTab')}</button><button className={activeTab==='reviews'?'active':''} onClick={()=>setActiveTab('reviews')}>{t(lang,'adminReviewsTab')}</button><button className={activeTab==='orders'?'active':''} onClick={()=>setActiveTab('orders')}>{t(lang,'adminOrdersTab')}</button></div>
      <section className="admin-workspace">
        {activeTab==='menu'&&<MenuEditor lang={lang} items={menuItems} onSave={persistMenu} onDelete={removeMenuItem} onMessage={notify}/>}
        {activeTab==='promotions'&&<PromotionEditor lang={lang} promotions={promotions} onSave={persistPromotion} onDelete={removePromo} onMessage={notify}/>}
        {activeTab==='reviews'&&<ReviewModeration lang={lang} reviews={adminReviews} onStatus={moderate} onDelete={removeReview}/>}
        {activeTab==='orders'&&<OrderManagement lang={lang} orders={orders} onStatus={changeOrderStatus} onDelete={removeOrder}/>}
      </section>
    </>}
    {notice&&<div className="admin-toast" role="status">{notice}</div>}
  </main>;
}
