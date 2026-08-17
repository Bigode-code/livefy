type BrandLogoProps={
  contrast?:'auto'|'on-light'|'on-dark';
  className?:string;
};

export function BrandLogo({contrast='auto',className=''}:BrandLogoProps){
  return <div className={`brand-logo brand-logo-${contrast} ${className}`.trim()} role="img" aria-label="Livefy">
    <img className="brand-logo-black" src="/brand/livefy-black.svg" alt="" aria-hidden="true"/>
    <img className="brand-logo-white" src="/brand/livefy-white.svg" alt="" aria-hidden="true"/>
  </div>;
}
