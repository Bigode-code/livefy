import * as Icon from '../../icons';
import { Button, PageHeader, Section, Status } from '../../components';

const usage=[['Live production','12 h','40 h',30],['AI generation','0','—',0],['Workspace members','1','3',33]] as const;
export default function Subscription(){return <div className="page subscription-page">
  <PageHeader eyebrow="Account" title="Subscription" description="Manage your workspace access, usage and future billing preferences." actions={<Button kind="primary" disabled>Change plan</Button>}/>
  <section className="subscription-current"><div><span className="subscription-mark"><Icon.CreditCard/></span><div><small>Current access</small><h2>Early workspace</h2><p>Plan names and pricing will be configured later.</p></div></div><Status label="Active" tone="online"/></section>
  <Section title="Current usage" meta={<span className="usage-period">August 1–31</span>}><div className="usage-list">{usage.map(([label,value,limit,percent])=><div key={label}><div><b>{label}</b><span>{value} <small>of {limit}</small></span></div><i><span style={{width:`${percent}%`}}/></i></div>)}</div></Section>
  <div className="subscription-grid"><Section title="Billing details"><div className="billing-empty"><Icon.CreditCard/><div><b>No payment method required</b><p>Billing details can be added when plans are published.</p></div><Button disabled>Add payment method</Button></div></Section><Section title="Plan management"><div className="plan-placeholder"><Icon.Layers/><div><b>Plans coming soon</b><p>This area is ready for tiers, limits and regional pricing.</p></div></div></Section></div>
 </div>}
