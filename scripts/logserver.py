import http.server, json, time, sys
class H(http.server.BaseHTTPRequestHandler):
    def do_POST(self):
        n=int(self.headers.get('Content-Length',0)); body=self.rfile.read(n).decode(errors='ignore')
        line=time.strftime('%H:%M:%S')+' '+body
        print(line, flush=True); open(sys.argv[1],'a').write(line+'\n')
        self.send_response(204); self.send_header('Access-Control-Allow-Origin','*'); self.end_headers()
    def do_OPTIONS(self):
        self.send_response(204)
        for h,v in [('Access-Control-Allow-Origin','*'),('Access-Control-Allow-Headers','*'),('Access-Control-Allow-Methods','POST')]: self.send_header(h,v)
        self.end_headers()
    def log_message(self,*a): pass
http.server.ThreadingHTTPServer(('0.0.0.0',8899),H).serve_forever()
