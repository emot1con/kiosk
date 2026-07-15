import http.server
import socketserver

class EchoHandler(http.server.BaseHTTPRequestHandler):
    def do_POST(self):
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b'OK')
        
    def do_GET(self):
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b'OK')

    def log_message(self, format, *args):
        # Matikan log agar tidak membebani terminal/CPU
        pass

if __name__ == "__main__":
    PORT = 8080
    with socketserver.TCPServer(("", PORT), EchoHandler) as httpd:
        print(f"Echo server jalan di port {PORT}...")
        httpd.serve_forever()
