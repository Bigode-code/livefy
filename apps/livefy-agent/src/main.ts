import {LivefyAgent} from './agent.js';
import {runNativeMessaging} from './native-messaging.js';

const agent=new LivefyAgent();
if(process.argv.includes('--diagnose')){
  process.stdout.write(`${JSON.stringify(agent.diagnostics(),null,2)}\n`);
}else{
  runNativeMessaging(process.stdin,process.stdout,request=>agent.handle(request)).catch(error=>{
    process.stderr.write(`Livefy Agent stopped: ${error instanceof Error?error.message:String(error)}\n`);
    process.exitCode=1;
  });
}
