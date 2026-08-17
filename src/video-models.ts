export type VideoFieldType='text'|'textarea'|'url'|'url-list'|'number'|'select'|'toggle'|'json';

export type VideoField={
  key:string;
  label:string;
  type:VideoFieldType;
  required?:boolean;
  helper?:string;
  placeholder?:string;
  options?:Array<{label:string;value:string|number}>;
  defaultValue?:string|number|boolean;
  min?:number;
  max?:number;
};

export type VideoModel={
  id:string;
  name:string;
  provider:string;
  description:string;
  inputLabel:string;
  fields:VideoField[];
};

const prompt:VideoField={key:'prompt',label:'Prompt',type:'textarea',required:true,placeholder:'Describe the scene, movement, camera and audio.'};
const ratio=(values=['16:9','9:16','1:1']):VideoField=>({key:'aspect_ratio',label:'Aspect ratio',type:'select',defaultValue:values[0],options:values.map(value=>({label:value,value}))});
const duration=(values:number[],fallback=values[0]):VideoField=>({key:'duration',label:'Duration',type:'select',defaultValue:fallback,options:values.map(value=>({label:`${value} seconds`,value}))});
const mode:VideoField={key:'mode',label:'Quality',type:'select',defaultValue:'pro',options:[{label:'Standard · 720p',value:'std'},{label:'Pro · 1080p',value:'pro'}]};
const image=(key='start_image_url',label='Start image URL'):VideoField=>({key,label,type:'url',placeholder:'https://…'});
const images=(key='image_urls',label='Reference image URLs'):VideoField=>({key,label,type:'url-list',helper:'One public URL per line.',placeholder:'https://…'});
const video=(key='video_url',label='Source video URL'):VideoField=>({key,label,type:'url',required:true,placeholder:'https://…'});
const seed:VideoField={key:'seed',label:'Seed',type:'number',helper:'Optional reproducibility seed.'};
const audio:VideoField={key:'native_audio',label:'Generate native audio',type:'toggle',defaultValue:true};
const elements:VideoField={key:'elements',label:'Elements',type:'json',helper:'Optional JSON array of character or object references.',placeholder:'[{"description":"…","type":"image","image_urls":["https://…"]}]'};

const klingBase=[prompt,mode,duration([5,10]),ratio(),image('start_frame_url','Start frame URL'),image('end_frame_url','End frame URL')];
const seedanceBase=[prompt,duration([5,10]),ratio(),image('start_image_url','Start frame URL'),image('end_image_url','End frame URL'),images('reference_image_urls','Omni-reference URLs')];
const wanBase=[prompt,duration([5,10]),ratio(),image(),images(),{key:'audio',label:'Generate audio',type:'toggle',defaultValue:true} as VideoField];

export const videoModels:VideoModel[]=[
  {id:'xai/grok-imagine-video',name:'Grok Imagine Video',provider:'xAI',description:'Text, start frame or multiple visual references with optional generated audio.',inputLabel:'Text · image · references',fields:[prompt,ratio(['1:1','2:3','3:2','9:16','16:9']),{key:'duration',label:'Duration',type:'number',defaultValue:6,min:1,max:30}, {key:'resolution',label:'Resolution',type:'select',defaultValue:'720p',options:['480p','720p','1080p'].map(value=>({label:value,value}))},image(),images(),{key:'audio',label:'Generate audio',type:'toggle',defaultValue:true},{key:'video_preset',label:'Style preset',type:'select',defaultValue:'custom',options:['custom','fun','normal','spicy'].map(value=>({label:value,value}))}]},
  {id:'xai/grok-imagine-1.5-video',name:'Grok Imagine Video 1.5',provider:'xAI',description:'Image-to-video using the quality-focused Grok 1.5 endpoint.',inputLabel:'Prompt · start image',fields:[prompt,image('start_image_url','Start image URL'),ratio(['16:9','9:16','1:1']),duration([6,10]),{key:'resolution',label:'Resolution',type:'select',defaultValue:'720p',options:['480p','720p','1080p'].map(value=>({label:value,value}))}]},
  {id:'xai/grok-imagine-video-extend',name:'Grok Imagine Extend',provider:'xAI',description:'Extend an existing generated video.',inputLabel:'Video · continuation prompt',fields:[video(),prompt]},
  {id:'xai/grok-imagine-upscale',name:'Grok Imagine Upscale',provider:'xAI',description:'Upscale a completed Grok video.',inputLabel:'Video · resolution',fields:[video(),{key:'resolution',label:'Resolution',type:'select',required:true,defaultValue:'1080p',options:['1080p','4k'].map(value=>({label:value,value}))}]},

  ...['fast','fast-relaxed','quality','lite','lite-relaxed'].map((variant):VideoModel=>({id:`google/veo-3.1-${variant}`,name:`Veo 3.1 ${variant.split('-').map(word=>word[0].toUpperCase()+word.slice(1)).join(' ')}`,provider:'Google',description:'Veo generation with mutually exclusive frame or reference modes.',inputLabel:'Prompt · frames or references',fields:[prompt,ratio(['16:9','9:16']),duration([4,6,8],4),seed,image(),image('end_image_url','End image URL'),images('reference_image_urls','Reference image URLs'),{key:'voice',label:'Voice preset ID',type:'text',helper:'Requires reference images; Fast and Lite variants only.'}]})),
  {id:'google/veo-3.1-extend',name:'Veo 3.1 Extend',provider:'Google',description:'Extend a completed Veo task by eight seconds.',inputLabel:'Task ID · prompt',fields:[prompt,{key:'task_id',label:'Source task ID',type:'text',required:true},{key:'model',label:'Source quality',type:'select',required:true,defaultValue:'fast',options:['lite','fast','quality','lite-relaxed','fast-relaxed'].map(value=>({label:value,value}))},{...duration([8],8),required:true},seed]},
  {id:'google/veo-3.1-upscale',name:'Veo 3.1 Upscale',provider:'Google',description:'Upscale a completed Veo task.',inputLabel:'Task ID · resolution',fields:[{key:'task_id',label:'Source task ID',type:'text',required:true},{key:'resolution',label:'Resolution',type:'select',required:true,defaultValue:'1080p',options:['1080p','4k'].map(value=>({label:value,value}))}]},
  {id:'google/gemini-omni-flash-video',name:'Gemini Omni Flash Video',provider:'Google',description:'Multimodal video generation from prompt and media references.',inputLabel:'Prompt · multimodal references',fields:[prompt,ratio(),duration([5,10]),images()]},
  {id:'google/gemini-omni-flash-video-edit',name:'Gemini Omni Flash Video Edit',provider:'Google',description:'Edit an existing video using a natural-language instruction.',inputLabel:'Video · edit prompt',fields:[video(),prompt,images(),ratio()]},

  ...['2.0','2.3','2.3-fast','h3'].map((variant):VideoModel=>({id:`hailuo/minimax-${variant}`,name:`MiniMax Hailuo ${variant.toUpperCase()}`,provider:'MiniMax',description:'Text or image-to-video with optional prompt optimization.',inputLabel:variant==='2.3-fast'?'Start image · prompt':'Prompt or start image',fields:[prompt,{...image(),required:variant==='2.3-fast'},image('end_image_url','End image URL'),duration([6,10],6),{key:'resolution',label:'Resolution',type:'select',defaultValue:'768p',options:['768p','1080p'].map(value=>({label:value,value}))},{key:'prompt_optimization',label:'Optimize prompt',type:'toggle',defaultValue:true}]})),

  {id:'kuaishou/kling-3.0-video',name:'Kling 3.0',provider:'Kling',description:'Text/frame generation with audio, elements and multi-shot sequences.',inputLabel:'Prompt or multi-shot · frames',fields:[...klingBase,audio,elements,{key:'multi_shots',label:'Multi-shot sequence',type:'json',helper:'2–6 shots; do not combine with prompt.',placeholder:'[{"prompt":"Wide shot…","duration":3},{"prompt":"Close-up…","duration":2}]'}]},
  {id:'kuaishou/kling-3.0-turbo-video',name:'Kling 3.0 Turbo',provider:'Kling',description:'Faster Kling 3.0 generation.',inputLabel:'Prompt · frames',fields:[...klingBase,audio,elements]},
  {id:'kuaishou/kling-3.0-omni-video',name:'Kling 3.0 Omni',provider:'Kling',description:'Multimodal video generation with references, elements and native audio.',inputLabel:'Prompt · images · elements',fields:[prompt,mode,duration([5,10]),ratio(),images(),elements,audio]},
  {id:'kuaishou/kling-3.0-omni-video-edit',name:'Kling 3.0 Omni Edit',provider:'Kling',description:'Reference or transform editing of an existing video.',inputLabel:'Video · edit prompt · references',fields:[video(),prompt,{key:'video_mode',label:'Edit mode',type:'select',defaultValue:'reference',options:['reference','transform'].map(value=>({label:value,value}))},{key:'keep_audio',label:'Keep source audio',type:'toggle',defaultValue:false},mode,ratio(),images(),elements]},
  {id:'kuaishou/kling-o1-video',name:'Kling O1 Video',provider:'Kling',description:'Omni-style generation without multi-shot or native audio.',inputLabel:'Prompt · images',fields:[prompt,mode,duration([5,10]),ratio(),images(),elements]},
  {id:'kuaishou/kling-o1-video-edit',name:'Kling O1 Video Edit',provider:'Kling',description:'Edit a video with optional image references.',inputLabel:'Video · edit prompt · images',fields:[video(),prompt,{key:'video_mode',label:'Edit mode',type:'select',defaultValue:'reference',options:['reference','transform'].map(value=>({label:value,value}))},{key:'keep_audio',label:'Keep source audio',type:'toggle',defaultValue:false},mode,ratio(),images()]},
  ...['2.6','2.5-turbo','2.1','2.1-master'].map((variant):VideoModel=>({id:`kuaishou/kling-${variant}-video`,name:`Kling ${variant.replace('-turbo',' Turbo').replace('-master',' Master')}`,provider:'Kling',description:'Kling text and frame-based video generation.',inputLabel:'Prompt · start/end frames',fields:[...klingBase,...(variant==='2.6'?[{key:'voice_id',label:'Voice preset ID',type:'text'} as VideoField]:[])]})),
  ...['2.6','3.0'].map((variant):VideoModel=>({id:`kuaishou/kling-${variant}-motion-control`,name:`Kling Motion Control ${variant}`,provider:'Kling',description:'Transfer motion from a reference video to a character image.',inputLabel:'Character image · motion video',fields:[image('image_url','Character image URL'),video('video_url','Motion reference video URL'),prompt,mode]})),

  {id:'bytedance/seedance-2.5',name:'SeeDance 2.5',provider:'ByteDance',description:'Long-form multimodal generation with native audio and frame workflows.',inputLabel:'Prompt · frames · omni references',fields:[...seedanceBase,{key:'native_audio',label:'Generate native audio',type:'toggle',defaultValue:true}]},
  ...['2.0-fast','2.0-mini','2.0-pro'].map((variant):VideoModel=>({id:`bytedance/seedance-${variant}`,name:`SeeDance ${variant.replaceAll('-',' ')}`,provider:'ByteDance',description:'Omni-reference video generation.',inputLabel:'Prompt · frames · references',fields:seedanceBase})),
  ...['1.5-pro','1.0-pro','1.0','1.0-pro-fast'].map((variant):VideoModel=>({id:`bytedance/seedance-${variant}`,name:`SeeDance ${variant.replaceAll('-',' ')}`,provider:'ByteDance',description:'Text, image and first/last-frame video generation.',inputLabel:'Prompt · first/last frame',fields:[prompt,image(),image('end_image_url','End image URL'),duration([5,10]),ratio()]})),

  ...['happyhorse-1.0-video','happyhorse-1.1-video','wan-2.7-video','wan-2.6-video','wan-2.6-flash-video','wan-2.5-video','wan-2.2-video','wan-2.2-flash-video'].map((slug):VideoModel=>({id:`alibaba/${slug}`,name:slug.split('-').map(word=>word[0].toUpperCase()+word.slice(1)).join(' ').replace(' Video',''),provider:'Alibaba',description:'Text, image or reference-to-video generation.',inputLabel:'Prompt · image · references',fields:wanBase})),
  {id:'alibaba/happyhorse-1.0-video-edit',name:'HappyHorse Video Edit',provider:'Alibaba',description:'Edit a video with optional style references.',inputLabel:'Video · prompt · references',fields:[video(),prompt,images()]},
  {id:'alibaba/wan-2.7-video-edit',name:'Wan 2.7 Video Edit',provider:'Alibaba',description:'Edit or style-transfer an existing video.',inputLabel:'Video · prompt · references',fields:[video(),prompt,images(),{key:'keep_audio',label:'Keep source audio',type:'toggle',defaultValue:true}]},
  {id:'topaz-labs/video-upscale',name:'Topaz Video Upscale',provider:'Topaz Labs',description:'Upscale and enhance an existing video.',inputLabel:'Video · enhancement settings',fields:[video(),{key:'resolution',label:'Target resolution',type:'select',required:true,defaultValue:'4k',options:['1080p','2k','4k'].map(value=>({label:value,value}))},{key:'frame_interpolation',label:'Frame interpolation',type:'toggle',defaultValue:false}]}
];

export const videoProviders=[...new Set(videoModels.map(model=>model.provider))];

export function defaultsFor(model:VideoModel){
  return Object.fromEntries(model.fields.filter(field=>field.defaultValue!==undefined).map(field=>[field.key,field.defaultValue]));
}

export function serializeVideoInput(model:VideoModel,values:Record<string,unknown>){
  const input:Record<string,unknown>={};
  for(const field of model.fields){
    const raw=values[field.key];
    if(raw===''||raw===undefined||raw===null)continue;
    if(field.type==='url-list')input[field.key]=String(raw).split(/\r?\n|,/).map(item=>item.trim()).filter(Boolean);
    else if(field.type==='json'){
      try{input[field.key]=typeof raw==='string'?JSON.parse(raw):raw}catch{throw new Error(`${field.label} must contain valid JSON.`)}
    }else input[field.key]=raw;
  }
  const missing=model.fields.filter(field=>field.required&&!input[field.key]).map(field=>field.label);
  if(missing.length)throw new Error(`Complete: ${missing.join(', ')}.`);
  if(input.reference_image_urls&&(input.start_image_url||input.end_image_url))throw new Error('Use frame URLs or reference URLs, not both.');
  return input;
}
