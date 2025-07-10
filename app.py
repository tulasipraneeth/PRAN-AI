from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import google.generativeai as genai
import json
import re
import os
from dotenv import load_dotenv

# Initialize Flask app and enable CORS
app = Flask(__name__)
CORS(app)

# Load .env variables
load_dotenv()

# Configure Gemini with API key from .env
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Load Gemini model
model = genai.GenerativeModel("models/gemini-1.5-flash")

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/api", methods=["POST"])
def generate_quiz():
    data = request.get_json()
    topic = data.get("topic", "")
    count = int(data.get("count", 10))

    prompt = (
        f"Generate {count} multiple-choice questions (MCQs) on the topic '{topic}'. "
        "Return only valid JSON (do not include markdown, ```json, or explanation). "
        "The output must be a list of objects in this format:\n"
        "[\n"
        "{\n"
        '  \"question\": \"What is ...?\",\n'
        '  \"options\": [\"A\", \"B\", \"C\", \"D\"],\n'
        '  \"answer\": \"A\"\n'
        "},\n"
        "...]\n"
        "Only return the raw JSON array."
    )

    try:
        response = model.generate_content(prompt)
        raw_text = response.text.strip()

        # Remove ```json or ``` if present
        cleaned_text = re.sub(r"```json|```", "", raw_text).strip()

        # Debug output
        print("Gemini Raw Output:\n", raw_text)

        # Parse the cleaned JSON string
        quiz_json = json.loads(cleaned_text)

        # Validate the format
        if isinstance(quiz_json, list) and all(
            'question' in q and 'options' in q and 'answer' in q for q in quiz_json
        ):
            return jsonify({"output": quiz_json})
        else:
            return jsonify({"output": [], "error": "Invalid JSON structure returned from Gemini."})
    except Exception as e:
        print("Error occurred:", e)
        return jsonify({"output": [], "error": str(e)})

if __name__ == "__main__":
    app.run(debug=True)
