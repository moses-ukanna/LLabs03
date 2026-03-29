/**
 * commands.js — Llabs03 v2
 * 70+ Linux commands. Depends on: filesystem.js
 */
const Commands = (() => {
  let cmdHistory = [];
  const env = {
    HOME:'/home/user',USER:'user',SHELL:'/bin/bash',
    PATH:'/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
    TERM:'xterm-256color',LANG:'en_GB.UTF-8',PWD:'/home/user',
    PS1:'\\u@\\h:\\w\\$ ',HOSTNAME:'llabs03',EDITOR:'nano',
    LOGNAME:'user',UID:'1000',EUID:'1000',
  };
  const aliases = {ll:'ls -la',la:'ls -a','..':'cd ..','...':'cd ../..',l:'ls -CF'};
  const processes = [
    {pid:1,user:'root',stat:'Ss',cpu:'0.0',mem:'0.1',vsz:167936,rss:2048,tty:'?',time:'0:01',cmd:'/sbin/init'},
    {pid:2,user:'root',stat:'S',cpu:'0.0',mem:'0.0',vsz:0,rss:0,tty:'?',time:'0:00',cmd:'[kthreadd]'},
    {pid:50,user:'root',stat:'Ss',cpu:'0.0',mem:'0.1',vsz:45312,rss:1536,tty:'?',time:'0:00',cmd:'/lib/systemd/systemd-journald'},
    {pid:80,user:'root',stat:'Ss',cpu:'0.0',mem:'0.1',vsz:21504,rss:1280,tty:'?',time:'0:00',cmd:'/lib/systemd/systemd-udevd'},
    {pid:100,user:'root',stat:'Ss',cpu:'0.0',mem:'0.1',vsz:65536,rss:2048,tty:'?',time:'0:00',cmd:'sshd: /usr/sbin/sshd -D'},
    {pid:150,user:'www-data',stat:'S',cpu:'0.0',mem:'0.2',vsz:55296,rss:3072,tty:'?',time:'0:00',cmd:'nginx: worker process'},
    {pid:200,user:'root',stat:'Ss',cpu:'0.0',mem:'0.1',vsz:31744,rss:1024,tty:'?',time:'0:00',cmd:'/usr/sbin/cron -f'},
    {pid:250,user:'root',stat:'Ss',cpu:'0.0',mem:'0.0',vsz:12288,rss:768,tty:'?',time:'0:00',cmd:'/usr/sbin/rsyslogd'},
    {pid:1000,user:'user',stat:'Ss',cpu:'0.1',mem:'0.2',vsz:12288,rss:2560,tty:'pts/0',time:'0:00',cmd:'-bash'},
    {pid:1001,user:'user',stat:'S+',cpu:'0.3',mem:'1.2',vsz:98304,rss:12288,tty:'pts/0',time:'0:02',cmd:'llabs03'},
  ];
  const services = {ssh:{active:true,enabled:true},nginx:{active:true,enabled:true},cron:{active:true,enabled:true},rsyslog:{active:true,enabled:true},ufw:{active:false,enabled:false}};

  // ── Man pages ─────────────────────────────────────────────────────────
  const MAN={
    ls:'LS(1)\n\nNAME\n    ls - list directory contents\n\nSYNOPSIS\n    ls [OPTION]... [FILE]...\n\nOPTIONS\n    -a  include hidden files\n    -l  long listing format\n    -h  human-readable sizes\n    -r  reverse order\n    -S  sort by file size\n    -t  sort by modification time\n\nEXAMPLES\n    ls -la /etc\n    ls -lhS ~/projects',
    cd:'CD(1)\n\nNAME\n    cd - change directory\n\nSYNOPSIS\n    cd [DIR]\n    cd -    return to previous directory\n    cd ~    go home\n\nEXAMPLES\n    cd /etc\n    cd -\n    cd ~/projects',
    pwd:'PWD(1)\n\nNAME\n    pwd - print working directory',
    mkdir:'MKDIR(1)\n\nNAME\n    mkdir - make directories\n\nOPTIONS\n    -p  create parent dirs as needed\n\nEXAMPLES\n    mkdir -p a/b/c',
    rm:'RM(1)\n\nNAME\n    rm - remove files/directories\n\nOPTIONS\n    -r,-R  recursive\n    -f     force (ignore missing)\n\nEXAMPLES\n    rm -rf mydir',
    cat:'CAT(1)\n\nNAME\n    cat - concatenate and print files\n\nOPTIONS\n    -n  number lines\n\nEXAMPLES\n    cat -n /etc/passwd',
    grep:'GREP(1)\n\nNAME\n    grep - search for patterns\n\nOPTIONS\n    -i  case insensitive\n    -n  show line numbers\n    -v  invert match\n    -r  recursive\n    -c  count only\n    -l  files with matches only\n\nEXAMPLES\n    grep -rn "error" /var/log/',
    echo:'ECHO(1)\n\nNAME\n    echo - display text\n\nOPTIONS\n    -n  no trailing newline\n    -e  enable escape sequences\n\nEXAMPLES\n    echo "Hello"\n    echo -e "line1\\nline2"\n    echo $HOME',
    chmod:'CHMOD(1)\n\nNAME\n    chmod - change file permissions\n\nEXAMPLES\n    chmod 755 script.sh\n    chmod 600 secret.txt',
    chown:'CHOWN(1)\n\nNAME\n    chown - change file owner\n\nEXAMPLES\n    chown user:user file.txt',
    sudo:'SUDO(8)\n\nNAME\n    sudo - execute command as root\n\nEXAMPLES\n    sudo cat /etc/shadow\n    sudo apt update\n    sudo systemctl restart nginx',
    find:'FIND(1)\n\nNAME\n    find - search files\n\nOPTIONS\n    -name PATTERN  by filename\n    -type f|d      by type\n\nEXAMPLES\n    find / -name "*.conf"\n    find . -type f -name "*.log"',
    stat:'STAT(1)\n\nNAME\n    stat - display file status\n\nEXAMPLES\n    stat /etc/passwd',
    diff:'DIFF(1)\n\nNAME\n    diff - compare files line by line\n\nEXAMPLES\n    diff file1.txt file2.txt',
    cut:'CUT(1)\n\nNAME\n    cut - remove sections from lines\n\nOPTIONS\n    -d DELIM  delimiter\n    -f FIELDS fields to extract\n\nEXAMPLES\n    cut -d: -f1 /etc/passwd',
    tr:'TR(1)\n\nNAME\n    tr - translate characters\n\nEXAMPLES\n    echo "hello" | tr a-z A-Z\n    echo "hello" | tr -d l',
    sed:'SED(1)\n\nNAME\n    sed - stream editor\n\nEXAMPLES\n    sed "s/old/new/g" file\n    cat file | sed "s/foo/bar/"',
    awk:'AWK(1)\n\nNAME\n    awk - pattern scanning\n\nEXAMPLES\n    awk -F: \'{print $1}\' /etc/passwd\n    awk \'{print NR, $0}\' file',
    tee:'TEE(1)\n\nNAME\n    tee - read stdin, write to stdout and files\n\nEXAMPLES\n    echo hello | tee file.txt\n    ls | tee output.txt',
    xargs:'XARGS(1)\n\nNAME\n    xargs - build command lines from stdin\n\nEXAMPLES\n    find . -name "*.txt" | xargs wc -l',
    ping:'PING(8)\n\nNAME\n    ping - send ICMP ECHO_REQUEST\n\nEXAMPLES\n    ping 8.8.8.8\n    ping localhost',
    curl:'CURL(1)\n\nNAME\n    curl - transfer data from URLs\n\nEXAMPLES\n    curl https://example.com\n    curl -I https://example.com',
    ifconfig:'IFCONFIG(8)\n\nNAME\n    ifconfig - configure network interface\n\nEXAMPLES\n    ifconfig\n    ifconfig eth0',
    ip:'IP(8)\n\nNAME\n    ip - show/manipulate routing\n\nEXAMPLES\n    ip addr\n    ip route',
    ss:'SS(8)\n\nNAME\n    ss - socket statistics\n\nEXAMPLES\n    ss -tlnp\n    ss -tuln',
    netstat:'NETSTAT(8)\n\nNAME\n    netstat - network statistics\n\nEXAMPLES\n    netstat -tlnp\n    netstat -an',
    systemctl:'SYSTEMCTL(1)\n\nNAME\n    systemctl - control systemd\n\nEXAMPLES\n    systemctl status ssh\n    systemctl restart nginx\n    systemctl list-units',
    apt:'APT(8)\n\nNAME\n    apt - package manager\n\nEXAMPLES\n    apt update\n    apt install vim\n    apt list --installed',
    useradd:'USERADD(8)\n\nNAME\n    useradd - create user\n\nEXAMPLES\n    useradd newuser\n    useradd -m -s /bin/bash newuser',
    passwd:'PASSWD(1)\n\nNAME\n    passwd - change password\n\nEXAMPLES\n    passwd\n    passwd username',
    lsblk:'LSBLK(8)\n\nNAME\n    lsblk - list block devices\n\nEXAMPLES\n    lsblk\n    lsblk -f',
    dmesg:'DMESG(1)\n\nNAME\n    dmesg - kernel ring buffer\n\nEXAMPLES\n    dmesg\n    dmesg | tail',
    tar:'TAR(1)\n\nNAME\n    tar - archive utility\n\nEXAMPLES\n    tar -czf archive.tar.gz dir/\n    tar -xzf archive.tar.gz',
    base64:'BASE64(1)\n\nNAME\n    base64 - encode/decode base64\n\nEXAMPLES\n    echo "hello" | base64\n    echo "aGVsbG8K" | base64 -d',
    md5sum:'MD5SUM(1)\n\nNAME\n    md5sum - compute MD5 digest\n\nEXAMPLES\n    md5sum file.txt\n    echo "test" | md5sum',
    sha256sum:'SHA256SUM(1)\n\nNAME\n    sha256sum - compute SHA-256 digest\n\nEXAMPLES\n    sha256sum file.txt',
    xxd:'XXD(1)\n\nNAME\n    xxd - make a hexdump\n\nEXAMPLES\n    xxd file.txt\n    echo "hello" | xxd',
    nano:'NANO(1)\n\nNAME\n    nano - simple text editor (simulated)\n\nEXAMPLES\n    nano file.txt',
  };

  // ── Helpers ────────────────────────────────────────────────────────────
  function parseArgs(args){
    const flags=new Set(), positional=[], flagVals={};
    for(let i=0;i<args.length;i++){
      const a=args[i];
      if(a==='--') {positional.push(...args.slice(i+1));break;}
      if(a.startsWith('--')) flags.add(a.slice(2));
      else if(a.startsWith('-')&&a.length>1) [...a.slice(1)].forEach(c=>flags.add(c));
      else positional.push(a);
    }
    return{flags,positional,flagVals};
  }
  function lsLongFormat(name,node){
    const perm=node.permissions||(node.type==='dir'?'drwxr-xr-x':'-rw-r--r--');
    const owner=node.owner||'user';
    const size=node.type==='file'?String((node.content||'').length).padStart(6):'  4096';
    return `${perm} 1 ${owner.padEnd(6)} ${owner.padEnd(6)} ${size} Mar 28 00:00 ${name}`;
  }
  function wildcardMatch(str,pat){
    const re='^'+pat.replace(/[.+^${}()|[\]\\]/g,'\\$&').replace(/\*/g,'.*').replace(/\?/g,'.')+'$';
    return new RegExp(re).test(str);
  }
  function expandEnv(str){
    return str.replace(/\$\{([A-Za-z_][A-Za-z0-9_]*)\}/g,(_,k)=>env[k]!=null?env[k]:'')
              .replace(/\$([A-Za-z_][A-Za-z0-9_]*)/g,(_,k)=>env[k]!=null?env[k]:'');
  }
  function simpleHash(str){let h=0;for(let i=0;i<str.length;i++){h=((h<<5)-h)+str.charCodeAt(i);h|=0;}return Math.abs(h).toString(16).padStart(8,'0');}

  // ── Commands ──────────────────────────────────────────────────────────
  const cmds = {
    pwd(){return{output:FileSystem.getCwd()};},

    ls(args){
      const{flags,positional}=parseArgs(args);
      const targets=positional.length?positional:[null];
      const results=[];
      for(const target of targets){
        const r=FileSystem.listDir(target);
        if(r.error){results.push({error:r.error});continue;}
        let entries=Object.entries(r.entries);
        if(!flags.has('a'))entries=entries.filter(([n])=>!n.startsWith('.'));
        if(flags.has('S'))entries.sort(([,a],[,b])=>{const sa=a.type==='file'?(a.content||'').length:4096;const sb=b.type==='file'?(b.content||'').length:4096;return sb-sa;});
        if(flags.has('r'))entries.reverse();
        if(flags.has('l')){
          const header=`total ${entries.length*4}`;
          const lines=entries.map(([n,node])=>lsLongFormat(n,node));
          results.push({text:[header,...lines].join('\n')});
        }else{
          results.push({colorNames:entries.map(([n,node])=>({name:n,isDir:node.type==='dir',isExe:node.permissions&&node.permissions.includes('x')&&node.type==='file'}))});
        }
      }
      if(results.length===1){
        const r=results[0];
        if(r.error)return{output:r.error,isError:true};
        if(r.colorNames)return{colorNames:r.colorNames};
        return{output:r.text};
      }
      const parts=[];
      for(let i=0;i<targets.length;i++){
        if(targets.length>1)parts.push(`${targets[i]}:`);
        const r=results[i];
        if(r.error)parts.push(r.error);
        else if(r.text)parts.push(r.text);
        else if(r.colorNames)parts.push(r.colorNames.map(e=>e.isDir?e.name+'/':e.name).join('  '));
      }
      return{output:parts.join('\n')};
    },

    cd(args){
      const target = args[0] != null ? args[0] : undefined;
      const showPath = target === '-';
      const r=FileSystem.changeDir(target);
      if(r.error)return{output:r.error,isError:true};
      env.PWD=FileSystem.getCwd();
      env.OLDPWD=r.oldPwd||env.PWD;
      return showPath ? {output:FileSystem.getCwd()} : {output:''};
    },

    mkdir(args){
      const{flags,positional}=parseArgs(args);
      if(!positional.length)return{output:'mkdir: missing operand',isError:true};
      const errs=positional.map(p=>FileSystem.mkdir(p,flags.has('p'))).filter(r=>r.error).map(r=>r.error);
      return{output:errs.join('\n'),isError:!!errs.length};
    },

    rmdir(args){
      if(!args.length)return{output:'rmdir: missing operand',isError:true};
      const errs=args.map(p=>FileSystem.rmdir(p)).filter(r=>r.error).map(r=>r.error);
      return{output:errs.join('\n'),isError:!!errs.length};
    },

    touch(args){
      if(!args.length)return{output:'touch: missing operand',isError:true};
      const errs=args.map(p=>FileSystem.touch(p)).filter(r=>r.error).map(r=>r.error);
      return{output:errs.join('\n'),isError:!!errs.length};
    },

    cat(args,stdin){
      const{flags,positional}=parseArgs(args);
      if(!positional.length){
        if(stdin!=null){return flags.has('n')?{output:stdin.split('\n').map((l,i)=>`${String(i+1).padStart(6)}\t${l}`).join('\n')}:{output:stdin};}
        return{output:'cat: missing file operand',isError:true};
      }
      const parts=positional.map(p=>{const r=FileSystem.readFile(p);return r.error?{error:`cat: ${r.error}`}:{content:r.content};});
      const errors=parts.filter(p=>p.error);
      if(errors.length)return{output:errors.map(e=>e.error).join('\n'),isError:true};
      let out=parts.map(p=>p.content).join('');
      if(flags.has('n'))out=out.split('\n').map((l,i)=>`${String(i+1).padStart(6)}\t${l}`).join('\n');
      return{output:out.replace(/\n$/,'')};
    },

    echo(args){
      const{flags,positional}=parseArgs(args);
      let text=expandEnv(positional.join(' '));
      if(flags.has('e'))text=text.replace(/\\n/g,'\n').replace(/\\t/g,'\t').replace(/\\\\/g,'\\');
      return{output:text};
    },

    grep(args,stdin){
      const{flags,positional}=parseArgs(args);
      if(!positional.length)return{output:'grep: missing pattern',isError:true};
      const pattern=positional[0],files=positional.slice(1);
      let regex;try{regex=new RegExp(pattern,flags.has('i')?'gi':'g');}catch(e){return{output:`grep: invalid regex: ${e.message}`,isError:true};}
      const results=[];
      function processContent(content,label){
        const lines=content.split('\n');let count=0;
        lines.forEach((line,idx)=>{
          regex.lastIndex=0;const matched=regex.test(line);regex.lastIndex=0;
          const include=flags.has('v')?!matched:matched;
          if(include){count++;if(!flags.has('c')&&!flags.has('l')){let out='';if(label)out+=label+':';if(flags.has('n'))out+=(idx+1)+':';out+=line;results.push(out);}}
        });
        if(flags.has('c'))results.push((label?label+':':'')+count);
        if(flags.has('l')&&count>0)results.push(label||'(stdin)');
      }
      if(files.length){
        for(const f of files){
          if(flags.has('r')){
            const abs=FileSystem.resolve(f),node=FileSystem.getNode(abs);
            if(node&&node.type==='dir'){
              (function walkGrep(n,p){Object.entries(n.children).forEach(([name,child])=>{
                const cp=p+'/'+name;
                if(child.type==='file')processContent(child.content||'',cp);
                else if(child.type==='dir')walkGrep(child,cp);
              });})(node,f);continue;
            }
          }
          const r=FileSystem.readFile(f);
          if(r.error){results.push(`grep: ${f}: ${r.error}`);continue;}
          processContent(r.content||'',files.length>1?f:'');
        }
      }else if(stdin!=null){processContent(stdin,'');}
      else return{output:'grep: no input',isError:true};
      return{output:results.join('\n'),isError:results.length===0};
    },

    find(args){
      const startPath=args[0]&&!args[0].startsWith('-')?args[0]:'.';
      const nameIdx=args.indexOf('-name'),typeIdx=args.indexOf('-type');
      const namePattern=nameIdx!==-1?args[nameIdx+1]?.replace(/['"]/g,''):null;
      const typeFilter=typeIdx!==-1?args[typeIdx+1]:null;
      const results=[];
      function walk(absPath,node,displayPath){
        if(!node)return;
        const name=absPath.split('/').pop()||'/';
        const typeMatch=!typeFilter||(typeFilter==='f'?node.type==='file':node.type==='dir');
        const nameMatch=!namePattern||wildcardMatch(name,namePattern);
        if(typeMatch&&nameMatch)results.push(displayPath);
        if(node.type==='dir')Object.entries(node.children).forEach(([n,child])=>{walk(absPath.replace(/\/$/,'')+'/'+n,child,displayPath.replace(/\/$/,'')+'/'+n);});
      }
      const abs=FileSystem.resolve(startPath),node=FileSystem.getNode(abs);
      if(!node)return{output:`find: '${startPath}': No such file or directory`,isError:true};
      walk(abs,node,startPath);
      return{output:results.join('\n')};
    },

    rm(args){
      const{flags,positional}=parseArgs(args);
      if(!positional.length)return{output:'rm: missing operand',isError:true};
      const errs=[];
      for(const p of positional){const r=FileSystem.remove(p,flags.has('r')||flags.has('R'));if(r.error&&!flags.has('f'))errs.push(r.error);}
      return{output:errs.join('\n'),isError:!!errs.length};
    },

    cp(args){
      const{flags,positional}=parseArgs(args);
      if(positional.length<2)return{output:'cp: missing destination',isError:true};
      const dest=positional.pop();
      const errs=positional.map(src=>FileSystem.copy(src,dest,flags.has('r')||flags.has('R'))).filter(r=>r.error).map(r=>r.error);
      return{output:errs.join('\n'),isError:!!errs.length};
    },

    mv(args){
      const{positional}=parseArgs(args);
      if(positional.length<2)return{output:'mv: missing destination',isError:true};
      const dest=positional.pop();
      const errs=positional.map(src=>FileSystem.move(src,dest)).filter(r=>r.error).map(r=>r.error);
      return{output:errs.join('\n'),isError:!!errs.length};
    },

    chmod(args){
      if(args.length<2)return{output:'chmod: missing operand',isError:true};
      const mode=args[0];
      const errs=args.slice(1).map(p=>FileSystem.chmod(mode,p)).filter(r=>r.error).map(r=>r.error);
      return{output:errs.join('\n'),isError:!!errs.length};
    },

    chown(args){
      if(args.length<2)return{output:'chown: missing operand',isError:true};
      const owner=args[0];
      const errs=args.slice(1).map(p=>FileSystem.chown(owner,p)).filter(r=>r.error).map(r=>r.error);
      return{output:errs.join('\n'),isError:!!errs.length};
    },

    stat(args){
      if(!args.length)return{output:'stat: missing operand',isError:true};
      const r=FileSystem.stat(args[0]);
      if(r.error)return{output:r.error,isError:true};
      return{output:`  File: ${r.path}\n  Size: ${r.size}\t\t${r.type==='dir'?'directory':'regular file'}\nAccess: (${r.permissions})\n   Uid: (${r.owner==='root'?'0':'1000'}/${r.owner})\tGid: (${r.owner==='root'?'0':'1000'}/${r.owner})\nModify: 2026-03-28 00:00:00.000000000 +0000\nChange: 2026-03-28 00:00:00.000000000 +0000\n Birth: 2026-03-27 23:50:00.000000000 +0000`};
    },

    file(args){
      if(!args.length)return{output:'file: missing operand',isError:true};
      const results=args.map(p=>{
        const abs=FileSystem.resolve(p),node=FileSystem.getNode(abs);
        if(!node)return`${p}: cannot open (No such file or directory)`;
        if(node.type==='dir')return`${p}: directory`;
        const c=node.content||'';
        if(c.startsWith('#!/bin/bash'))return`${p}: Bash script, ASCII text executable`;
        if(c.startsWith('#!/'))return`${p}: script, ASCII text executable`;
        if(c.startsWith('<!DOCTYPE')||c.startsWith('<html'))return`${p}: HTML document, ASCII text`;
        if(c.startsWith('{'))return`${p}: JSON data, ASCII text`;
        if(c.includes('ELF 64-bit'))return`${p}: ELF 64-bit LSB pie executable, x86-64`;
        if(c.startsWith('[kernel]')||c.startsWith('[initramfs]'))return`${p}: data`;
        return`${p}: ASCII text`;
      });
      return{output:results.join('\n')};
    },

    diff(args){
      const{positional}=parseArgs(args);
      if(positional.length<2)return{output:'diff: missing operand',isError:true};
      const r1=FileSystem.readFile(positional[0]),r2=FileSystem.readFile(positional[1]);
      if(r1.error)return{output:`diff: ${r1.error}`,isError:true};
      if(r2.error)return{output:`diff: ${r2.error}`,isError:true};
      if(r1.content===r2.content)return{output:''};
      const l1=r1.content.split('\n'),l2=r2.content.split('\n');
      const out=[`--- ${positional[0]}`,`+++ ${positional[1]}`];
      const max=Math.max(l1.length,l2.length);
      for(let i=0;i<max;i++){
        if(l1[i]!==l2[i]){
          if(l1[i]!=null)out.push(`-${l1[i]}`);
          if(l2[i]!=null)out.push(`+${l2[i]}`);
        }
      }
      return{output:out.join('\n')};
    },

    cut(args,stdin){
      const dIdx=args.indexOf('-d'),fIdx=args.indexOf('-f');
      const delim=dIdx!==-1?(args[dIdx+1]||'').replace(/^['"]|['"]$/g,''):'\t';
      const field=fIdx!==-1?args[fIdx+1]:'';
      const{positional}=parseArgs(args.filter((_,i)=>i!==dIdx&&i!==dIdx+1&&i!==fIdx&&i!==fIdx+1));
      let content=stdin;
      if(positional.length){const r=FileSystem.readFile(positional[0]);if(r.error)return{output:`cut: ${r.error}`,isError:true};content=r.content;}
      if(!content)return{output:'',isError:true};
      const fields=field.split(',').map(f=>{const m=f.match(/(\d+)(?:-(\d*))?/);if(!m)return[];const s=parseInt(m[1]);const e=m[2]?parseInt(m[2])||999:s;const a=[];for(let i=s;i<=e;i++)a.push(i);return a;}).flat();
      return{output:content.split('\n').filter(l=>l).map(line=>{const parts=line.split(delim);return fields.map(f=>parts[f-1]||'').join(delim);}).join('\n')};
    },

    tr(args,stdin){
      if(!stdin)return{output:'tr: missing input (use pipe)',isError:true};
      const{flags}=parseArgs(args);
      const posArgs=args.filter(a=>!a.startsWith('-'));
      if(flags.has('d')&&posArgs.length>=1){return{output:stdin.replace(new RegExp(`[${posArgs[0].replace(/[-[\]{}()*+?.,\\^$|#\s]/g,'\\$&')}]`,'g'),'')};}
      if(posArgs.length<2)return{output:'tr: missing operand',isError:true};
      let set1=posArgs[0],set2=posArgs[1];
      if(/^[a-z]-[a-z]$/.test(set1)){const s=set1.charCodeAt(0),e=set1.charCodeAt(2);set1='';for(let i=s;i<=e;i++)set1+=String.fromCharCode(i);}
      if(/^[a-z]-[a-z]$/.test(set2)){const s=set2.charCodeAt(0),e=set2.charCodeAt(2);set2='';for(let i=s;i<=e;i++)set2+=String.fromCharCode(i);}
      if(/^[A-Z]-[A-Z]$/.test(set1)){const s=set1.charCodeAt(0),e=set1.charCodeAt(2);set1='';for(let i=s;i<=e;i++)set1+=String.fromCharCode(i);}
      if(/^[A-Z]-[A-Z]$/.test(set2)){const s=set2.charCodeAt(0),e=set2.charCodeAt(2);set2='';for(let i=s;i<=e;i++)set2+=String.fromCharCode(i);}
      return{output:[...stdin].map(c=>{const i=set1.indexOf(c);return i>=0?(set2[Math.min(i,set2.length-1)]||''):c;}).join('')};
    },

    sed(args,stdin){
      const{positional}=parseArgs(args);
      let expr=positional[0]||'',file=positional[1];
      let content=stdin;
      if(file){const r=FileSystem.readFile(file);if(r.error)return{output:`sed: ${r.error}`,isError:true};content=r.content;}
      if(!content)return{output:''};
      const m=expr.match(/^s(.)(.+)\1(.+)\1([gi]*)$/);
      if(!m)return{output:content};
      const regex=new RegExp(m[2],m[4]||'');
      return{output:content.split('\n').map(line=>line.replace(regex,m[3])).join('\n')};
    },

    awk(args,stdin){
      const fIdx=args.indexOf('-F');
      const delim=fIdx!==-1?args[fIdx+1]:null;
      const{positional}=parseArgs(args.filter((_,i)=>i!==fIdx&&i!==(fIdx+1)));
      const program=positional[0]||'';
      const file=positional[1];
      let content=stdin;
      if(file){const r=FileSystem.readFile(file);if(r.error)return{output:`awk: ${r.error}`,isError:true};content=r.content;}
      if(!content)return{output:''};
      const printMatch=program.match(/\{print\s+(.*?)\}/);
      if(!printMatch)return{output:content};
      const fields=printMatch[1];
      const sep=delim||/\s+/;
      return{output:content.split('\n').filter(l=>l).map((line,idx)=>{
        const parts=line.split(sep);
        return fields.replace(/\$(\d+)/g,(_,n)=>parts[parseInt(n)-1]||'').replace(/NR/g,String(idx+1)).replace(/\$0/g,line).replace(/NF/g,String(parts.length));
      }).join('\n')};
    },

    tee(args,stdin){
      if(!stdin)return{output:''};
      const{flags,positional}=parseArgs(args);
      for(const f of positional)FileSystem.writeFile(f,stdin+'\n',flags.has('a'));
      return{output:stdin};
    },

    xargs(args,stdin){
      if(!stdin)return{output:''};
      const cmd=args[0]||'echo';
      const cmdArgs=args.slice(1);
      const items=stdin.trim().split(/\s+/);
      return cmds[cmd]?cmds[cmd].call(cmds,[...cmdArgs,...items]):{output:`xargs: ${cmd}: command not found`,isError:true};
    },

    whoami(){return{output:'user'};},
    hostname(){return{output:'llabs03'};},

    uname(args){
      const{flags}=parseArgs(args);
      if(flags.has('a'))return{output:'Linux llabs03 5.15.0-llabs03 #1 SMP Sat Mar 28 00:00:00 UTC 2026 x86_64 GNU/Linux'};
      if(flags.has('r'))return{output:'5.15.0-llabs03'};
      if(flags.has('n'))return{output:'llabs03'};
      if(flags.has('m'))return{output:'x86_64'};
      if(flags.has('s'))return{output:'Linux'};
      return{output:'Linux'};
    },

    date(args){
      const{flags}=parseArgs(args);
      if(flags.has('u'))return{output:new Date().toUTCString()};
      return{output:new Date().toString()};
    },
    uptime(){const m=Math.floor(Math.random()*10)+2;return{output:` 00:${String(m).padStart(2,'0')}:00 up 0:${String(m).padStart(2,'0')},  1 user,  load average: 0.01, 0.00, 0.00`};},

    id(){return{output:'uid=1000(user) gid=1000(user) groups=1000(user),4(adm),24(cdrom),27(sudo)'};},

    ps(args){
      const showAll=args.some(a=>a==='aux'||a==='-aux'||a==='-e'||a==='-A'||a==='-ef');
      const list=showAll?processes:processes.filter(p=>p.user==='user');
      const header='USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND';
      const rows=list.map(p=>`${p.user.padEnd(10)}${String(p.pid).padStart(4)} ${p.cpu.padStart(4)} ${p.mem.padStart(4)} ${String(p.vsz).padStart(6)} ${String(p.rss).padStart(5)} ${(p.tty||'?').padEnd(8)} ${p.stat.padEnd(4)} 00:00 ${p.time.padStart(5)} ${p.cmd}`);
      return{output:[header,...rows].join('\n')};
    },

    kill(args){
      const{positional}=parseArgs(args);
      const pid=parseInt(positional[0]);
      if(isNaN(pid))return{output:`kill: ${positional[0]}: arguments must be process IDs`,isError:true};
      const proc=processes.find(p=>p.pid===pid);
      if(!proc)return{output:`kill: (${pid}) - No such process`,isError:true};
      if(proc.user!=='user')return{output:`kill: (${pid}) - Operation not permitted`,isError:true};
      return{output:`[Terminated]  ${proc.cmd}`};
    },

    env(){return{output:Object.entries(env).map(([k,v])=>`${k}=${v}`).join('\n')};},
    printenv(args){
      if(args.length)return{output:args.map(k=>env[k]??'').join('\n')};
      return{output:Object.entries(env).map(([k,v])=>`${k}=${v}`).join('\n')};
    },

    export(args){
      for(const arg of args){
        const eq=arg.indexOf('=');
        if(eq!==-1){env[arg.slice(0,eq)]=expandEnv(arg.slice(eq+1).replace(/^['"]|['"]$/g,''));}
        else env[arg]=env[arg]??'';
      }
      return{output:''};
    },

    wc(args,stdin){
      const{flags,positional}=parseArgs(args);
      function count(c){const lines=c.split('\n').length-(c.endsWith('\n')?1:0);const words=c.trim()?c.trim().split(/\s+/).length:0;return{lines,words,bytes:c.length};}
      function fmt(c,f){if(flags.has('l'))return String(c.lines)+(f?' '+f:'');if(flags.has('w'))return String(c.words)+(f?' '+f:'');if(flags.has('c'))return String(c.bytes)+(f?' '+f:'');return`${String(c.lines).padStart(8)}${String(c.words).padStart(8)}${String(c.bytes).padStart(8)}`+(f?' '+f:'');}
      if(!positional.length){if(stdin!=null)return{output:fmt(count(stdin))};return{output:'wc: missing operand',isError:true};}
      const rows=positional.map(p=>{const r=FileSystem.readFile(p);if(r.error)return{error:`wc: ${p}: ${r.error}`};return{out:fmt(count(r.content||''),p)};});
      const errs=rows.filter(r=>r.error);
      if(errs.length)return{output:errs.map(e=>e.error).join('\n'),isError:true};
      return{output:rows.map(r=>r.out).join('\n')};
    },

    sort(args,stdin){
      const{flags,positional}=parseArgs(args);
      let content=stdin;
      if(positional.length){const r=FileSystem.readFile(positional[0]);if(r.error)return{output:`sort: ${r.error}`,isError:true};content=r.content;}
      if(!content)return{output:''};
      let lines=content.split('\n');if(lines[lines.length-1]==='')lines.pop();
      lines.sort(flags.has('n')?(a,b)=>parseFloat(a)-parseFloat(b):undefined);
      if(flags.has('r'))lines.reverse();
      if(flags.has('u'))lines=[...new Set(lines)];
      return{output:lines.join('\n')};
    },

    uniq(args,stdin){
      const{flags,positional}=parseArgs(args);
      let content=stdin;
      if(positional.length){const r=FileSystem.readFile(positional[0]);if(r.error)return{output:`uniq: ${r.error}`,isError:true};content=r.content;}
      if(!content)return{output:''};
      const lines=content.split('\n'),out=[];
      let prev=null,count=0;
      for(const line of lines){
        if(line===prev){count++;continue;}
        if(prev!==null)out.push(flags.has('c')?`${String(count).padStart(6)} ${prev}`:prev);
        prev=line;count=1;
      }
      if(prev!==null)out.push(flags.has('c')?`${String(count).padStart(6)} ${prev}`:prev);
      return{output:out.join('\n')};
    },

    head(args,stdin){
      const nIdx=args.indexOf('-n');
      const n=nIdx!==-1?parseInt(args[nIdx+1])||10:10;
      const{positional}=parseArgs(args);
      let content=stdin;
      if(positional.length){const r=FileSystem.readFile(positional[0]);if(r.error)return{output:`head: ${r.error}`,isError:true};content=r.content;}
      if(!content)return{output:''};
      return{output:content.split('\n').slice(0,n).join('\n')};
    },

    tail(args,stdin){
      const nIdx=args.indexOf('-n');
      const n=nIdx!==-1?parseInt(args[nIdx+1])||10:10;
      const{positional}=parseArgs(args);
      let content=stdin;
      if(positional.length){const r=FileSystem.readFile(positional[0]);if(r.error)return{output:`tail: ${r.error}`,isError:true};content=r.content;}
      if(!content)return{output:''};
      const lines=content.split('\n');
      return{output:lines.slice(Math.max(0,lines.length-n)).join('\n')};
    },

    rev(args,stdin){let c=stdin;if(args.length){const r=FileSystem.readFile(args[0]);if(r.error)return{output:`rev: ${r.error}`,isError:true};c=r.content;}if(!c)return{output:''};return{output:c.split('\n').map(l=>[...l].reverse().join('')).join('\n')};},
    tac(args,stdin){let c=stdin;if(args.length){const r=FileSystem.readFile(args[0]);if(r.error)return{output:`tac: ${r.error}`,isError:true};c=r.content;}if(!c)return{output:''};const l=c.split('\n');if(l[l.length-1]==='')l.pop();return{output:l.reverse().join('\n')};},

    seq(args){
      const nums=args.map(Number).filter(n=>!isNaN(n));
      let start=1,step=1,end=1;
      if(nums.length===1)end=nums[0];
      else if(nums.length===2){start=nums[0];end=nums[1];}
      else if(nums.length>=3){start=nums[0];step=nums[1];end=nums[2];}
      const out=[];
      if(step>0)for(let i=start;i<=end;i+=step)out.push(String(i));
      else if(step<0)for(let i=start;i>=end;i+=step)out.push(String(i));
      return{output:out.slice(0,1000).join('\n')};
    },

    yes(args){return{output:(args[0]||'y'+'\n').repeat(20).trim()};},
    true(){return{output:''};},
    false(){return{output:'',isError:true};},

    basename(args){if(!args.length)return{output:'basename: missing operand',isError:true};const p=args[0];const suffix=args[1]||'';let name=p.split('/').pop();if(suffix&&name.endsWith(suffix))name=name.slice(0,-suffix.length);return{output:name};},
    dirname(args){if(!args.length)return{output:'dirname: missing operand',isError:true};const parts=args[0].split('/');parts.pop();return{output:parts.join('/')||'.'};},
    realpath(args){if(!args.length)return{output:'realpath: missing operand',isError:true};return{output:FileSystem.resolve(args[0])};},

    ln(args){return{output:'ln: symbolic links simulated — use cp instead',isError:false};},

    history(){return{output:cmdHistory.map((c,i)=>`${String(i+1).padStart(5)}  ${c}`).join('\n')};},
    clear(){return{output:'',clear:true};},

    man(args){
      if(!args.length)return{output:'What manual page do you want?',isError:true};
      const page=MAN[args[0]];
      if(!page)return{output:`No manual entry for ${args[0]}`,isError:true};
      return{output:page};
    },

    alias(args){
      if(!args.length)return{output:Object.entries(aliases).map(([k,v])=>`alias ${k}='${v}'`).join('\n')};
      for(const arg of args){const m=arg.match(/^(\w+)=(.+)$/);if(m)aliases[m[1]]=m[2].replace(/^['"]|['"]$/g,'');}
      return{output:''};
    },

    unalias(args){if(!args.length)return{output:'unalias: missing operand',isError:true};for(const a of args)delete aliases[a];return{output:''};},

    which(args){
      if(!args.length)return{output:'which: missing argument',isError:true};
      const known=new Set(Object.keys(cmds));
      return{output:args.map(a=>known.has(a)?`/usr/bin/${a}`:`which: no ${a} in PATH`).join('\n')};
    },

    type(args){
      if(!args.length)return{output:'type: missing argument',isError:true};
      const known=new Set(Object.keys(cmds));
      return{output:args.map(a=>known.has(a)?`${a} is a shell builtin`:aliases[a]?`${a} is aliased to '${aliases[a]}'`:`bash: type: ${a}: not found`).join('\n')};
    },

    df(){return{output:'Filesystem      Size  Used Avail Use% Mounted on\n/dev/sda1        20G  2.1G   17G  11% /\ntmpfs           1.0G     0  1.0G   0% /tmp\n/dev/sda2       2.0G     0  2.0G   0% [SWAP]'};},
    free(){return{output:'              total        used        free      shared  buff/cache   available\nMem:        2048000      512000      819200       12288      716800     1228800\nSwap:       1024000           0     1024000'};},
    du(args){const{positional}=parseArgs(args);const path=positional[0]||'.';const abs=FileSystem.resolve(path),node=FileSystem.getNode(abs);if(!node)return{output:`du: '${path}': No such file or directory`,isError:true};const size=Math.ceil(FileSystem.totalSize(node)/1024);return{output:`${size}\t${path}`};},
    mount(){return{output:'/dev/sda1 on / type ext4 (rw,relatime)\ntmpfs on /tmp type tmpfs (rw,nosuid,nodev)\nproc on /proc type proc (rw,nosuid,nodev,noexec)\nsysfs on /sys type sysfs (rw,nosuid,nodev,noexec)\ndevtmpfs on /dev type devtmpfs (rw,nosuid,size=1024000k)'};},

    // ── Network ──────────────────────────────────────────────────────────
    ping(args){
      const host=args.filter(a=>!a.startsWith('-'))[0]||'';
      if(!host)return{output:'ping: missing host operand',isError:true};
      const ip=host==='localhost'||host==='127.0.0.1'?'127.0.0.1':host.match(/^\d/)?host:'93.184.216.34';
      const lines=[`PING ${host} (${ip}) 56(84) bytes of data.`];
      for(let i=0;i<4;i++){const t=(Math.random()*50+1).toFixed(3);lines.push(`64 bytes from ${ip}: icmp_seq=${i+1} ttl=64 time=${t} ms`);}
      lines.push(`\n--- ${host} ping statistics ---\n4 packets transmitted, 4 received, 0% packet loss\nrtt min/avg/max = 1.200/15.500/48.000 ms`);
      return{output:lines.join('\n')};
    },

    curl(args){
      const{flags,positional}=parseArgs(args);
      const url=positional[0]||'';
      if(!url)return{output:'curl: no URL specified',isError:true};
      if(flags.has('I')||flags.has('head'))return{output:`HTTP/1.1 200 OK\nContent-Type: text/html; charset=UTF-8\nContent-Length: 1256\nConnection: keep-alive\nServer: nginx/1.24.0\nDate: ${new Date().toUTCString()}\n`};
      return{output:`<!DOCTYPE html>\n<html>\n<head><title>Example Domain</title></head>\n<body>\n<h1>Example Domain</h1>\n<p>This domain is for use in illustrative examples.</p>\n</body>\n</html>`};
    },

    wget(args){const url=args.filter(a=>!a.startsWith('-'))[0]||'';if(!url)return{output:'wget: missing URL',isError:true};const fname=url.split('/').pop()||'index.html';FileSystem.writeFile(fname,`<!-- Downloaded from ${url} -->\n<html><body>Content</body></html>\n`);return{output:`--2026-03-28 00:02:00--  ${url}\nResolving... 93.184.216.34\nConnecting... connected.\nHTTP request sent, awaiting response... 200 OK\nLength: 1256 (1.2K) [text/html]\nSaving to: '${fname}'\n\n${fname}         100%[============>]   1.23K  --.-KB/s    in 0s\n\n2026-03-28 00:02:00 (50.0 MB/s) - '${fname}' saved [1256/1256]`};},

    ifconfig(){return{output:'eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500\n        inet 10.0.0.15  netmask 255.255.255.0  broadcast 10.0.0.255\n        inet6 fe80::1  prefixlen 64  scopeid 0x20<link>\n        ether 02:42:ac:11:00:02  txqueuelen 0  (Ethernet)\n        RX packets 54321  bytes 9876543 (9.4 MiB)\n        TX packets 32100  bytes 5432100 (5.1 MiB)\n\nlo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536\n        inet 127.0.0.1  netmask 255.0.0.0\n        inet6 ::1  prefixlen 128  scopeid 0x10<host>\n        RX packets 1234  bytes 123456 (120.5 KiB)\n        TX packets 1234  bytes 123456 (120.5 KiB)'};},

    ip(args){
      const sub=args[0]||'addr';
      if(sub==='addr'||sub==='a')return{output:'1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536\n    inet 127.0.0.1/8 scope host lo\n    inet6 ::1/128 scope host\n2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500\n    inet 10.0.0.15/24 brd 10.0.0.255 scope global eth0\n    inet6 fe80::1/64 scope link'};
      if(sub==='route'||sub==='r')return{output:'default via 10.0.0.1 dev eth0 proto dhcp metric 100\n10.0.0.0/24 dev eth0 proto kernel scope link src 10.0.0.15 metric 100'};
      if(sub==='link'||sub==='l')return{output:'1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN\n    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00\n2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP\n    link/ether 02:42:ac:11:00:02 brd ff:ff:ff:ff:ff:ff'};
      return{output:`Usage: ip [ addr | route | link ]`};
    },

    ss(args){return{output:'State  Recv-Q Send-Q Local Address:Port  Peer Address:Port\nLISTEN 0      128    0.0.0.0:22           0.0.0.0:*         users:(("sshd",pid=100,fd=3))\nLISTEN 0      511    0.0.0.0:80           0.0.0.0:*         users:(("nginx",pid=150,fd=6))\nESTAB  0      0      10.0.0.15:22         10.0.0.5:52200    users:(("sshd",pid=302,fd=4))'};},
    netstat(args){return cmds.ss(args);},

    // ── System/Services ──────────────────────────────────────────────────
    systemctl(args){
      const sub=args[0]||'list-units',name=args[1]||'';
      if(sub==='status'){
        const svc=services[name.replace('.service','')];
        if(!svc)return{output:`Unit ${name}.service could not be found.`,isError:true};
        return{output:`● ${name}.service - ${name} daemon\n   Loaded: loaded (/lib/systemd/system/${name}.service; ${svc.enabled?'enabled':'disabled'})\n   Active: ${svc.active?'active (running)':'inactive (dead)'} since Sat 2026-03-28 00:00:00 UTC\n Main PID: ${Math.floor(Math.random()*200+50)}\n   CGroup: /system.slice/${name}.service`};
      }
      if(sub==='start'||sub==='restart'){const svc=services[name.replace('.service','')];if(svc)svc.active=true;return{output:''};}
      if(sub==='stop'){const svc=services[name.replace('.service','')];if(svc)svc.active=false;return{output:''};}
      if(sub==='enable'){const svc=services[name.replace('.service','')];if(svc)svc.enabled=true;return{output:`Created symlink /etc/systemd/system/multi-user.target.wants/${name}.service`};}
      if(sub==='disable'){const svc=services[name.replace('.service','')];if(svc)svc.enabled=false;return{output:`Removed /etc/systemd/system/multi-user.target.wants/${name}.service`};}
      if(sub==='list-units'){return{output:Object.entries(services).map(([n,s])=>`  ${n.padEnd(20)} ${(s.active?'active':'inactive').padEnd(10)} ${s.enabled?'enabled':'disabled'}`).join('\n')};}
      return{output:`Unknown command: ${sub}`};
    },

    service(args){
      if(args.length<2)return{output:'Usage: service <name> start|stop|status|restart',isError:true};
      return cmds.systemctl([args[1],args[0]]);
    },

    apt(args){
      const sub=args[0]||'';
      if(sub==='update')return{output:'Hit:1 http://archive.ubuntu.com/ubuntu jammy InRelease\nHit:2 http://archive.ubuntu.com/ubuntu jammy-updates InRelease\nHit:3 http://security.ubuntu.com/ubuntu jammy-security InRelease\nReading package lists... Done\nBuilding dependency tree... Done\nAll packages are up to date.'};
      if(sub==='upgrade')return{output:'Reading package lists... Done\nBuilding dependency tree... Done\nCalculating upgrade... Done\n0 upgraded, 0 newly installed, 0 to remove and 0 not upgraded.'};
      if(sub==='install')return{output:`Reading package lists... Done\nBuilding dependency tree... Done\nThe following NEW packages will be installed:\n  ${args[1]||'package'}\n0 upgraded, 1 newly installed, 0 to remove.\nSetting up ${args[1]||'package'}... Done.`};
      if(sub==='list')return{output:'bash/jammy 5.1-6ubuntu1 amd64 [installed]\ncurl/jammy 7.81.0-1ubuntu1.15 amd64 [installed]\ngit/jammy 1:2.34.1-1ubuntu1.10 amd64 [installed]\nnginx/jammy 1.18.0-6ubuntu14.4 amd64 [installed]\nopenssh-server/jammy 1:8.9p1-3ubuntu0.6 amd64 [installed]\nvim/jammy 2:8.2.3995-1ubuntu2.15 amd64 [installed]'};
      return{output:'Usage: apt [update|upgrade|install|list]'};
    },

    dpkg(args){
      const{flags}=parseArgs(args);
      if(flags.has('l'))return cmds.apt(['list']);
      return{output:'dpkg: use apt for package management'};
    },

    // ── Users ────────────────────────────────────────────────────────────
    useradd(args){if(!args.length)return{output:'useradd: missing operand',isError:true};return{output:`useradd: user '${args[args.length-1]}' created (simulated)`};},
    userdel(args){if(!args.length)return{output:'userdel: missing operand',isError:true};return{output:`userdel: user '${args[0]}' removed (simulated)`};},
    groupadd(args){if(!args.length)return{output:'groupadd: missing operand',isError:true};return{output:`groupadd: group '${args[0]}' created (simulated)`};},
    passwd(args){return{output:`passwd: password for ${args[0]||'user'} updated (simulated)`};},
    w(){return{output:' 00:02:00 up 0:02,  1 user,  load average: 0.01, 0.00, 0.00\nUSER     TTY      FROM             LOGIN@   IDLE   JCPU   PCPU WHAT\nuser     pts/0    10.0.0.5         00:01    0.00s  0.02s  0.00s llabs03'};},
    last(){return{output:'user     pts/0        10.0.0.5         Sat Mar 28 00:01   still logged in\nreboot   system boot  5.15.0-llabs03   Sat Mar 28 00:00   still running\n\nwtmp begins Sat Mar 28 00:00:00 2026'};},

    // ── Crypto/Encoding ──────────────────────────────────────────────────
    base64(args,stdin){
      const{flags,positional}=parseArgs(args);
      let content=stdin;
      if(positional.length){const r=FileSystem.readFile(positional[0]);if(r.error)return{output:`base64: ${r.error}`,isError:true};content=r.content;}
      if(!content)return{output:''};
      if(flags.has('d'))try{return{output:atob(content.trim())};}catch(e){return{output:'base64: invalid input',isError:true};}
      return{output:btoa(content)};
    },
    md5sum(args,stdin){
      let content=stdin;
      if(args.length){const r=FileSystem.readFile(args[0]);if(r.error)return{output:`md5sum: ${r.error}`,isError:true};content=r.content;}
      if(!content)return{output:''};
      const h=simpleHash(content)+simpleHash(content.slice(1))+simpleHash(content.slice(2))+simpleHash(content.slice(3));
      return{output:`${h.slice(0,32)}  ${args[0]||'-'}`};
    },
    sha256sum(args,stdin){
      let content=stdin;
      if(args.length){const r=FileSystem.readFile(args[0]);if(r.error)return{output:`sha256sum: ${r.error}`,isError:true};content=r.content;}
      if(!content)return{output:''};
      const h=simpleHash(content)+simpleHash(content+'a')+simpleHash(content+'b')+simpleHash(content+'c')+simpleHash(content+'d')+simpleHash(content+'e')+simpleHash(content+'f')+simpleHash(content+'g');
      return{output:`${h.slice(0,64)}  ${args[0]||'-'}`};
    },
    xxd(args,stdin){
      let content=stdin;
      if(args.length){const r=FileSystem.readFile(args[0]);if(r.error)return{output:`xxd: ${r.error}`,isError:true};content=r.content;}
      if(!content)return{output:''};
      const lines=[];
      for(let i=0;i<Math.min(content.length,256);i+=16){
        const hex=[],ascii=[];
        for(let j=0;j<16;j++){
          if(i+j<content.length){const c=content.charCodeAt(i+j);hex.push(c.toString(16).padStart(2,'0'));ascii.push(c>=32&&c<127?content[i+j]:'.');}
          else{hex.push('  ');ascii.push(' ');}
        }
        lines.push(`${i.toString(16).padStart(8,'0')}: ${hex.slice(0,8).join(' ')} ${hex.slice(8).join(' ')}  ${ascii.join('')}`);
      }
      return{output:lines.join('\n')};
    },

    // ── Block devices / kernel ────────────────────────────────────────────
    lsblk(){return{output:'NAME   MAJ:MIN RM  SIZE RO TYPE MOUNTPOINT\nsda      8:0    0   20G  0 disk\n├─sda1   8:1    0   18G  0 part /\n└─sda2   8:2    0    2G  0 part [SWAP]'};},
    dmesg(){const r=FileSystem.readFile('/var/log/kern.log');return r.error?{output:'dmesg: operation not permitted',isError:true}:{output:r.content.replace(/\n$/,'')};},

    // ── Tar (simulated) ──────────────────────────────────────────────────
    tar(args){
      const{flags}=parseArgs(args);
      if(flags.has('c'))return{output:'tar: archive created (simulated)'};
      if(flags.has('x'))return{output:'tar: archive extracted (simulated)'};
      if(flags.has('t'))return{output:'tar: listing not available in simulation'};
      return{output:'Usage: tar [-czf|-xzf|-t] <archive> [files...]'};
    },

    // ── Editor (simulated) ───────────────────────────────────────────────
    nano(args){
      if(!args.length)return{output:'nano: provide a filename. In this terminal, use:\n  echo "content" > file.txt\n  cat file.txt\nto create and view files.'};
      const f=args[0];
      const r=FileSystem.readFile(f);
      if(r.error){FileSystem.writeFile(f,'');return{output:`  GNU nano 6.2    New File: ${f}\n\n[Created new empty file. Use echo "text" > ${f} to write content]`};}
      return{output:`  GNU nano 6.2    File: ${f}\n\n${r.content.slice(0,500)}\n\n[ Use echo "text" > ${f} to overwrite, or echo "text" >> ${f} to append ]`};
    },

    // ── Sudo / su ────────────────────────────────────────────────────────
    sudo(args){
      if(!args.length)return{output:'usage: sudo <command>',isError:true};
      const subName=args[0],subArgs=args.slice(1);
      const resolved=Commands.resolveAlias(subName);
      if(resolved!==subName){const{name:rN,args:rA}=_tokenise(resolved);return cmds[rN]?cmds[rN].call(cmds,[...rA,...subArgs]):{output:`sudo: ${subName}: command not found`,isError:true};}
      const fn=cmds[subName];
      if(!fn)return{output:`sudo: ${subName}: command not found`,isError:true};
      return fn.call(cmds,subArgs);
    },
    su(){return{output:'root@llabs03:/# (simulated root shell)\nType "exit" to return to user shell.'};},
    exit(){return{output:'logout'};},

    sleep(args){return{output:`(sleep ${args[0]||'1'} — simulated)`};},
    test(){return{output:''};},

    help(){return{output:`Llabs03 — Interactive Linux Shell Simulator (v2)
════════════════════════════════════════════════════════

NAVIGATION
  pwd  ls [-laShrt]  cd [dir]  find  realpath  basename  dirname

FILE OPERATIONS
  touch  mkdir [-p]  rm [-rf]  rmdir  cp [-r]  mv  ln  chmod  chown  stat  file

FILE CONTENT
  cat [-n]  head [-n N]  tail [-n N]  echo [-ne]  nano  diff  tee

TEXT PROCESSING
  grep [-invrcl]  sed  awk [-F]  sort [-rnu]  uniq [-c]  wc [-lwc]
  cut [-d -f]  tr [-d]  rev  tac  seq  xargs

ENCODING / CRYPTO
  base64 [-d]  md5sum  sha256sum  xxd

NETWORK
  ping  curl [-I]  wget  ifconfig  ip [addr|route]  ss  netstat

PACKAGES
  apt [update|upgrade|install|list]  dpkg [-l]

SERVICES
  systemctl [status|start|stop|restart|enable|list-units]
  service <name> <action>

USERS & AUTH
  whoami  id  w  last  useradd  userdel  groupadd  passwd  sudo  su

SYSTEM
  ps [aux]  kill  env  export  printenv  uname [-a]  hostname
  date  uptime  df  free  du  mount  lsblk  dmesg

SHELL
  history  alias  unalias  which  type  man  clear  help  exit  sleep

TIPS
  ↑ ↓     command history          Tab    autocomplete
  Ctrl+C  cancel input             Ctrl+L clear screen
  |       pipe output              > >>   redirect to file
  ;       chain commands           cd -   previous directory`};
    },
  };

  function _tokenise(str){const tokens=[];let tok='',inQ=false,qc='';for(const ch of str){if(inQ){if(ch===qc)inQ=false;else tok+=ch;}else if(ch==='"'||ch==="'"){inQ=true;qc=ch;}else if(ch===' '){if(tok){tokens.push(tok);tok='';}}else tok+=ch;}if(tok)tokens.push(tok);return{name:tokens[0]||'',args:tokens.slice(1)};}

  return{
    addHistory(cmd){if(cmd.trim())cmdHistory.push(cmd);},
    getHistory(){return[...cmdHistory];},
    getAliases(){return aliases;},
    resolveAlias(name){return aliases[name]||name;},
    execute(name,args=[],stdin){
      const fn=cmds[name];
      if(!fn)return{output:`bash: ${name}: command not found`,isError:true};
      try{return fn.call(cmds,args,stdin)||{output:''};}
      catch(e){return{output:`${name}: error — ${e.message}`,isError:true};}
    }
  };
})();