import os
import glob
import re

# Update User JS Files (ES Modules)
user_js_files = glob.glob('Public/User/js/**/*.js', recursive=True)
for file in user_js_files:
    if file.endswith('config.js'):
        with open(file, 'w') as f:
            f.write('export const API_BASE_URL = "http://127.0.0.1:4000"; // Change this to your live backend URL\n')
        continue
    
    parts = file.split('/js/')
    if len(parts) > 1:
        subpath = parts[1]
        depth = subpath.count('/')
        prefix = '../' * depth if depth > 0 else './'
        
        with open(file, 'r') as f:
            content = f.read()
            
        if "http://127.0.0.1:4000" in content:
            import_stmt = f'import {{ API_BASE_URL }} from "{prefix}config.js";\n'
            
            # If there's already an import stmt, we might duplicate it, but it's fine for a quick script
            if "import { API_BASE_URL }" not in content:
                content = import_stmt + content
                
            content = re.sub(r'const\s+API_BASE\s*=\s*["\']http://127\.0\.0\.1:4000["\'];', 'const API_BASE = API_BASE_URL;', content)
            content = re.sub(r'const\s+API\s*=\s*["\']http://127\.0\.0\.1:4000["\'];', 'const API = API_BASE_URL;', content)
            content = re.sub(r'["\']http://127\.0\.0\.1:4000(/api/[^"\']*)["\']', r'`${API_BASE_URL}\1`', content)
            content = re.sub(r'http://127\.0\.0\.1:4000', r'${API_BASE_URL}', content) # For any other raw strings
            
            with open(file, 'w') as f:
                f.write(content)

# Update Admin JS Files (Window globals)
admin_js_files = glob.glob('Public/Admin/js/**/*.js', recursive=True)
for file in admin_js_files:
    if file.endswith('config.js'): continue
    
    with open(file, 'r') as f:
        content = f.read()
        
    if "http://127.0.0.1:4000" in content:
        content = re.sub(r'const\s+API_BASE\s*=\s*["\']http://127\.0\.0\.1:4000["\'];', 'const API_BASE = window.API_BASE_URL;', content)
        content = re.sub(r'const\s+API\s*=\s*["\']http://127\.0\.0\.1:4000/api/banners["\'];', 'const API = `${window.API_BASE_URL}/api/banners`;', content)
        content = re.sub(r'const\s+API\s*=\s*["\']http://127\.0\.0\.1:4000/api/coupons["\'];', 'const API = `${window.API_BASE_URL}/api/coupons`;', content)
        content = re.sub(r'const\s+API\s*=\s*["\']http://127\.0\.0\.1:4000["\'];', 'const API = window.API_BASE_URL;', content)
        content = re.sub(r'["\']http://127\.0\.0\.1:4000(/api/[^"\']*)["\']', r'`${window.API_BASE_URL}\1`', content)
        
        with open(file, 'w') as f:
            f.write(content)

# Update Admin HTML Files (Inject config.js)
admin_html_files = glob.glob('Public/Admin/*.html')
for file in admin_html_files:
    with open(file, 'r') as f:
        content = f.read()
    
    if '<script src="js/config.js"></script>' not in content:
        # Inject before the first script tag
        content = re.sub(r'(<script)', r'<script src="js/config.js"></script>\n    \1', content, count=1)
        with open(file, 'w') as f:
            f.write(content)

print("Updated JS and HTML files.")
