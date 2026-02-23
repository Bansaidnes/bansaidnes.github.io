import json
import os
import requests
import xmlrpc.client
import ssl
from flask import Flask, request, abort, render_template, send_from_directory, jsonify
from werkzeug.middleware.proxy_fix import ProxyFix

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
app = Flask(
    __name__,
    static_folder=os.path.join(BASE_DIR, 'static'),
    template_folder=os.path.join(BASE_DIR, 'templates')
)

app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=1)

OVPN_RPC_URL = "https://cws.bansaidn.es/RPC2"
OVPN_ADMIN_USER = os.environ.get('OVPN_ADMIN_USER', 'openvpn') 
OVPN_ADMIN_PASS = os.environ.get('OVPN_ADMIN_PASS', 'Daniah2905!')

@app.context_processor
def inject_active_page():
    return dict(active_page=None)

@app.route('/')
def root():
    return render_template('home.html', active_page='home')

@app.route('/uploadclip/')
@app.route('/uploadclip/index.html')
def upload_clip():
    return render_template('upload.html', active_page='upload')

@app.route('/UrlShortener/')
@app.route('/UrlShortener/index.html')
def url_shortener():
    return render_template('shortener.html', active_page='shortener')

@app.route('/vpn/')
@app.route('/vpn/index.html')
def vpn_signup_page():
    return render_template('vpn_signup.html', active_page='vpn')

@app.route('/api/create_vpn_user', methods=['POST'])
def create_vpn_user():
    data = request.get_json()
    if not data or 'username' not in data or 'password' not in data:
        return jsonify({'error': 'Missing username or password'}), 400
    
    username = data['username']
    password = data['password']
    
    if "://" in OVPN_RPC_URL:
        protocol, domain = OVPN_RPC_URL.split("://")
        auth_url = f"{protocol}://{OVPN_ADMIN_USER}:{OVPN_ADMIN_PASS}@{domain}"
    else:
        auth_url = OVPN_RPC_URL

    try:
        context = ssl._create_unverified_context()
        
        server = xmlrpc.client.ServerProxy(auth_url, context=context)
        
        server.UserPropPut(username, {"type": "user_connect"})
        
        server.SetLocalPassword(username, password)
        
        server.UserPropPut(username, {"prop_autologin": "true"})

        return jsonify({'success': True, 'message': 'User created successfully'})

    except xmlrpc.client.Fault as err:
        print(f"OpenVPN RPC Fault: {err.faultCode} - {err.faultString}")
        return jsonify({'error': f"VPN Server Error: {err.faultString}"}), 500
    except Exception as e:
        print(f"Error creating user: {e}")
        return jsonify({'error': "Failed to connect to VPN server."}), 500

@app.route('/clip/')
@app.route('/clip/index.html')
def clip_embed_page():
    clip_id = request.args.get('id')
    if not clip_id:
        abort(400, "Required 'id' parameter is missing.")

    preview_url = f"https://api.bansaidn.es/ViewClip?id={clip_id}&compressed=true"
    player_url = f"https://api.bansaidn.es/ViewClip?id={clip_id}&compressed=false"
    api_info_url = f"http://127.0.0.1:5000/clipInfo?ID={clip_id}"

    try:
        response = requests.get(api_info_url, timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            width = data.get('width', 1280)
            height = data.get('height', 720)
            
            raw_name = data.get('name', clip_id) or clip_id
                
            title = f"View clip: {raw_name}"
            
            return render_template(
                'clip_template.html', 
                active_page='clip',
                clip_title=title, 
                clip_name=raw_name, 
                preview_url=preview_url,
                player_url=player_url,
                video_width=width, 
                video_height=height
            )
        else:
            print(f"API Error: {response.status_code}")
            return render_template(
                'clip_template.html', 
                active_page='clip',
                clip_title=f"View clip: {clip_id}", 
                clip_name=clip_id,
                preview_url=preview_url,
                player_url=player_url,
                video_width=1280, 
                video_height=720
            )
        
    except requests.exceptions.RequestException as e:
        print(f"Connection error to API: {e}")
        return render_template(
            'clip_template.html', 
            active_page='clip',
            clip_title=f"View clip: {clip_id}", 
            clip_name=clip_id,
            preview_url=preview_url,
            player_url=player_url,
            video_width=1280, 
            video_height=720
        )
    except Exception as e:
        print(f"An unexpected error occurred for clip {clip_id}: {e}")
        abort(500, "An unexpected server error occurred.")

@app.route('/IFYS/')
@app.route('/IFYS/index.html')
def serve_ifys_index():
    return send_from_directory(os.path.join(BASE_DIR, 'IFYS'), 'index.html')

@app.route('/IFYS/<path:filename>')
def serve_ifys_files(filename):
    return send_from_directory(os.path.join(BASE_DIR, 'IFYS'), filename)

@app.route('/static/jellyfish.html')
def serve_jellyfish():
    return send_from_directory(app.static_folder, 'jellyfish.html')

@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory(app.static_folder, filename)

@app.route('/watchparty/')
@app.route('/watchparty/index.html')
def watch_party_page():
    return render_template('watchparty.html', active_page='watchparty')

@app.route('/banwake/')
@app.route('/banwake/index.html')
def banwake_page():
    return render_template('banwake.html', active_page='banwake')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=2905, debug=False)
    