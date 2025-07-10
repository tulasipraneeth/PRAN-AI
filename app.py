from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import google.generativeai as genai
import json
import re

app = Flask(__name__)
CORS(app)

# 🔐 Replace with your actual Gemini API key
genai.configure(api_key="AIzaSyBM0BwG21JOYTo0UNbx8dBRVZggJQTUyeg")  # Example: "AIzaSy..."

# Use Gemini 1.5 Flash
model = genai.GenerativeModel("models/gemini-1.5-flash")

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/api", methods=["POST"])
def generate_quiz():
    data = request.get_json()
    topic = data.get("topic", "")
    count = int(data.get("count", 10))

    # 🧠 Prompt to generate clean JSON
    prompt = (
        f"Generate {count} multiple-choice questions (MCQs) on the topic '{topic}'. "
        "Return only valid JSON (do not include markdown, ```json, or explanation). "
        "The output must be a list of objects in this format:\n"
        "[\n"
        "{\n"
        '  "question": "What is ...?",\n'
        '  "options": ["A", "B", "C", "D"],\n'
        '  "answer": "A"\n'
        "},\n"
        "...]\n"
        "Only return the raw JSON array."
    )

    try:
        response = model.generate_content(prompt)
        raw_text = response.text.strip()

        # 🧼 Remove ```json and ```
        cleaned_text = re.sub(r"```json|```", "", raw_text).strip()

        # 🪵 Debug log
        print("Gemini Raw Output:\n", raw_text)

        # Parse the JSON safely
        quiz_json = json.loads(cleaned_text)

        # Validate it's a list of questions
        if isinstance(quiz_json, list) and all('question' in q and 'options' in q and 'answer' in q for q in quiz_json):
            return jsonify({"output": quiz_json})
        else:
            return jsonify({"output": [], "error": "Invalid JSON structure returned from Gemini."})
    except Exception as e:
        return jsonify({"output": [], "error": str(e)})

if __name__ == "__main__":
    app.run(debug=True)
