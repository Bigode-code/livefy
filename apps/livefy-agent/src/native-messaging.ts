import type {Readable,Writable} from 'node:stream';
import type {AgentRequest,AgentResponse} from './types.js';

export function encodeNativeMessage(value:unknown){const body=Buffer.from(JSON.stringify(value),'utf8');const header=Buffer.allocUnsafe(4);header.writeUInt32LE(body.length,0);return Buffer.concat([header,body])}

export async function runNativeMessaging(input:Readable,output:Writable,handle:(request:AgentRequest)=>Promise<AgentResponse>){
  let buffer=Buffer.alloc(0);
  for await(const chunk of input){
    buffer=Buffer.concat([buffer,Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk)]);
    while(buffer.length>=4){const size=buffer.readUInt32LE(0);if(size>1_048_576)throw new Error('Native message exceeds 1 MiB.');if(buffer.length<4+size)break;const body=buffer.subarray(4,4+size);buffer=buffer.subarray(4+size);let request:AgentRequest;try{request=JSON.parse(body.toString('utf8')) as AgentRequest}catch{const invalid:AgentResponse={id:'invalid',ok:false,type:'ERROR',error:{code:'INVALID_JSON',message:'Message body is not valid JSON.'}};output.write(encodeNativeMessage(invalid));continue}output.write(encodeNativeMessage(await handle(request)))}
  }
  if(buffer.length)throw new Error('Native message stream ended with an incomplete frame.');
}
