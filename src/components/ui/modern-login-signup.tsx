import { useEffect, useRef, useState, type FormEvent } from 'react';
import * as THREE from 'three';
import * as Icon from '../../icons';

export type AuthMode='login'|'signup'|'forgot-password';

const copy:Record<AuthMode,{eyebrow:string;title:string;description:string;submit:string}>={
  login:{eyebrow:'Secure access',title:'Sign in to Account',description:'Sign in to your Account.',submit:'Continue with Email'},
  signup:{eyebrow:'Create workspace',title:'Sign up for Account',description:'Create a new account to get started.',submit:'Sign up with Email'},
  'forgot-password':{eyebrow:'Account recovery',title:'Reset your password',description:'Enter your email and we will send you a secure recovery link.',submit:'Send recovery link'},
};

function DotField(){
  const canvasRef=useRef<HTMLCanvasElement>(null);
  useEffect(()=>{
    const canvas=canvasRef.current;
    if(!canvas)return;
    const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:false});
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
    const scene=new THREE.Scene();
    const camera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
    const geometry=new THREE.PlaneGeometry(2,2);
    const uniforms={
      u_time:{value:0},
      u_resolution:{value:new THREE.Vector2(innerWidth*2,innerHeight*2)},
      u_opacities:{value:[.3,.3,.3,.5,.5,.5,.8,.8,.8,1]},
      u_colors:{value:Array.from({length:6},()=>new THREE.Vector3(1,1,1))},
      u_total_size:{value:20},u_dot_size:{value:6},u_reverse:{value:0},
    };
    const material=new THREE.ShaderMaterial({
      vertexShader:`precision mediump float;uniform vec2 u_resolution;out vec2 fragCoord;void main(){gl_Position=vec4(position,1.0);fragCoord=(position.xy+1.0)*0.5*u_resolution;fragCoord.y=u_resolution.y-fragCoord.y;}`,
      fragmentShader:`precision mediump float;in vec2 fragCoord;uniform float u_time;uniform float u_opacities[10];uniform vec3 u_colors[6];uniform float u_total_size;uniform float u_dot_size;uniform vec2 u_resolution;uniform int u_reverse;out vec4 fragColor;float PHI=1.61803398874989484820459;float random(vec2 xy){return fract(tan(distance(xy*PHI,xy)*0.5)*xy.x);}void main(){vec2 st=fragCoord.xy;st.x-=abs(floor((mod(u_resolution.x,u_total_size)-u_dot_size)*0.5));st.y-=abs(floor((mod(u_resolution.y,u_total_size)-u_dot_size)*0.5));float opacity=step(0.0,st.x)*step(0.0,st.y);vec2 st2=vec2(int(st.x/u_total_size),int(st.y/u_total_size));float frequency=5.0;float show_offset=random(st2);float rand=random(st2*floor((u_time/frequency)+show_offset+frequency));opacity*=u_opacities[int(rand*10.0)];opacity*=1.0-step(u_dot_size/u_total_size,fract(st.x/u_total_size));opacity*=1.0-step(u_dot_size/u_total_size,fract(st.y/u_total_size));vec3 color=u_colors[int(show_offset*6.0)];float animation_speed_factor=3.0;vec2 center_grid=u_resolution/2.0/u_total_size;float dist_from_center=distance(center_grid,st2);float timing_offset_intro=dist_from_center*0.01+(random(st2)*0.15);float current_timing_offset=timing_offset_intro;opacity*=step(current_timing_offset,u_time*animation_speed_factor);opacity*=clamp((1.0-step(current_timing_offset+0.1,u_time*animation_speed_factor))*1.25,1.0,1.25);fragColor=vec4(color,opacity);fragColor.rgb*=fragColor.a;}`,
      uniforms,glslVersion:THREE.GLSL3,blending:THREE.CustomBlending,blendSrc:THREE.SrcAlphaFactor,blendDst:THREE.OneFactor,transparent:true,
    });
    scene.add(new THREE.Mesh(geometry,material));
    const started=performance.now();
    let animationFrame=0;
    const resize=()=>{renderer.setSize(innerWidth,innerHeight);uniforms.u_resolution.value.set(innerWidth*2,innerHeight*2)};
    const animate=()=>{animationFrame=requestAnimationFrame(animate);uniforms.u_time.value=(performance.now()-started)/1000;renderer.render(scene,camera)};
    resize();animate();addEventListener('resize',resize);
    return()=>{removeEventListener('resize',resize);cancelAnimationFrame(animationFrame);geometry.dispose();material.dispose();renderer.dispose()};
  },[]);
  return <canvas ref={canvasRef} className="auth-dot-field" aria-hidden="true"/>;
}

export default function ModernLoginSignup({mode}:{mode:AuthMode}){
  const [loading,setLoading]=useState(false);
  const [message,setMessage]=useState('');
  const timerRef=useRef<number|undefined>(undefined);
  useEffect(()=>{setLoading(false);setMessage('');return()=>clearTimeout(timerRef.current)},[mode]);
  const content=copy[mode];
  const submit=(event:FormEvent<HTMLFormElement>)=>{
    event.preventDefault();
    setLoading(true);
    timerRef.current=window.setTimeout(()=>{
      setLoading(false);
      if(mode==='login'){location.hash='overview';return}
      setMessage(mode==='signup'?'Your account is ready. You can sign in now.':'Check your inbox for the password recovery link.');
    },650);
  };
  return <main className="auth-shell">
    <DotField/>
    <div className="auth-vignette" aria-hidden="true"/>
    <section className="auth-panel" aria-labelledby="auth-title">
      <div className="auth-panel-head"><span className="auth-logo">LF</span><span className="auth-eyebrow">{content.eyebrow}</span><h1 id="auth-title">{content.title}</h1><p>{content.description}</p></div>
      {message?<div className="auth-success"><Icon.CheckCircle variant="Bold"/><h2>{mode==='signup'?'Account created':'Recovery email sent'}</h2><p>{message}</p><a className="auth-primary-link" href="#login">Back to sign in</a></div>:<>
        <form className="auth-form" onSubmit={submit}>
          {mode==='signup'&&<label className="auth-field"><span>Full name</span><input name="name" type="text" autoComplete="name" placeholder="Full name" required/></label>}
          <label className="auth-field"><span>Work email</span><input name="email" type="email" autoComplete="email" placeholder="name@work-email.com" required/></label>
          <button className="auth-submit" type="submit" disabled={loading}>{loading?'Please wait...':content.submit}<Icon.CaretRight/></button>
        </form>
        {mode!=='forgot-password'&&<><div className="auth-divider"/><div className="auth-social"><button type="button"><Icon.Google/>Continue with Google</button><button type="button"><Icon.CodeRepository/>Continue with GitHub</button><button type="button"><Icon.Apple/>Continue with Apple</button></div></>}
        <div className="auth-switch">{mode==='login'?<>New to Livefy? <a href="#signup">Create an account</a></>:mode==='signup'?<>Already have an account? <a href="#login">Sign in</a></>:<a href="#login">Back to sign in</a>}</div>
        {mode==='login'&&<a className="auth-recovery-link" href="#forgot-password">Forgot password?</a>}
      </>}
      <p className="auth-legal">By continuing, you agree to our <a href="#terms">Terms of Service</a> and <a href="#privacy">Privacy Policy</a>.</p>
    </section>
  </main>;
}
