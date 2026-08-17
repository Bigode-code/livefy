import { describe,expect,it } from 'vitest';
import './shared.js';

const bridge=globalThis.LivefyBridge;
describe('Livefy extension shared helpers',()=>{
  it('formats pairing codes without ambiguous characters',()=>{expect(bridge.normalizeCode('abcd efgh-jklm-npqr')).toBe('ABCD-EFGH-JKLM-NPQR')});
  it('parses compact audience counts',()=>{expect(bridge.parseCount('1,2K viewers')).toBe(1200);expect(bridge.parseCount('847')).toBe(847)});
  it('parses localized prices',()=>{expect(bridge.parsePrice('R$ 1.249,90')).toBe(1249.9);expect(bridge.parsePrice('$89.50')).toBe(89.5)});
  it('classifies TikTok live pages',()=>{expect(bridge.pageType('https://www.tiktok.com/@creator/live')).toBe('live-room');expect(bridge.pageType('https://livecenter.tiktok.com/producer')).toBe('live-center')});
});
