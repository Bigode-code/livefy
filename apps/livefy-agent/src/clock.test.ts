import test from 'node:test';
import assert from 'node:assert/strict';
import {AuthoritativeClock} from './clock.js';

test('absolute clock continues across loops',()=>{let now=0;const clock=new AuthoritativeClock(()=>now);clock.load(60_000);clock.play();now=65_250;assert.deepEqual(clock.snapshot(),{positionMs:5_250,durationMs:60_000,absolutePositionMs:65_250,loopIndex:1,running:true})});
test('pause freezes and play resumes the authoritative clock',()=>{let now=0;const clock=new AuthoritativeClock(()=>now);clock.load(10_000);clock.play();now=2_500;clock.pause();now=9_000;assert.equal(clock.snapshot().absolutePositionMs,2_500);clock.play();now=10_000;assert.equal(clock.snapshot().absolutePositionMs,3_500)});
test('seek changes position inside the current loop without resetting loop index',()=>{let now=0;const clock=new AuthoritativeClock(()=>now);clock.load(1_000);clock.play();now=2_400;clock.seek(800);assert.equal(clock.snapshot().loopIndex,2);assert.equal(clock.snapshot().positionMs,800)});
