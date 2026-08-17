import { useEffect, useRef, useState } from 'react';
import * as Icon from '../../icons';
import { currencyOptions, localeOptions, useI18n, type Currency, type Locale } from '../../i18n';

export function LocaleMenu(){
  const {locale,setLocale,currency,setCurrency}=useI18n();
  const [open,setOpen]=useState(false);
  const rootRef=useRef<HTMLDivElement>(null);
  const current=localeOptions.find(option=>option.locale===locale)??localeOptions[0];
  useEffect(()=>{
    if(!open)return;
    const close=(event:PointerEvent)=>{if(!rootRef.current?.contains(event.target as Node))setOpen(false)};
    const escape=(event:KeyboardEvent)=>{if(event.key==='Escape')setOpen(false)};
    document.addEventListener('pointerdown',close);document.addEventListener('keydown',escape);
    return()=>{document.removeEventListener('pointerdown',close);document.removeEventListener('keydown',escape)};
  },[open]);
  const chooseLocale=(next:Locale)=>{setLocale(next);setOpen(false)};
  const chooseCurrency=(next:Currency)=>{setCurrency(next);setOpen(false)};
  return <div className="locale-menu" ref={rootRef}>
    <button key={`trigger-${locale}-${currency}`} className="locale-trigger" type="button" aria-label="Language & region" aria-haspopup="dialog" aria-expanded={open} onClick={()=>setOpen(value=>!value)}>
      <Icon.GlobeHemisphereWest/><span>{current.short}</span><em>{currency}</em><Icon.CaretDown/>
    </button>
    {open&&<div key={locale} className="locale-popover" role="dialog" aria-label="Language & region">
      <header><span><Icon.GlobeHemisphereWest/></span><div><b>Language & region</b><small>Manual selection</small></div></header>
      <div className="locale-section-label">Language</div>
      <div className="locale-list" role="listbox" aria-label="Language">
        {localeOptions.map(option=><button type="button" role="option" aria-selected={locale===option.locale} className={locale===option.locale?'active':''} key={option.locale} onClick={()=>chooseLocale(option.locale)}><span>{option.short}</span><b>{option.label}</b><small>{option.currency}</small>{locale===option.locale&&<Icon.CheckCircle variant="Bold"/>}</button>)}
      </div>
      <div className="currency-heading"><span>Currency</span><small>Detected from your region</small></div>
      <div className="currency-list" aria-label="Currency">
        {currencyOptions.map(option=><button type="button" className={currency===option?'active':''} aria-pressed={currency===option} key={option} onClick={()=>chooseCurrency(option)}>{option}</button>)}
      </div>
    </div>}
  </div>;
}
