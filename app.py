import json
import os
import requests
from flask import Flask, request, abort, render_template, send_from_directory
from werkzeug.middleware.proxy_fix import ProxyFix

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
app = Flask(
    __name__,
    static_folder=os.path.join(BASE_DIR, 'static'),
    template_folder=os.path.join(BASE_DIR, 'templates')
)

app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=1)

@app.route('/clip/')
@app.route('/clip/index.html')
def clip_embed_page():
    clip_id = request.args.get('id')
    if not clip_id:
        abort(400, "Required 'id' parameter is missing.")

    direct_video_url = f"https://api.bansaidn.es/ViewClip?id={clip_id}&compressed=true"

    api_info_url = f"http://127.0.0.1:5000/clipInfo?ID={clip_id}"

    try:
        response = requests.get(api_info_url, timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            
            width = data.get('width', 1280)
            height = data.get('height', 720)
            
            raw_name = data.get('name', clip_id)
            if not raw_name:
                raw_name = clip_id
                
            title = f"View clip: {raw_name}"
            
            return render_template(
                'clip_template.html', 
                clip_title=title, 
                clip_name=raw_name, 
                direct_video_url=direct_video_url, 
                video_width=width, 
                video_height=height
            )
        else:
            print(f"API Error: {response.status_code}")
            width, height = 1280, 720
            title = f"View clip: {clip_id}"
            
            return render_template(
                'clip_template.html', 
                clip_title=title, 
                clip_name=clip_id,
                direct_video_url=direct_video_url, 
                video_width=width, 
                video_height=height
            )
        
    except requests.exceptions.RequestException as e:
        print(f"Connection error to C# API: {e}")
        return render_template(
            'clip_template.html', 
            clip_title=f"View clip: {clip_id}", 
            clip_name=clip_id,
            direct_video_url=direct_video_url, 
            video_width=1280, 
            video_height=720
        )
    except Exception as e:
        print(f"An unexpected error occurred for clip {clip_id}: {e}")
        abort(500, "An unexpected server error occurred.")

@app.route('/')
def root():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<string:page_name>.html')
def serve_html_page(page_name):
    return send_from_directory(app.static_folder, f"{page_name}.html")

@app.route('/<string:dir_name>/')
@app.route('/<string:dir_name>/<path:sub_path>')
def serve_sub_app(dir_name, sub_path='index.html'):
    return send_from_directory(os.path.join(app.static_folder, dir_name), sub_path)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=2905, debug=False)