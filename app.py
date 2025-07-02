from flask import Flask, render_template, request, jsonify
import webbrowser
import wikipedia
import datetime
import os

app = Flask(__name__)

# Chrome path configuration (Windows)
chrome_path = 'C:/Program Files/Google/Chrome/Application/chrome.exe %s'

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/process', methods=['POST'])
def process():
    query = request.json['query'].lower()
    response = {"text": "", "action": None}

    # Enhanced Wikipedia search triggers
    if 'wikipedia' in query or any(tell_word in query for tell_word in ['tell me about', 'tell about', 'explain', 'what is', 'who is']):
        try:
            # Extract search term by removing trigger phrases
            search_term = query.replace("wikipedia", "").strip()
            for phrase in ['tell me about', 'tell about', 'explain', 'what is', 'who is']:
                search_term = search_term.replace(phrase, "").strip()
            
            # Get Wikipedia summary with error handling
            summary = wikipedia.summary(search_term, sentences=2)
            response["text"] = f"According to Wikipedia: {summary}"
            
        except wikipedia.exceptions.DisambiguationError as e:
            options = '\n'.join(e.options[:3])  # Show first 3 options
            response["text"] = f"Multiple matches found. Please be more specific:\n{options}"
            
        except wikipedia.exceptions.PageError:
            response["text"] = f"Sorry, I couldn't find information about '{search_term}' on Wikipedia."
            
        except Exception as e:
            response["text"] = "Sorry, I encountered an error while searching Wikipedia."

    # ... rest of your existing command handling ...

    elif 'open youtube' in query:
        response["text"] = "Opening YouTube"
        response["action"] = "open_url"
        response["url"] = "https://youtube.com"

    elif 'open google' in query:
        response["text"] = "Opening Google"
        response["action"] = "open_url"
        response["url"] = "https://google.com"

    elif 'time' in query:
        response["text"] = datetime.datetime.now().strftime("%I:%M %p")

    else:
        response["text"] = "Command not recognized"

    return jsonify(response)

if __name__ == '__main__':
    # Register Chrome browser
    webbrowser.register('chrome', None, webbrowser.BackgroundBrowser(chrome_path))
    app.run(debug=True)