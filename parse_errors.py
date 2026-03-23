import json
import os

def parse_errors(file_path):
    import json
    encodings = ['utf-16', 'utf-8', 'cp1252']
    data = None
    for enc in encodings:
        try:
            with open(file_path, 'r', encoding=enc) as f:
                content = f.read()
                # Find the actual JSON start [ and end ]
                start = content.find('[')
                end = content.rfind(']') + 1
                if start >= 0 and end > start:
                    data = json.loads(content[start:end])
                else:
                    data = json.loads(content)
                break
        except Exception:
            continue
    
    if data is None:
        print(f"Could not read {file_path} with any encoding or could not find JSON")
        return

    error_count = 0
    for result in data:
        file_path = result.get('filePath', 'unknown')
        for message in result.get('messages', []):
            if message.get('severity') == 2:  # Error
                print(f"{file_path}:{message.get('line', '?')}:{message.get('column', '?')} - {message.get('message', 'No message')} ({message.get('ruleId', 'No rule ID')})")
                error_count += 1
    
    print(f"Total errors: {error_count}")

if __name__ == "__main__":
    import sys
    fname = sys.argv[1] if len(sys.argv) > 1 else 'errors.json'
    if os.path.exists(fname):
        parse_errors(fname)
    else:
        print(f"{fname} not found")
