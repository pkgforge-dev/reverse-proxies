- #### Simple Transparent (mostly) HTTP<-->HTTPS Proxy
> - Request any HTTPS URL using workers from a Dumb HTTP only Client
> ```bash
> #Use bash builtin to download arbitrary files
> function raw_http_get()
>  {
>   #Get Input
>    url=$1
>    port=${2:-80}
>   #Actually Verify we are in bash
>    is_bash=0
>    [[ -n "${BASH}" ]] && is_bash=1
>    if [[ $is_bash -eq 0 ]]; then
>      (shopt -p >/dev/null 2>&1) && is_bash=1
>    fi
>   #Proceed
>    if [ $is_bash -eq 1 ]; then
>     #Parse Input
>      url=${url#http://}
>      url=${url#https://}
>      host=${url%%/*}
>      if [[ "$url" = "$host" ]]; then
>        path="/"
>      else
>        path="/${url#$host/}"
>      fi
>     #Download
>      exec 3<>/dev/tcp/$host/$port
>      echo -e "GET $path HTTP/1.1\r\nHost: $host\r\nConnection: close\r\n\r\n" >&3
>      if command -v dd >/dev/null 2>&1; then
>         dd bs=1K <&3
>      elif command -v cat >/dev/null 2>&1; then    
>         cat <&3
>      fi
>      exec 3>&-
>    else
>      echo "Error: No method available to make HTTP requests. Requires Bash with /dev/tcp" >&2
>      return 1
>    fi
>  }
>
> #Example Download Soar
> raw_http_get "http://http.pkgforge.dev/https://github.com/pkgforge/soar/releases/latest/download/soar-x86_64-linux" > "./soar"
> #Remove HTTP Headers (Not needed if your client is smart to discard it)
> sed "1,/^\r\{0,1\}$/d" -i "./soar"
> #Run & Test it
> chmod +x "./soar" && "./soar" --help
> ```
