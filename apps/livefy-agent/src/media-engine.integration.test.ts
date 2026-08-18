import assert from 'node:assert/strict';
import test from 'node:test';
import {MediaEngine} from './media-engine.js';

const ffmpegPath=process.env.LIVEFY_FFMPEG_PATH;
const ffprobePath=process.env.LIVEFY_FFPROBE_PATH;
const mediaPath=process.env.LIVEFY_TEST_MEDIA;

test('FFmpeg decodes a real MP4 continuously while the authoritative clock crosses loops',{
  skip:!ffmpegPath||!ffprobePath||!mediaPath,
},async()=>{
  const engine=new MediaEngine(ffmpegPath,ffprobePath);
  await engine.loadMedia({id:'integration-video',path:mediaPath!});
  const loaded=engine.getState();
  assert.equal(loaded.durationMs,1000);

  await engine.play();
  await new Promise(resolve=>setTimeout(resolve,2250));

  const playing=engine.getState();
  assert.equal(playing.state,'playing');
  assert.ok(playing.loopIndex>=2,`expected at least two loops, got ${playing.loopIndex}`);
  assert.ok(playing.absolutePositionMs>=2000);
  assert.equal(engine.getLastError(),null);
  engine.stop();
});
