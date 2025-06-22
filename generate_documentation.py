#!/usr/bin/env python3
"""
Documentation Generator for the Drift Travel App
This script analyzes the project structure and generates comprehensive documentation
including component hierarchy, API endpoints, and general usage guidelines.
"""

import os
import re
import json
import markdown
from datetime import datetime

# Configuration
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(PROJECT_ROOT, 'frontend')
BACKEND_DIR = os.path.join(PROJECT_ROOT, 'backend')
OUTPUT_DIR = os.path.join(PROJECT_ROOT, 'documentation')
README_PATH = os.path.join(PROJECT_ROOT, 'README.md')
PROJECT_SUMMARY_PATH = os.path.join(PROJECT_ROOT, 'PROJECT_SUMMARY.md')

# Create output directory if it doesn't exist
if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)

def get_project_summary():
    """Read the project summary from PROJECT_SUMMARY.md"""
    if os.path.exists(PROJECT_SUMMARY_PATH):
        with open(PROJECT_SUMMARY_PATH, 'r', encoding='utf-8') as f:
            return f.read()
    return "No project summary found."

def extract_react_components(directory):
    """Extract React components from JS files"""
    components = []
    js_files = []
    
    # Find all JS files
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith('.js') and not file.endswith('.test.js'):
                js_files.append(os.path.join(root, file))
    
    # Extract component info
    for js_file in js_files:
        try:
            relative_path = os.path.relpath(js_file, FRONTEND_DIR)
            with open(js_file, 'r', encoding='utf-8') as f:
                content = f.read()
                
            # Extract component name
            component_match = re.search(r'const\s+([A-Z]\w*)\s+=\s+\(\s*\{?.*?\}?\s*\)\s+=>', content) or \
                             re.search(r'function\s+([A-Z]\w*)\s*\(', content) or \
                             re.search(r'class\s+([A-Z]\w*)\s+extends\s+(?:React\.)?Component', content)
            
            if component_match:
                component_name = component_match.group(1)
                
                # Extract props
                props = []
                props_match = re.search(r'const\s+\w+\s+=\s+\(\s*\{(.*?)\}s*\)\s+=>', content)
                if props_match:
                    props_text = props_match.group(1)
                    props = [p.strip() for p in props_text.split(',') if p.strip()]
                
                # Extract state variables
                state_vars = []
                state_matches = re.findall(r'useState\(\s*(.*?)\s*\)', content)
                for match in state_matches:
                    state_vars.append(match)
                
                # Check if imports other components
                imports = []
                import_matches = re.findall(r'import\s+(\w+)\s+from\s+[\'\"]\.\/components\/(\w+)[\'\"]', content)
                for match in import_matches:
                    imports.append(match[0])
                
                components.append({
                    'name': component_name,
                    'file': relative_path,
                    'props': props,
                    'state_variables': state_vars,
                    'imports': imports
                })
        except Exception as e:
            print(f"Error processing {js_file}: {e}")
    
    return components

def extract_api_endpoints(directory):
    """Extract API endpoints from Python files"""
    endpoints = []
    py_files = []
    
    # Find all Python files
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith('.py'):
                py_files.append(os.path.join(root, file))
    
    # Extract endpoint info
    for py_file in py_files:
        try:
            relative_path = os.path.relpath(py_file, BACKEND_DIR)
            with open(py_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # FastAPI endpoints
            endpoint_matches = re.findall(r'@(?:app|router)\.(\w+)\([\'\"]([^\'\"]*)[\'\"]', content)
            for method, path in endpoint_matches:
                # Try to extract function name
                func_match = re.search(fr'@(?:app|router)\.{method}\([\'\"]{path}[\'\"].*?\)\s*\n\s*(?:async\s+)?def\s+(\w+)', content, re.DOTALL)
                func_name = func_match.group(1) if func_match else "unknown"
                
                # Try to extract docstring
                doc_match = re.search(fr'def\s+{func_name}\(.*?\):\s*(?:[\'\"]{3}(.*?)[\'\"]{3})?', content, re.DOTALL)
                docstring = doc_match.group(1).strip() if doc_match and doc_match.group(1) else "No description"
                
                endpoints.append({
                    'method': method.upper(),
                    'path': path,
                    'function': func_name,
                    'description': docstring,
                    'file': relative_path
                })
        except Exception as e:
            print(f"Error processing {py_file}: {e}")
    
    return endpoints

def generate_component_docs(components):
    """Generate component documentation"""
    markdown_content = "# React Components\n\n"
    
    for component in sorted(components, key=lambda x: x['name']):
        markdown_content += f"## {component['name']}\n\n"
        markdown_content += f"**File:** `{component['file']}`\n\n"
        
        if component['props']:
            markdown_content += "### Props\n\n"
            for prop in component['props']:
                markdown_content += f"- `{prop}`\n"
            markdown_content += "\n"
        
        if component['state_variables']:
            markdown_content += "### State Variables\n\n"
            for state_var in component['state_variables']:
                markdown_content += f"- `{state_var}`\n"
            markdown_content += "\n"
        
        if component['imports']:
            markdown_content += "### Imported Components\n\n"
            for imp in component['imports']:
                markdown_content += f"- `{imp}`\n"
            markdown_content += "\n"
        
        markdown_content += "---\n\n"
    
    # Write to file
    output_path = os.path.join(OUTPUT_DIR, 'components.md')
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(markdown_content)
    
    print(f"Component documentation generated at {output_path}")
    return output_path

def generate_api_docs(endpoints):
    """Generate API endpoint documentation"""
    markdown_content = "# API Endpoints\n\n"
    
    # Group by path
    endpoints_by_path = {}
    for endpoint in endpoints:
        path = endpoint['path']
        if path not in endpoints_by_path:
            endpoints_by_path[path] = []
        endpoints_by_path[path].append(endpoint)
    
    # Generate markdown
    for path, path_endpoints in sorted(endpoints_by_path.items()):
        markdown_content += f"## {path}\n\n"
        
        for endpoint in path_endpoints:
            markdown_content += f"### {endpoint['method']}\n\n"
            markdown_content += f"**Function:** `{endpoint['function']}`\n\n"
            markdown_content += f"**Description:** {endpoint['description']}\n\n"
            markdown_content += f"**File:** `{endpoint['file']}`\n\n"
            markdown_content += "---\n\n"
    
    # Write to file
    output_path = os.path.join(OUTPUT_DIR, 'api.md')
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(markdown_content)
    
    print(f"API documentation generated at {output_path}")
    return output_path

def generate_project_overview():
    """Generate project overview documentation"""
    markdown_content = "# DRIFT Travel App Documentation\n\n"
    markdown_content += f"*Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}*\n\n"
    
    # Add project summary
    markdown_content += "## Project Summary\n\n"
    markdown_content += get_project_summary()
    markdown_content += "\n\n"
    
    # Add project structure
    markdown_content += "## Project Structure\n\n"
    markdown_content += "```\n"
    
    # Frontend structure
    markdown_content += "frontend/\n"
    for root, dirs, files in os.walk(FRONTEND_DIR):
        level = root.replace(PROJECT_ROOT, '').count(os.sep) - 1
        indent = ' ' * 2 * level
        subdir = os.path.basename(root)
        if level > 0:  # Skip the root directory itself
            markdown_content += f"{indent}├── {subdir}/\n"
            if files:
                for file in sorted(files):
                    if not file.startswith('.') and not file.endswith('.map'):
                        markdown_content += f"{indent}│   ├── {file}\n"
    
    # Backend structure
    markdown_content += "backend/\n"
    for root, dirs, files in os.walk(BACKEND_DIR):
        level = root.replace(PROJECT_ROOT, '').count(os.sep) - 1
        indent = ' ' * 2 * level
        subdir = os.path.basename(root)
        if level > 0:  # Skip the root directory itself
            markdown_content += f"{indent}├── {subdir}/\n"
            if files:
                for file in sorted(files):
                    if not file.startswith('.'):
                        markdown_content += f"{indent}│   ├── {file}\n"
    
    markdown_content += "```\n\n"
    
    # Write to file
    output_path = os.path.join(OUTPUT_DIR, 'overview.md')
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(markdown_content)
    
    print(f"Project overview generated at {output_path}")
    return output_path

def generate_index():
    """Generate index file linking all documentation"""
    markdown_content = "# DRIFT Travel App Documentation\n\n"
    markdown_content += f"*Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}*\n\n"
    
    markdown_content += "## Contents\n\n"
    markdown_content += "1. [Project Overview](overview.md)\n"
    markdown_content += "2. [React Components](components.md)\n"
    markdown_content += "3. [API Endpoints](api.md)\n"
    
    # Write to file
    output_path = os.path.join(OUTPUT_DIR, 'index.md')
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(markdown_content)
    
    print(f"Index file generated at {output_path}")

def generate_html_docs():
    """Convert markdown docs to HTML"""
    for md_file in os.listdir(OUTPUT_DIR):
        if md_file.endswith('.md'):
            md_path = os.path.join(OUTPUT_DIR, md_file)
            html_path = os.path.join(OUTPUT_DIR, md_file.replace('.md', '.html'))
            
            with open(md_path, 'r', encoding='utf-8') as f:
                md_content = f.read()
            
            html_content = f"""
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>DRIFT Documentation - {md_file.replace('.md', '')}</title>
                <style>
                    body {{
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        max-width: 900px;
                        margin: 0 auto;
                        padding: 20px;
                        background-color: #f9f9f9;
                    }}
                    h1, h2, h3, h4, h5, h6 {{
                        color: #1a2942;
                    }}
                    code, pre {{
                        font-family: Consolas, Monaco, 'Andale Mono', monospace;
                        background-color: #f5f5f5;
                        padding: 2px 5px;
                        border-radius: 4px;
                        font-size: 0.9em;
                    }}
                    pre {{
                        padding: 15px;
                        overflow: auto;
                    }}
                    a {{
                        color: #1e40af;
                        text-decoration: none;
                    }}
                    a:hover {{
                        text-decoration: underline;
                    }}
                    table {{
                        border-collapse: collapse;
                        width: 100%;
                    }}
                    th, td {{
                        border: 1px solid #ddd;
                        padding: 8px;
                    }}
                    tr:nth-child(even) {{
                        background-color: #f2f2f2;
                    }}
                    th {{
                        padding-top: 12px;
                        padding-bottom: 12px;
                        text-align: left;
                        background-color: #1a2942;
                        color: white;
                    }}
                    .navbar {{
                        background-color: #1a2942;
                        padding: 10px 20px;
                        margin-bottom: 20px;
                        border-radius: 8px;
                    }}
                    .navbar a {{
                        color: white;
                        margin-right: 15px;
                    }}
                </style>
            </head>
            <body>
                <div class="navbar">
                    <a href="index.html">Home</a>
                    <a href="overview.html">Overview</a>
                    <a href="components.html">Components</a>
                    <a href="api.html">API</a>
                </div>
                {markdown.markdown(md_content, extensions=['tables', 'fenced_code'])}
            </body>
            </html>
            """
            
            with open(html_path, 'w', encoding='utf-8') as f:
                f.write(html_content)
            
            print(f"HTML documentation generated at {html_path}")

def main():
    """Main function to generate documentation"""
    print("🌟 DRIFT Travel App Documentation Generator 🌟")
    print("===========================================")
    
    # Extract components
    print("\nExtracting React components...")
    components = extract_react_components(FRONTEND_DIR)
    print(f"Found {len(components)} components")
    
    # Extract API endpoints
    print("\nExtracting API endpoints...")
    endpoints = extract_api_endpoints(BACKEND_DIR)
    print(f"Found {len(endpoints)} API endpoints")
    
    # Generate documentation
    print("\nGenerating documentation...")
    generate_project_overview()
    generate_component_docs(components)
    generate_api_docs(endpoints)
    generate_index()
    
    # Convert to HTML
    print("\nConverting to HTML...")
    generate_html_docs()
    
    print("\n✅ Documentation generation complete!")
    print(f"Documentation available at: {OUTPUT_DIR}")

if __name__ == "__main__":
    main()
