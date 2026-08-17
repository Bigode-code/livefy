import { describe,expect,it } from 'vitest';
import { serializeVideoInput,videoModels } from './video-models';

describe('video model inputs',()=>{
  it('serializes URL lists and JSON fields',()=>{
    const kling=videoModels.find(model=>model.id==='kuaishou/kling-3.0-video')!;
    expect(serializeVideoInput(kling,{prompt:'Two shots',multi_shots:'[{"prompt":"Wide","duration":3}]'})).toMatchObject({prompt:'Two shots',multi_shots:[{prompt:'Wide',duration:3}]});
  });

  it('rejects Veo frame and reference modes together',()=>{
    const veo=videoModels.find(model=>model.id==='google/veo-3.1-fast')!;
    expect(()=>serializeVideoInput(veo,{prompt:'Move slowly',start_image_url:'https://example.com/start.jpg',reference_image_urls:'https://example.com/ref.jpg'})).toThrow(/frame URLs or reference URLs/);
  });

  it('requires source media for editor models',()=>{
    const editor=videoModels.find(model=>model.id==='kuaishou/kling-3.0-omni-video-edit')!;
    expect(()=>serializeVideoInput(editor,{prompt:'Change the lighting'})).toThrow(/Source video URL/);
  });
});
