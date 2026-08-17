import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import * as Icon from '../../icons';
import { BrandLogo } from './brand-logo';

export type AuthMode='login'|'signup'|'forgot-password';

const images=[
  '/auth/livefy-auth-summer.png?v=1',
  '/auth/livefy-auth-eyewear.png?v=1',
  '/auth/livefy-auth-crowd.png?v=1',
  '/auth/livefy-auth-duck.png?v=1',
];

const prompts=[
  'Build a cinematic product stage with warm summer light, precise camera movement, and natural color.',
  'Create a premium commerce portrait with clean negative space, tactile detail, and studio lighting.',
  'Direct a fast-paced live sequence through a brutalist set with controlled motion and sharp contrast.',
  'Design a retro campaign frame with strong character, editorial composition, and memorable product focus.',
];

const modeCopy:Record<AuthMode,{title:string;submit:string}>={
  login:{title:'Welcome back',submit:'Sign in'},
  signup:{title:'Create an account',submit:'Create account'},
  'forgot-password':{title:'Recover your account',submit:'Send recovery link'},
};

export default function AuthSectionTwo({mode}:{mode:AuthMode}){
  const [activeIndex,setActiveIndex]=useState(0);
  useEffect(()=>{const interval=window.setInterval(()=>setActiveIndex(current=>(current+1)%images.length),2600);return()=>window.clearInterval(interval)},[]);
  return <main className="auth2-shell">
    <div className="auth2-grid">
      <section className="auth2-showcase" aria-label="Livefy creative workspace">
        <div className="auth2-showcase-inner">
          <BrandLogo contrast="on-dark" className="auth2-brand-logo"/>
          <div className="auth2-gallery">
            <div className="auth2-fade auth2-fade-top"/><div className="auth2-fade auth2-fade-bottom"/>
            <ImageTile src={images[0]} active={activeIndex===0} className="auth2-tile-main"/>
            <ImageTile src={images[1]} active={activeIndex===1} className="auth2-tile-small"/>
            <ImageTile src={images[3]} active={activeIndex===3} className="auth2-tile-small"/>
            <ImageTile src={images[2]} active={activeIndex===2} className="auth2-tile-wide"/>
          </div>
          <div className="auth2-prompt"><p><b>/live</b> {prompts[activeIndex]}</p><button type="button" aria-label="Use current creative direction"><Icon.ArrowRight/></button></div>
          <p className="auth2-statement">A live workspace for creators and commerce teams</p>
          <div className="auth2-pagination">{prompts.map((_,index)=><button key={index} type="button" className={activeIndex===index?'active':''} onClick={()=>setActiveIndex(index)} aria-label={`Show prompt ${index+1}`}/>)}</div>
        </div>
      </section>
      <section className="auth2-form-side"><AuthForm mode={mode}/></section>
    </div>
  </main>;
}

function ImageTile({src,active,className}:{src:string;active:boolean;className:string}){
  return <div className={`auth2-tile ${className} ${active?'active':''}`}><img src={src} alt="Live commerce creative reference"/><FocusCorners active={active}/></div>;
}

function FocusCorners({active}:{active:boolean}){return <div className={`auth2-focus ${active?'active':''}`} aria-hidden="true"><i/><i/><i/><i/></div>}

function AuthForm({mode}:{mode:AuthMode}){
  const [loading,setLoading]=useState(false);
  const [message,setMessage]=useState('');
  const timerRef=useRef<number|undefined>(undefined);
  useEffect(()=>{setLoading(false);setMessage('');return()=>clearTimeout(timerRef.current)},[mode]);
  const submit=(event:FormEvent<HTMLFormElement>)=>{event.preventDefault();setLoading(true);timerRef.current=window.setTimeout(()=>{setLoading(false);if(mode==='login'){location.hash='overview';return}setMessage(mode==='signup'?'Your account is ready. You can sign in now.':'Check your inbox for the password recovery link.')},650)};
  if(message)return <div className="auth2-form auth2-complete"><span><Icon.CheckCircle variant="Bold"/></span><h1>{mode==='signup'?'Account created':'Recovery email sent'}</h1><p>{message}</p><a href="#login">Back to sign in</a></div>;
  return <div className="auth2-form">
    <h1>{modeCopy[mode].title}</h1>
    {mode!=='forgot-password'&&<div className="auth2-social"><button type="button"><Icon.Google/> {mode==='signup'?'Sign up with Google':'Continue with Google'}</button><button type="button"><Icon.Apple/> {mode==='signup'?'Sign up with Apple':'Continue with Apple'}</button></div>}
    {mode!=='forgot-password'&&<div className="auth2-or"><i/>or<i/></div>}
    <form onSubmit={submit}>
      {mode==='signup'&&<div className="auth2-name-grid"><FieldBox label="First name" value="Marina" type="text"/><FieldBox label="Last name" value="Tavares" type="text"/></div>}
      <FieldBox label="Email" value="marina@studio.com" type="email"/>
      {mode!=='forgot-password'&&<FieldBox label="Password" value="livefy-studio" type="password"/>}
      {mode==='login'&&<div className="auth2-form-links"><CheckboxLine>Remember me</CheckboxLine><a href="#forgot-password">Forgot password?</a></div>}
      {mode==='signup'&&<div className="auth2-checks"><CheckboxLine>I don't want to receive emails about Livefy feature updates</CheckboxLine><CheckboxLine>By creating an account, you agree to our <a href="#terms">Terms and Services</a> and <a href="#privacy">Privacy Policy</a></CheckboxLine></div>}
      {mode==='forgot-password'&&<p className="auth2-helper">We will send a secure recovery link to this email address.</p>}
      <button className="auth2-submit" type="submit" disabled={loading}>{loading?'Please wait...':modeCopy[mode].submit}</button>
    </form>
    <div className="auth2-switch">{mode==='login'?<>New to Livefy? <a href="#signup">Create an account</a></>:mode==='signup'?<>Already have an account? <a href="#login">Sign in</a></>:<a href="#login">Back to sign in</a>}</div>
  </div>;
}

function FieldBox({label,value,type}:{label:string;value:string;type:string}){
  const [inputValue,setInputValue]=useState(value);const [editing,setEditing]=useState(false);
  return <label className="auth2-field"><input type={type} value={inputValue} aria-label={label} autoComplete={type==='password'?'current-password':type==='email'?'email':undefined} onFocus={()=>{if(!editing){setInputValue('');setEditing(true)}}} onChange={event=>{setInputValue(event.target.value);setEditing(true)}} required/><span className={editing?'hidden':''}>{label}</span></label>;
}

function CheckboxLine({children}:{children:ReactNode}){return <label className="auth2-checkbox"><input type="checkbox"/><span className="auth2-checkmark"><Icon.TickSquare variant="Bold"/></span><span>{children}</span></label>}
