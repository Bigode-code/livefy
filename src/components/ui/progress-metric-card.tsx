import { useId, useMemo, useState, type PointerEvent } from 'react';
import * as Icon from '../../icons';
import { useI18n } from '../../i18n';

export type SeriesPoint={value:number;date:string};
export type ChartView='curve'|'bars';
export type PeriodOption={label:string;points?:number};

type ProgressMetricCardProps={
  title:string;
  total?:string|number;
  unit?:string;
  deltaLabel?:string;
  data:SeriesPoint[];
  period?:string;
  periodOptions?:PeriodOption[];
  defaultView?:ChartView;
  loading?:boolean;
};

const defaultPeriods:PeriodOption[]=[{label:'Past 7 days',points:7},{label:'Past 14 days',points:14},{label:'Past 30 days'}];
const compact=(value:number)=>Intl.NumberFormat('en',{notation:'compact',maximumFractionDigits:1}).format(value);

export default function ProgressMetricCard({title,total,unit,deltaLabel='today',data,period,periodOptions=defaultPeriods,defaultView='curve',loading=false}:ProgressMetricCardProps){
  const {t}=useI18n();
  const patternId=`metric-grid-${useId().replace(/:/g,'')}`;
  const [selectedPeriod,setSelectedPeriod]=useState(period??periodOptions.at(-1)?.label??'Past 30 days');
  const [view,setView]=useState<ChartView>(defaultView);
  const [activeIndex,setActiveIndex]=useState<number|null>(null);
  const option=periodOptions.find(item=>item.label===selectedPeriod)??periodOptions.at(-1);
  const visible=useMemo(()=>option?.points?data.slice(-option.points):data,[data,option]);
  const values=visible.map(point=>point.value);
  const min=Math.min(...values);
  const max=Math.max(...values);
  const range=Math.max(max-min,1);
  const width=520;
  const height=154;
  const pointAt=(value:number,index:number)=>({x:12+(index/Math.max(visible.length-1,1))*(width-24),y:12+(1-(value-min)/range)*(height-28)});
  const points=visible.map((point,index)=>({...point,...pointAt(point.value,index)}));
  const line=points.map((point,index)=>`${index?'L':'M'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(' ');
  const area=points.length?`${line} L ${points.at(-1)!.x} ${height} L ${points[0].x} ${height} Z`:'';
  const first=values[0]??0;
  const last=values.at(-1)??0;
  const previous=values.at(-2)??first;
  const percent=first?((last-first)/first)*100:0;
  const selected=points[activeIndex??Math.max(points.length-1,0)];
  const stats={peak:values.length?Math.max(...values):0,low:values.length?Math.min(...values):0,avg:values.length?values.reduce((sum,value)=>sum+value,0)/values.length:0};

  const handlePointer=(event:PointerEvent<SVGSVGElement>)=>{
    const bounds=event.currentTarget.getBoundingClientRect();
    const ratio=Math.max(0,Math.min(1,(event.clientX-bounds.left)/bounds.width));
    setActiveIndex(Math.round(ratio*Math.max(points.length-1,0)));
  };

  if(loading)return <div className="progress-metric-card metric-loading" aria-busy="true"><i/><i/><i/></div>;
  if(visible.length<2)return <div className="progress-metric-card metric-empty"><h3>{t(title)}</h3><div><b>{t('No data yet')}</b><p>{t('Metrics will appear once data is available.')}</p></div></div>;

  return <div className="progress-metric-card">
    <div className="metric-card-head"><div><span>{t('Performance')}</span><h3>{t(title)}</h3></div><div className="metric-card-controls"><div className="chart-view-toggle" aria-label={t('Chart view')}><button aria-label={t('Curve view')} className={view==='curve'?'active':''} onClick={()=>setView('curve')}><Icon.ChartLineUp/></button><button aria-label={t('Bar view')} className={view==='bars'?'active':''} onClick={()=>setView('bars')}><Icon.ChartBars/></button></div><label><span className="sr-only">{t('Period')}</span><select aria-label={t('Period')} value={selectedPeriod} onChange={event=>setSelectedPeriod(event.target.value)}>{periodOptions.map(item=><option value={item.label} key={item.label}>{t(item.label)}</option>)}</select><Icon.CaretDown/></label></div></div>
    <div className="metric-card-body"><div className="metric-headline"><strong>{total??compact(values.reduce((sum,value)=>sum+value,0))}</strong><span className={percent>=0?'positive':'negative'}><Icon.ChartLineUp/>{percent>=0?'+':''}{percent.toFixed(1)}%</span><small>{last-previous>=0?'+':''}{compact(last-previous)} <span>{t(deltaLabel)}</span></small></div><div className="metric-chart-wrap"><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${t(title)} — ${t('trend')}`} onPointerMove={handlePointer} onPointerLeave={()=>setActiveIndex(null)}><defs><pattern id={patternId} width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="currentColor"/></pattern><linearGradient id={`${patternId}-area`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="currentColor" stopOpacity=".2"/><stop offset="1" stopColor="currentColor" stopOpacity="0"/></linearGradient></defs><rect width="100%" height="100%" fill={`url(#${patternId})`} className="metric-grid-pattern"/>{view==='curve'?<><path d={area} fill={`url(#${patternId}-area)`}/><path d={line} className="metric-line"/></>:points.map((point,index)=>{const barWidth=Math.max(5,(width-34)/points.length-5);return <rect key={point.date} x={point.x-barWidth/2} y={point.y} width={barWidth} height={height-point.y} rx="3" className={index===(activeIndex??points.length-1)?'metric-bar active':'metric-bar'}/>})}{selected&&<><line x1={selected.x} y1="8" x2={selected.x} y2={height} className="metric-guide"/><circle cx={selected.x} cy={selected.y} r="5" className="metric-point"/></>}</svg>{selected&&<div className="metric-tooltip" style={{left:`${Math.max(12,Math.min(88,(selected.x/width)*100))}%`}}><b>{selected.value.toLocaleString()} {unit?t(unit):''}</b><span>{selected.date}</span></div>}</div></div>
    <div className="metric-card-footer"><span><b>{compact(stats.peak)}</b> {t('peak')}</span><i/><span><b>{compact(stats.low)}</b> {t('low')}</span><i/><span><b>{compact(Math.round(stats.avg))}</b> {t('avg')}</span></div>
  </div>
}
