/**
 * filesystem.js — Llabs03 v3
 * Full Linux virtual filesystem with realistic content.
 */
const FileSystem = (() => {
  const TYPE = { FILE: 'file', DIR: 'dir' };
  const F = (p,o,c) => ({type:TYPE.FILE,permissions:p||'-rw-r--r--',owner:o||'root',content:c||''});
  const D = (p,o,ch) => ({type:TYPE.DIR,permissions:p||'drwxr-xr-x',owner:o||'root',children:ch||{}});
  const BIN = (n) => F('-rwxr-xr-x','root','#!/bin/bash\n# ELF 64-bit LSB pie executable, x86-64');

  const initialTree = () => D('drwxr-xr-x','root',{
    home: D('drwxr-xr-x','root',{
      user: D('drwxr-xr-x','user',{
        '.bashrc':    F('-rw-r--r--','user','# ~/.bashrc\n[ -z "$PS1" ] && return\nalias ls=\'ls --color=auto\'\nalias ll=\'ls -la\'\nalias la=\'ls -a\'\nalias grep=\'grep --color=auto\'\nexport PS1=\'\\u@\\h:\\w\\$ \'\nexport EDITOR=nano\nexport HISTSIZE=1000\n'),
        '.profile':   F('-rw-r--r--','user','# ~/.profile\nif [ -n "$BASH_VERSION" ]; then\n  if [ -f "$HOME/.bashrc" ]; then\n    . "$HOME/.bashrc"\n  fi\nfi\nPATH="$HOME/bin:$PATH"\n'),
        '.bash_history': F('-rw-------','user','ls -la\ncd /etc\ncat /etc/passwd\nsudo apt update\nping 8.8.8.8\nss -tlnp\nsystemctl status ssh\ngrep -rn "error" /var/log/\nfind / -name "*.conf" -type f\nchmod 755 projects/hello.sh\n'),
        '.bash_logout': F('-rw-r--r--','user','# ~/.bash_logout\nclear\n'),
        '.ssh': D('drwx------','user',{
          'config':          F('-rw-r--r--','user','# SSH client config\nHost *\n  ServerAliveInterval 60\n  ServerAliveCountMax 3\n\nHost dev-server\n  HostName 10.0.0.100\n  User deploy\n  Port 2222\n  IdentityFile ~/.ssh/id_ed25519\n'),
          'authorized_keys': F('-rw-------','user','ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIExampleKeyHere user@llabs03\n'),
          'known_hosts':     F('-rw-r--r--','user','10.0.0.100 ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIServerKeyHere\ngithub.com ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGitHubKeyHere\n'),
        }),
        '.config': D('drwxr-xr-x','user',{
          'htop': D('drwxr-xr-x','user',{ 'htoprc': F('-rw-r--r--','user','# htop config\nfields=0 48 17 18 38 39 40 2 46 47 49 1\nsort_key=46\nsort_direction=1\nhide_threads=0\nhide_kernel_threads=1\n') }),
        }),
        Documents: D('drwxr-xr-x','user',{
          'readme.txt': F('-rw-r--r--','user','Welcome to Llabs03 Linux Terminal Sandbox!\n\nThis is a fully interactive Linux terminal simulation\nwith 70+ commands, a realistic filesystem, and three themes.\n\nTry: help, man <cmd>, ls -la /, cat /etc/passwd\n'),
          'notes.md': F('-rw-r--r--','user','# Study Notes\n\n## Linux Fundamentals\n- File permissions: rwx (read/write/execute)\n- User types: owner, group, others\n- chmod 755 = rwxr-xr-x\n- chmod 644 = rw-r--r--\n\n## Networking\n- TCP/IP model: Application, Transport, Internet, Link\n- Common ports: 22 (SSH), 80 (HTTP), 443 (HTTPS)\n- netstat / ss for socket inspection\n\n## Security\n- /etc/passwd — user accounts\n- /etc/shadow — hashed passwords\n- /etc/sudoers — sudo permissions\n- ssh-keygen -t ed25519 — generate SSH keys\n'),
        }),
        Downloads: D('drwxr-xr-x','user',{}),
        projects: D('drwxr-xr-x','user',{
          'hello.sh': F('-rwxr-xr-x','user','#!/bin/bash\n# Simple greeting script\necho "Hello from Llabs03!"\necho "Current user: $(whoami)"\necho "Working dir:  $(pwd)"\necho "Date:         $(date)"\nexit 0\n'),
          'data.csv': F('-rw-r--r--','user','id,name,role,department\n1,Alice,Engineer,Engineering\n2,Bob,Designer,Design\n3,Charlie,Manager,Engineering\n4,Diana,Analyst,Finance\n5,Eve,Security,InfoSec\n'),
          'config.json': F('-rw-r--r--','user','{\n  "name": "llabs03",\n  "version": "3.0.0",\n  "port": 8080,\n  "database": {\n    "host": "localhost",\n    "port": 5432,\n    "name": "llabs_db"\n  },\n  "features": {\n    "auth": true,\n    "logging": true,\n    "rateLimit": 100\n  }\n}\n'),
          'Makefile': F('-rw-r--r--','user','CC=gcc\nCFLAGS=-Wall -Wextra -O2\nTARGET=app\nSRCS=$(wildcard *.c)\nOBJS=$(SRCS:.c=.o)\n\nall: $(TARGET)\n\n$(TARGET): $(OBJS)\n\t$(CC) $(CFLAGS) -o $@ $^\n\n%.o: %.c\n\t$(CC) $(CFLAGS) -c $<\n\nclean:\n\trm -f $(OBJS) $(TARGET)\n\n.PHONY: all clean\n'),
          'server.py': F('-rw-r--r--','user','#!/usr/bin/env python3\n"""Simple HTTP server example"""\nimport http.server\nimport socketserver\n\nPORT = 8080\n\nclass Handler(http.server.SimpleHTTPRequestHandler):\n    pass\n\nwith socketserver.TCPServer(("", PORT), Handler) as httpd:\n    print(f"Serving on port {PORT}")\n    httpd.serve_forever()\n'),
        }),
      })
    }),
    root: D('drwx------','root',{
      '.bashrc': F('-rw-r--r--','root','# /root/.bashrc\nexport PS1=\'\\[\\033[01;31m\\]root@\\h\\[\\033[00m\\]:\\[\\033[01;34m\\]\\w\\[\\033[00m\\]\\# \'\nalias ls=\'ls --color=auto\'\nalias ll=\'ls -la\'\n'),
      '.profile': F('-rw-r--r--','root','# /root/.profile\nif [ -f "$HOME/.bashrc" ]; then . "$HOME/.bashrc"; fi\n'),
    }),

    etc: D('drwxr-xr-x','root',{
      passwd:       F('-rw-r--r--','root','root:x:0:0:root:/root:/bin/bash\ndaemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin\nbin:x:2:2:bin:/bin:/usr/sbin/nologin\nsys:x:3:3:sys:/dev:/usr/sbin/nologin\nsync:x:4:65534:sync:/bin:/bin/sync\ngames:x:5:60:games:/usr/games:/usr/sbin/nologin\nman:x:6:12:man:/var/cache/man:/usr/sbin/nologin\nwww-data:x:33:33:www-data:/var/www:/usr/sbin/nologin\nnobody:x:65534:65534:nobody:/nonexistent:/usr/sbin/nologin\nsshd:x:100:65534::/run/sshd:/usr/sbin/nologin\nuser:x:1000:1000:user:/home/user:/bin/bash\n'),
      shadow:       F('-rw-r-----','root','root:$6$rounds=4096$xYz3Abc$hashed_pw_root:19811:0:99999:7:::\ndaemon:*:19811:0:99999:7:::\nbin:*:19811:0:99999:7:::\nsys:*:19811:0:99999:7:::\nuser:$6$rounds=4096$qRs7Tuv$hashed_pw_user:19811:0:99999:7:::\n'),
      group:        F('-rw-r--r--','root','root:x:0:\ndaemon:x:1:\nbin:x:2:\nsys:x:3:\nadm:x:4:user\ntty:x:5:\ndisk:x:6:\ncdrom:x:24:user\nsudo:x:27:user\nwww-data:x:33:\nstaff:x:50:\nuser:x:1000:\n'),
      hostname:     F('-rw-r--r--','root','llabs03\n'),
      hosts:        F('-rw-r--r--','root','127.0.0.1\tlocalhost\n127.0.1.1\tllabs03\n::1\t\tlocalhost ip6-localhost ip6-loopback\nff02::1\t\tip6-allnodes\nff02::2\t\tip6-allrouters\n'),
      'resolv.conf': F('-rw-r--r--','root','# Generated by systemd-resolved\nnameserver 8.8.8.8\nnameserver 8.8.4.4\nnameserver 1.1.1.1\nsearch localdomain\n'),
      fstab:        F('-rw-r--r--','root','# /etc/fstab: static file system information.\n# <file system>  <mount point>  <type>  <options>         <dump>  <pass>\nUUID=a1b2c3d4    /              ext4    errors=remount-ro  0       1\nUUID=e5f6a7b8    none           swap    sw                 0       0\ntmpfs            /tmp           tmpfs   defaults,noatime   0       0\n/dev/sr0         /media/cdrom0  udf,iso9660 user,noauto    0       0\n'),
      'os-release': F('-rw-r--r--','root','NAME="Llabs Linux"\nVERSION="03"\nID=llabs\nID_LIKE=debian ubuntu\nVERSION_ID=03\nPRETTY_NAME="Llabs Linux 03 (Jammy)"\nHOME_URL="https://llabs03.dev"\nSUPPORT_URL="https://llabs03.dev/support"\nBUG_REPORT_URL="https://llabs03.dev/bugs"\nVERSION_CODENAME=jammy\n'),
      'bash.bashrc': F('-rw-r--r--','root','# System-wide .bashrc for interactive bash shells.\n[ -z "$PS1" ] && return\nshopt -s checkwinsize\nshopt -s histappend\nHISTSIZE=1000\nHISTFILESIZE=2000\nalias ls=\'ls --color=auto\'\nalias ll=\'ls -la\'\nalias la=\'ls -a\'\nalias grep=\'grep --color=auto\'\n'),
      profile:      F('-rw-r--r--','root','# /etc/profile: system-wide .profile\nif [ -d /etc/profile.d ]; then\n  for i in /etc/profile.d/*.sh; do\n    [ -r "$i" ] && . "$i"\n  done\n  unset i\nfi\n'),
      environment:  F('-rw-r--r--','root','PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"\n'),
      timezone:     F('-rw-r--r--','root','Etc/UTC\n'),
      shells:       F('-rw-r--r--','root','/bin/sh\n/bin/bash\n/usr/bin/bash\n/bin/dash\n'),
      'login.defs': F('-rw-r--r--','root','# /etc/login.defs\nMAIL_DIR        /var/mail\nPASS_MAX_DAYS   99999\nPASS_MIN_DAYS   0\nPASS_WARN_AGE   7\nUID_MIN         1000\nUID_MAX         60000\nGID_MIN         1000\nGID_MAX         60000\nENCRYPT_METHOD  SHA512\n'),
      motd:         F('-rw-r--r--','root','  _     _       _         ___  ____\n | |   | | __ _| |__  ___/ _ \\|___ \\\n | |   | |/ _` | \'_ \\/ __| | | |__) |\n | |___| | (_| | |_) \\__ \\ |_| / __/\n |_____|_|\\__,_|_.__/|___/\\___/_____|\n\n Welcome to Llabs Linux 03 (GNU/Linux 5.15.0-llabs03 x86_64)\n\n  System load:  0.01\n  Memory usage: 25%\n  Swap usage:   0%\n  Processes:    98\n  Users:        1\n\n Last login: Sat Mar 28 00:01:22 2026 from 10.0.0.5\n'),
      apt: D('drwxr-xr-x','root',{
        'sources.list': F('-rw-r--r--','root','deb http://archive.ubuntu.com/ubuntu jammy main restricted universe multiverse\ndeb http://archive.ubuntu.com/ubuntu jammy-updates main restricted universe multiverse\ndeb http://security.ubuntu.com/ubuntu jammy-security main restricted universe multiverse\ndeb http://archive.ubuntu.com/ubuntu jammy-backports main restricted universe multiverse\n'),
      }),
      ssh: D('drwxr-xr-x','root',{
        'sshd_config': F('-rw-r--r--','root','# OpenSSH server configuration — /etc/ssh/sshd_config\nPort 22\nAddressFamily any\nListenAddress 0.0.0.0\nListenAddress ::\n\nPermitRootLogin no\nPubkeyAuthentication yes\nPasswordAuthentication yes\nPermitEmptyPasswords no\nChallengeResponseAuthentication no\nUsePAM yes\nX11Forwarding no\nPrintMotd yes\nAcceptEnv LANG LC_*\nSubsystem sftp /usr/lib/openssh/sftp-server\nMaxAuthTries 3\nMaxSessions 10\nClientAliveInterval 120\nClientAliveCountMax 3\n'),
        'ssh_config': F('-rw-r--r--','root','# OpenSSH client config\nHost *\n  SendEnv LANG LC_*\n  HashKnownHosts yes\n'),
      }),
      crontab:      F('-rw-r--r--','root','# /etc/crontab: system-wide crontab\nSHELL=/bin/bash\nPATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin\n\n# m h dom mon dow user  command\n17 *\t* * *\troot\tcd / && run-parts --report /etc/cron.hourly\n25 6\t* * *\troot\ttest -x /usr/sbin/anacron || run-parts --report /etc/cron.daily\n47 6\t* * 7\troot\ttest -x /usr/sbin/anacron || run-parts --report /etc/cron.weekly\n52 6\t1 * *\troot\ttest -x /usr/sbin/anacron || run-parts --report /etc/cron.monthly\n'),
      sudoers:      F('-r--r-----','root','# /etc/sudoers — MUST be edited with visudo\nDefaults\tenv_reset\nDefaults\tmail_badpass\nDefaults\tsecure_path="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"\nDefaults\tlogfile="/var/log/sudo.log"\n\nroot\tALL=(ALL:ALL) ALL\n%admin\tALL=(ALL) ALL\n%sudo\tALL=(ALL:ALL) ALL\nuser\tALL=(ALL) NOPASSWD:ALL\n'),
      network: D('drwxr-xr-x','root',{
        interfaces: F('-rw-r--r--','root','# /etc/network/interfaces\nauto lo\niface lo inet loopback\n\nauto eth0\niface eth0 inet dhcp\n'),
      }),
      nginx: D('drwxr-xr-x','root',{
        'nginx.conf': F('-rw-r--r--','root','user www-data;\nworker_processes auto;\npid /run/nginx.pid;\n\nevents {\n    worker_connections 768;\n}\n\nhttp {\n    sendfile on;\n    tcp_nopush on;\n    types_hash_max_size 2048;\n    include /etc/nginx/mime.types;\n    default_type application/octet-stream;\n    access_log /var/log/nginx/access.log;\n    error_log /var/log/nginx/error.log;\n    gzip on;\n    include /etc/nginx/conf.d/*.conf;\n    include /etc/nginx/sites-enabled/*;\n}\n'),
      }),
      systemd: D('drwxr-xr-x','root',{
        system: D('drwxr-xr-x','root',{}),
      }),
    }),

    tmp: D('drwxrwxrwx','root',{}),

    bin: D('drwxr-xr-x','root',{
      bash:BIN(),ls:BIN(),cat:BIN(),grep:BIN(),mkdir:BIN(),rm:BIN(),cp:BIN(),mv:BIN(),
      echo:BIN(),chmod:BIN(),chown:BIN(),touch:BIN(),head:BIN(),tail:BIN(),
      sort:BIN(),uniq:BIN(),wc:BIN(),cut:BIN(),tr:BIN(),sed:BIN(),
      find:BIN(),diff:BIN(),date:BIN(),hostname:BIN(),uname:BIN(),
      ps:BIN(),kill:BIN(),df:BIN(),du:BIN(),mount:BIN(),
      ping:BIN(),login:BIN(),su:BIN(),
      sudo: F('-rwsr-xr-x','root','#!/bin/bash\n# SUID binary'),
      dash: BIN(), sh: BIN(),
    }),
    sbin: D('drwxr-xr-x','root',{
      init:BIN(),iptables:BIN(),fdisk:BIN(),mkfs:BIN(),reboot:BIN(),shutdown:BIN(),
      ifconfig:BIN(),route:BIN(),
    }),

    usr: D('drwxr-xr-x','root',{
      bin: D('drwxr-xr-x','root',{
        awk:BIN(),curl:BIN(),wget:BIN(),nano:BIN(),vim:BIN(),git:BIN(),
        less:BIN(),more:BIN(),tee:BIN(),xargs:BIN(),tar:BIN(),gzip:BIN(),
        ssh:BIN(),scp:BIN(),base64:BIN(),md5sum:BIN(),sha256sum:BIN(),
        xxd:BIN(),seq:BIN(),rev:BIN(),tac:BIN(),realpath:BIN(),
        python3:BIN(),pip3:BIN(),node:BIN(),npm:BIN(),
        htop:BIN(),top:BIN(),
      }),
      sbin: D('drwxr-xr-x','root',{
        sshd:BIN(),nginx:BIN(),cron:BIN(),rsyslogd:BIN(),
        useradd:BIN(),userdel:BIN(),groupadd:BIN(),
        update_alternatives:BIN(),
      }),
      lib: D('drwxr-xr-x','root',{
        'openssh': D('drwxr-xr-x','root',{ 'sftp-server': BIN() }),
      }),
      share: D('drwxr-xr-x','root',{
        man: D('drwxr-xr-x','root',{}),
        doc: D('drwxr-xr-x','root',{}),
        nginx: D('drwxr-xr-x','root',{
          html: D('drwxr-xr-x','root',{
            'index.html': F('-rw-r--r--','root','<!DOCTYPE html>\n<html><head><title>Welcome to nginx!</title></head>\n<body><h1>Welcome to nginx!</h1>\n<p>If you see this page, the nginx web server is installed.</p>\n</body></html>\n'),
          }),
        }),
      }),
      local: D('drwxr-xr-x','root',{
        bin: D('drwxr-xr-x','root',{}),
        lib: D('drwxr-xr-x','root',{}),
        share: D('drwxr-xr-x','root',{}),
      }),
    }),

    var: D('drwxr-xr-x','root',{
      log: D('drwxr-xr-x','root',{
        syslog:     F('-rw-r-----','root','Mar 28 00:00:01 llabs03 systemd[1]: Starting system activity accounting tool...\nMar 28 00:00:01 llabs03 kernel: [    0.000000] Linux version 5.15.0-llabs03 (gcc 11.4.0)\nMar 28 00:00:02 llabs03 kernel: [    0.100000] Memory: 2048000K/2097152K available\nMar 28 00:00:02 llabs03 systemd[1]: Started Journal Service.\nMar 28 00:00:02 llabs03 systemd[1]: Started OpenSSH Server.\nMar 28 00:00:03 llabs03 systemd[1]: Started cron daemon.\nMar 28 00:00:03 llabs03 sshd[100]: Server listening on 0.0.0.0 port 22.\nMar 28 00:00:03 llabs03 sshd[100]: Server listening on :: port 22.\nMar 28 00:00:05 llabs03 systemd[1]: Reached target Multi-User System.\nMar 28 00:01:00 llabs03 CRON[201]: (root) CMD (cd / && run-parts --report /etc/cron.hourly)\nMar 28 00:01:22 llabs03 sshd[302]: Accepted publickey for user from 10.0.0.5 port 52200 ssh2\nMar 28 00:01:22 llabs03 systemd-logind[80]: New session 1 of user user.\nMar 28 00:02:00 llabs03 login[1000]: pam_unix(login:session): session opened for user user(uid=1000)\n'),
        'auth.log': F('-rw-r-----','root','Mar 28 00:00:03 llabs03 sshd[100]: Server listening on 0.0.0.0 port 22.\nMar 28 00:00:45 llabs03 sshd[280]: Invalid user admin from 192.168.1.50 port 45322\nMar 28 00:00:45 llabs03 sshd[280]: pam_unix(sshd:auth): authentication failure; rhost=192.168.1.50\nMar 28 00:00:47 llabs03 sshd[280]: Failed password for invalid user admin from 192.168.1.50 port 45322 ssh2\nMar 28 00:00:52 llabs03 sshd[282]: Invalid user test from 192.168.1.50 port 45330\nMar 28 00:00:54 llabs03 sshd[282]: Failed password for invalid user test from 192.168.1.50 port 45330 ssh2\nMar 28 00:01:22 llabs03 sshd[302]: Accepted publickey for user from 10.0.0.5 port 52200 ssh2\nMar 28 00:01:22 llabs03 sshd[302]: pam_unix(sshd:session): session opened for user user(uid=1000)\nMar 28 00:02:00 llabs03 sudo:    user : TTY=pts/0 ; PWD=/home/user ; USER=root ; COMMAND=/usr/bin/apt update\n'),
        'kern.log': F('-rw-r-----','root','Mar 28 00:00:01 llabs03 kernel: [    0.000000] Linux version 5.15.0-llabs03 (gcc 11.4.0)\nMar 28 00:00:01 llabs03 kernel: [    0.000000] Command line: BOOT_IMAGE=/vmlinuz-5.15.0 root=UUID=a1b2c3d4 ro quiet splash\nMar 28 00:00:01 llabs03 kernel: [    0.000000] x86/fpu: x87 FPU on chip\nMar 28 00:00:01 llabs03 kernel: [    0.100000] Detected 2 CPU cores\nMar 28 00:00:01 llabs03 kernel: [    0.150000] ACPI: RSDP 0x00000000000E0000\nMar 28 00:00:01 llabs03 kernel: [    0.200000] NET: Registered PF_INET protocol family\nMar 28 00:00:02 llabs03 kernel: [    0.350000] NET: Registered PF_INET6 protocol family\nMar 28 00:00:02 llabs03 kernel: [    0.500000] EXT4-fs (sda1): mounted filesystem with ordered data mode. Quota mode: none.\nMar 28 00:00:02 llabs03 kernel: [    0.600000] audit: initializing netlink subsys (disabled)\n'),
        'dpkg.log': F('-rw-r--r--','root','2026-03-27 23:45:01 startup packages configure\n2026-03-27 23:45:02 configure base-files:amd64 12ubuntu4.4\n2026-03-27 23:45:03 status installed base-files:amd64 12ubuntu4.4\n2026-03-27 23:50:01 install openssh-server:amd64 1:8.9p1-3ubuntu0.6\n2026-03-27 23:50:02 configure openssh-server:amd64 1:8.9p1-3ubuntu0.6\n2026-03-27 23:50:03 status installed openssh-server:amd64 1:8.9p1-3ubuntu0.6\n2026-03-27 23:55:01 install vim:amd64 2:8.2.3995-1ubuntu2.15\n2026-03-27 23:55:02 status installed vim:amd64 2:8.2.3995-1ubuntu2.15\n2026-03-27 23:56:01 install nginx:amd64 1.18.0-6ubuntu14.4\n2026-03-27 23:56:02 status installed nginx:amd64 1.18.0-6ubuntu14.4\n'),
        'sudo.log':  F('-rw-r-----','root','Mar 28 00:02:00 : user : TTY=pts/0 ; PWD=/home/user ; USER=root ; COMMAND=/usr/bin/apt update\n'),
        'lastlog':   F('-rw-r--r--','root',''),
        'wtmp':      F('-rw-r--r--','root',''),
        nginx: D('drwxr-xr-x','root',{
          'access.log': F('-rw-r--r--','root','10.0.0.5 - - [28/Mar/2026:00:01:30 +0000] "GET / HTTP/1.1" 200 612 "-" "Mozilla/5.0"\n10.0.0.5 - - [28/Mar/2026:00:01:31 +0000] "GET /favicon.ico HTTP/1.1" 404 196 "-" "Mozilla/5.0"\n'),
          'error.log':  F('-rw-r--r--','root','2026/03/28 00:01:31 [error] 151#151: *2 open() "/usr/share/nginx/html/favicon.ico" failed (2: No such file or directory)\n'),
        }),
      }),
      cache: D('drwxr-xr-x','root',{
        apt: D('drwxr-xr-x','root',{ archives: D('drwxr-xr-x','root',{}) }),
      }),
      mail: D('drwxrwxr-x','root',{}),
      spool: D('drwxr-xr-x','root',{ cron: D('drwxr-xr-x','root',{}) }),
      tmp: D('drwxrwxrwt','root',{}),
      run: D('drwxr-xr-x','root',{
        'sshd.pid': F('-rw-r--r--','root','100\n'),
        'nginx.pid': F('-rw-r--r--','root','150\n'),
      }),
      www: D('drwxr-xr-x','root',{
        html: D('drwxr-xr-x','root',{
          'index.html': F('-rw-r--r--','root','<!DOCTYPE html>\n<html>\n<head><title>Welcome to Llabs03</title></head>\n<body>\n<h1>It works!</h1>\n<p>The web server is running on Llabs03.</p>\n</body>\n</html>\n'),
        }),
      }),
    }),

    dev: D('drwxr-xr-x','root',{
      null:    F('crw-rw-rw-','root',''),
      zero:    F('crw-rw-rw-','root',''),
      random:  F('crw-rw-rw-','root',''),
      urandom: F('crw-rw-rw-','root',''),
      tty:     F('crw-rw-rw-','root',''),
      stdin:   F('lrwxrwxrwx','root','-> /proc/self/fd/0\n'),
      stdout:  F('lrwxrwxrwx','root','-> /proc/self/fd/1\n'),
      stderr:  F('lrwxrwxrwx','root','-> /proc/self/fd/2\n'),
      sda:     F('brw-rw----','root',''),
      sda1:    F('brw-rw----','root',''),
      sda2:    F('brw-rw----','root',''),
    }),

    proc: D('dr-xr-xr-x','root',{
      cpuinfo:  F('-r--r--r--','root','processor\t: 0\nvendor_id\t: GenuineIntel\ncpu family\t: 6\nmodel\t\t: 142\nmodel name\t: Intel(R) Core(TM) i7-8550U CPU @ 1.80GHz\nstepping\t: 10\ncpu MHz\t\t: 1800.000\ncache size\t: 8192 KB\nphysical id\t: 0\ncpu cores\t: 4\nbogomips\t: 3600.00\nflags\t\t: fpu vme de pse tsc msr pae mce cx8 apic sep mtrr pge mca cmov pat pse36 clflush mmx fxsr sse sse2 ht syscall nx pdpe1gb rdtscp lm\n\nprocessor\t: 1\nvendor_id\t: GenuineIntel\ncpu family\t: 6\nmodel name\t: Intel(R) Core(TM) i7-8550U CPU @ 1.80GHz\ncpu cores\t: 4\n'),
      meminfo:  F('-r--r--r--','root','MemTotal:        2048000 kB\nMemFree:          819200 kB\nMemAvailable:    1228800 kB\nBuffers:           65536 kB\nCached:           651264 kB\nSwapCached:            0 kB\nActive:           512000 kB\nInactive:         409600 kB\nSwapTotal:       1024000 kB\nSwapFree:        1024000 kB\nCommitted_AS:     307200 kB\n'),
      version:  F('-r--r--r--','root','Linux version 5.15.0-llabs03 (gcc (Ubuntu 11.4.0-1ubuntu1~22.04) 11.4.0) #1 SMP Sat Mar 28 00:00:00 UTC 2026\n'),
      uptime:   F('-r--r--r--','root','120.50 235.80\n'),
      loadavg:  F('-r--r--r--','root','0.01 0.00 0.00 1/98 1001\n'),
      filesystems: F('-r--r--r--','root','\text4\n\tvfat\n\tiso9660\n\ttmpfs\nnodev\tproc\nnodev\tsysfs\nnodev\tdevtmpfs\nnodev\tcgroup2\n'),
      mounts:   F('-r--r--r--','root','/dev/sda1 / ext4 rw,relatime 0 0\ntmpfs /tmp tmpfs rw,nosuid,nodev 0 0\nproc /proc proc rw,nosuid,nodev,noexec 0 0\nsysfs /sys sysfs rw,nosuid,nodev,noexec 0 0\ndevtmpfs /dev devtmpfs rw,nosuid,size=1024000k 0 0\ncgroup2 /sys/fs/cgroup cgroup2 rw,nosuid,nodev,noexec 0 0\n'),
      stat:     F('-r--r--r--','root','cpu  1000 50 800 50000 200 0 100 0 0 0\ncpu0 500 25 400 25000 100 0 50 0 0 0\ncpu1 500 25 400 25000 100 0 50 0 0 0\nprocesses 1523\nprocs_running 1\nprocs_blocked 0\n'),
      net: D('dr-xr-xr-x','root',{
        dev: F('-r--r--r--','root','Inter-|   Receive                                  |  Transmit\n face |bytes    packets errs drop fifo frame compressed multicast|bytes    packets errs drop fifo colls carrier compressed\n    lo:  123456    1234    0    0    0     0          0         0   123456    1234    0    0    0     0       0          0\n  eth0: 9876543   54321    0    0    0     0          0         0  5432100   32100    0    0    0     0       0          0\n'),
      }),
      sys: D('dr-xr-xr-x','root',{
        kernel: D('dr-xr-xr-x','root',{
          hostname: F('-rw-r--r--','root','llabs03\n'),
          osrelease: F('-r--r--r--','root','5.15.0-llabs03\n'),
        }),
      }),
    }),

    boot: D('drwxr-xr-x','root',{
      'vmlinuz-5.15.0-llabs03': F('-rw-r--r--','root','[kernel image binary data]'),
      'initrd.img-5.15.0-llabs03': F('-rw-r--r--','root','[initramfs binary data]'),
      grub: D('drwxr-xr-x','root',{
        'grub.cfg': F('-rw-r--r--','root','# GRUB configuration\nset default=0\nset timeout=5\n\nmenuentry "Llabs Linux 03" {\n  linux /vmlinuz-5.15.0-llabs03 root=UUID=a1b2c3d4 ro quiet splash\n  initrd /initrd.img-5.15.0-llabs03\n}\n'),
      }),
    }),

    sys: D('dr-xr-xr-x','root',{
      'class': D('dr-xr-xr-x','root',{ net: D('dr-xr-xr-x','root',{}) }),
      fs: D('dr-xr-xr-x','root',{ cgroup: D('dr-xr-xr-x','root',{}) }),
    }),

    run: D('drwxr-xr-x','root',{
      lock: D('drwxr-xr-x','root',{}),
      'utmp': F('-rw-rw-r--','root',''),
    }),

    lib: D('drwxr-xr-x','root',{
      systemd: D('drwxr-xr-x','root',{ system: D('drwxr-xr-x','root',{}) }),
      modules: D('drwxr-xr-x','root',{}),
      firmware: D('drwxr-xr-x','root',{}),
    }),
    lib64: D('drwxr-xr-x','root',{}),

    mnt:   D('drwxr-xr-x','root',{}),
    opt:   D('drwxr-xr-x','root',{}),
    srv:   D('drwxr-xr-x','root',{}),
    media: D('drwxr-xr-x','root',{ cdrom0: D('drwxr-xr-x','root',{}) }),
  });

  let root = initialTree();
  let cwd  = '/home/user';
  let _OLDPWD = '/home/user';

  // ── Path resolution ──────────────────────────────────
  function resolve(path) {
    if (path === '-') return _OLDPWD || cwd;
    if (!path || path === '~')  return '/home/user';
    if (path.startsWith('~/')) path = '/home/user/' + path.slice(2);
    if (!path.startsWith('/')) path = cwd.replace(/\/$/, '') + '/' + path;
    const parts = path.split('/').filter(Boolean);
    const out = [];
    for (const p of parts) {
      if (p === '.')  continue;
      if (p === '..') { out.pop(); continue; }
      out.push(p);
    }
    return '/' + out.join('/');
  }

  function getNode(absPath) {
    if (absPath === '/') return root;
    const parts = absPath.split('/').filter(Boolean);
    let node = root;
    for (const p of parts) {
      if (!node || node.type !== TYPE.DIR || !node.children[p]) return null;
      node = node.children[p];
    }
    return node;
  }

  function getParent(absPath) {
    const parts = absPath.split('/').filter(Boolean);
    const name = parts.pop();
    let node = root;
    for (const p of parts) {
      if (!node || node.type !== TYPE.DIR || !node.children[p]) return { parent: null, name };
      node = node.children[p];
    }
    return { parent: node, name };
  }

  function deepClone(node) { return JSON.parse(JSON.stringify(node)); }

  function totalSize(node) {
    if (!node) return 0;
    if (node.type === TYPE.FILE) return (node.content || '').length || 4096;
    let s = 4096;
    if (node.children) Object.values(node.children).forEach(c => s += totalSize(c));
    return s;
  }

  // ── Public API ───────────────────────────────────────
  return {
    resolve, getNode, totalSize,

    getCwd() { return cwd; },

    listDir(path) {
      const abs = resolve(path || cwd);
      const node = getNode(abs);
      if (!node) return { error: `ls: cannot access '${path||cwd}': No such file or directory` };
      if (node.type !== TYPE.DIR) return { entries: { [abs.split('/').pop()]: node } };
      return { entries: node.children };
    },

    changeDir(path) {
      const abs = resolve(path != null ? path : '~');
      const node = getNode(abs);
      if (!node) return { error: `bash: cd: ${path}: No such file or directory` };
      if (node.type !== TYPE.DIR) return { error: `bash: cd: ${path}: Not a directory` };
      const old = cwd;
      _OLDPWD = cwd;
      cwd = abs;
      return { ok: true, oldPwd: old };
    },

    mkdir(path, parents) {
      if (parents) {
        const abs = resolve(path);
        const parts = abs.split('/').filter(Boolean);
        let node = root, built = '';
        for (const p of parts) {
          built += '/' + p;
          if (!node.children[p]) {
            node.children[p] = D('drwxr-xr-x','user',{});
          } else if (node.children[p].type !== TYPE.DIR) {
            return { error: `mkdir: cannot create directory '${path}': Not a directory` };
          }
          node = node.children[p];
        }
        return { ok: true };
      }
      const abs = resolve(path);
      if (getNode(abs)) return { error: `mkdir: cannot create directory '${path}': File exists` };
      const { parent, name } = getParent(abs);
      if (!parent || parent.type !== TYPE.DIR)
        return { error: `mkdir: cannot create directory '${path}': No such file or directory` };
      parent.children[name] = D('drwxr-xr-x','user',{});
      return { ok: true };
    },

    rmdir(path) {
      const abs = resolve(path), node = getNode(abs);
      if (!node)                  return { error: `rmdir: failed to remove '${path}': No such file or directory` };
      if (node.type !== TYPE.DIR) return { error: `rmdir: failed to remove '${path}': Not a directory` };
      if (Object.keys(node.children).length > 0)
        return { error: `rmdir: failed to remove '${path}': Directory not empty` };
      const { parent, name } = getParent(abs);
      delete parent.children[name]; return { ok: true };
    },

    touch(path) {
      const abs = resolve(path);
      if (getNode(abs)) return { ok: true };
      const { parent, name } = getParent(abs);
      if (!parent || parent.type !== TYPE.DIR)
        return { error: `touch: cannot touch '${path}': No such file or directory` };
      parent.children[name] = F('-rw-r--r--','user','');
      return { ok: true };
    },

    readFile(path) {
      const abs = resolve(path), node = getNode(abs);
      if (!node)                  return { error: `${path}: No such file or directory` };
      if (node.type === TYPE.DIR) return { error: `${path}: Is a directory` };
      return { content: node.content || '' };
    },

    writeFile(path, content, append) {
      const abs = resolve(path);
      let node = getNode(abs);
      if (!node) {
        const { parent, name } = getParent(abs);
        if (!parent || parent.type !== TYPE.DIR) return { error: `No such file or directory` };
        parent.children[name] = F('-rw-r--r--','user','');
        node = parent.children[name];
      }
      if (node.type === TYPE.DIR) return { error: `Is a directory` };
      node.content = append ? (node.content || '') + content : content;
      return { ok: true };
    },

    remove(path, recursive) {
      const abs = resolve(path);
      if (abs === '/' || abs === '/home/user') return { error: `rm: refusing to remove root or home` };
      const node = getNode(abs);
      if (!node) return { error: `rm: cannot remove '${path}': No such file or directory` };
      if (node.type === TYPE.DIR && !recursive)
        return { error: `rm: cannot remove '${path}': Is a directory` };
      const { parent, name } = getParent(abs);
      delete parent.children[name]; return { ok: true };
    },

    copy(src, dest, recursive) {
      const srcAbs = resolve(src), srcNode = getNode(srcAbs);
      if (!srcNode) return { error: `cp: cannot stat '${src}': No such file or directory` };
      if (srcNode.type === TYPE.DIR && !recursive)
        return { error: `cp: -r not specified; omitting directory '${src}'` };
      const destAbs = resolve(dest), destNode = getNode(destAbs);
      let targetPath = destAbs;
      if (destNode && destNode.type === TYPE.DIR)
        targetPath = destAbs.replace(/\/$/, '') + '/' + srcAbs.split('/').pop();
      const { parent, name } = getParent(targetPath);
      if (!parent) return { error: `cp: cannot create '${dest}': No such file or directory` };
      parent.children[name] = deepClone(srcNode);
      return { ok: true };
    },

    move(src, dest) {
      const r = this.copy(src, dest, true);
      if (r.error) return { error: r.error.replace('cp:', 'mv:') };
      this.remove(src, true); return { ok: true };
    },

    chmod(mode, path) {
      const abs = resolve(path), node = getNode(abs);
      if (!node) return { error: `chmod: cannot access '${path}': No such file or directory` };
      if (/^\d{3,4}$/.test(mode)) {
        const digits = mode.length === 4 ? mode.slice(1) : mode;
        const prefix = node.type === TYPE.DIR ? 'd' : '-';
        const perms = digits.split('').map(Number).map(d =>
          (d & 4 ? 'r' : '-') + (d & 2 ? 'w' : '-') + (d & 1 ? 'x' : '-')
        ).join('');
        node.permissions = prefix + perms; return { ok: true };
      }
      return { error: `chmod: invalid mode: '${mode}'` };
    },

    chown(ownerStr, path) {
      const abs = resolve(path), node = getNode(abs);
      if (!node) return { error: `chown: cannot access '${path}': No such file or directory` };
      const owner = ownerStr.split(':')[0] || node.owner;
      node.owner = owner;
      return { ok: true };
    },

    stat(path) {
      const abs = resolve(path), node = getNode(abs);
      if (!node) return { error: `stat: cannot stat '${path}': No such file or directory` };
      return {
        path: abs,
        type: node.type,
        size: node.type === TYPE.FILE ? (node.content || '').length : 4096,
        permissions: node.permissions,
        owner: node.owner,
      };
    },

    getCompletions(partial) {
      const lastSlash = partial.lastIndexOf('/');
      let dirPath, prefix;
      if (lastSlash === -1) { dirPath = cwd; prefix = partial; }
      else { dirPath = resolve(partial.slice(0, lastSlash) || '/'); prefix = partial.slice(lastSlash + 1); }
      const node = getNode(dirPath);
      if (!node || node.type !== TYPE.DIR) return [];
      return Object.keys(node.children)
        .filter(k => k.startsWith(prefix))
        .map(k => {
          const base = lastSlash === -1 ? '' : partial.slice(0, lastSlash + 1);
          return base + k + (node.children[k].type === TYPE.DIR ? '/' : '');
        });
    },

    reset() { root = initialTree(); cwd = '/home/user'; _OLDPWD = '/home/user'; }
  };
})();