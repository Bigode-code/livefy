using System;
using System.Diagnostics;
using System.IO;
using System.Threading;

internal static class Program {
  private static void Pump(Stream source,Stream destination,bool closeDestination) {
    try {
      var buffer=new byte[4096];
      int read;
      while((read=source.Read(buffer,0,buffer.Length))>0) {
        destination.Write(buffer,0,read);
        destination.Flush();
      }
    }
    catch(IOException) { }
    finally { if(closeDestination)destination.Close(); }
  }

  public static int Main() {
    var baseDirectory=AppDomain.CurrentDomain.BaseDirectory;
    var agentEntry=Path.GetFullPath(Path.Combine(baseDirectory,"agent","dist","main.js"));
    if(!File.Exists(agentEntry)) { Console.Error.WriteLine("Livefy Agent entry point not found: "+agentEntry);return 2; }
    var nodePath=Environment.GetEnvironmentVariable("LIVEFY_NODE_PATH")??"node.exe";
    var start=new ProcessStartInfo(nodePath,"\""+agentEntry+"\"") {
      UseShellExecute=false,RedirectStandardInput=true,RedirectStandardOutput=true,RedirectStandardError=true,CreateNoWindow=true
    };
    using(var child=new Process { StartInfo=start }) {
      if(!child.Start())return 3;
      var input=new Thread(()=>Pump(Console.OpenStandardInput(),child.StandardInput.BaseStream,true));
      var output=new Thread(()=>Pump(child.StandardOutput.BaseStream,Console.OpenStandardOutput(),false));
      var error=new Thread(()=>Pump(child.StandardError.BaseStream,Console.OpenStandardError(),false));
      input.IsBackground=true;output.IsBackground=true;error.IsBackground=true;
      input.Start();output.Start();error.Start();
      child.WaitForExit();output.Join();error.Join();return child.ExitCode;
    }
  }
}
