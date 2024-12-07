from flask import Flask, render_template
import os

# Explicitly specify the path to the templates folder
app = Flask(__name__, template_folder=os.path.join(os.path.dirname(__file__), '..', 'templates'))

@app.route('/')
def home():
    return render_template('index.html')  # Flask looks for "templates/index.html"

if __name__ == '__main__':
    app.run(debug=True)
