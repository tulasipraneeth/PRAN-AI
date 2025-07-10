let quizData = [];
let currentQuestionIndex = 0;
let userAnswers = {};
let markedForReview = new Set();
let timerInterval;

function sendData() {
  const topic = document.getElementById("userInput").value.trim();
  const selectedRadio = document.querySelector('input[name="count"]:checked');
  const selectedCount = selectedRadio ? parseInt(selectedRadio.value) : 10;

  if (!topic) {
    document.getElementById("responseArea").innerText = "❗ Please enter a topic.";
    return;
  }

  // Hide input and show loading
  document.querySelector(".quiz-box input").style.display = "none";
  document.querySelector(".radio-group").style.display = "none";
  document.querySelector(".start-button").style.display = "none";
  document.getElementById("responseArea").innerText = "⏳ Generating your quiz...";

  fetch("http://127.0.0.1:5000/api", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic, count: selectedCount })
  })
    .then(response => response.json())
    .then(data => {
      quizData = data.output;
      if (!quizData.length) {
        document.getElementById("responseArea").innerText = "❌ Failed to load quiz.";
        return;
      }
      startTimer(60 * quizData.length);
      showQuestion(0);
    })
    .catch(error => {
      document.getElementById("responseArea").innerText = "❌ Error connecting to backend.";
      console.error("Error:", error);
    });
}

function showQuestion(index) {
  currentQuestionIndex = index;
  const q = quizData[index];

  let html = `<form id='quizForm'>
    <div class="question-block">
      <p><strong>Q${index + 1}:</strong> ${q.question}</p>`;

  q.options.forEach((opt, i) => {
    const optionLetter = String.fromCharCode(65 + i); // A, B, C, D
    const checked = userAnswers[index] === optionLetter ? "checked" : "";
    html += `
      <label class="option">
        <input type="radio" name="q${index}" value="${optionLetter}" ${checked}>
        <span class="option-text">${optionLetter}) ${opt}</span>
      </label>`;
  });

  html += `</div>
    <label class='mark-review'>
      <input type='checkbox' onchange='toggleMark(${index})' ${markedForReview.has(index) ? "checked" : ""}/> Mark for Review
    </label>
    <div class="nav-buttons">
      <button type="button" onclick="prevQuestion()">⬅️ Prev</button>
      <button type="button" onclick="nextQuestion()">Next ➡️</button>
    </div>
    <button type="submit" class="start-button">Submit Exam</button>
  </form>`;

  document.getElementById("responseArea").innerHTML = html;
  document.getElementById("quizForm").onsubmit = submitExam;

  document.querySelectorAll(`input[name='q${index}']`).forEach(radio => {
    radio.onchange = () => userAnswers[index] = radio.value;
  });
}

function prevQuestion() {
  if (currentQuestionIndex > 0) showQuestion(currentQuestionIndex - 1);
}

function nextQuestion() {
  if (currentQuestionIndex < quizData.length - 1) showQuestion(currentQuestionIndex + 1);
}

function toggleMark(index) {
  if (markedForReview.has(index)) {
    markedForReview.delete(index);
  } else {
    markedForReview.add(index);
  }
}

function startTimer(seconds) {
  const timerDiv = document.getElementById("timer");

  function updateTimer() {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    timerDiv.innerText = `⏳ Time Left: ${mins}:${secs.toString().padStart(2, "0")}`;
    if (seconds-- <= 0) {
      clearInterval(timerInterval);
      submitExam();
    }
  }

  updateTimer();
  timerInterval = setInterval(updateTimer, 1000);
}

function submitExam(e) {
  if (e) e.preventDefault();
  clearInterval(timerInterval);

  let score = 0;
  let total = quizData.length;
  let attempted = 0;

  quizData.forEach((q, i) => {
    const correctRaw = q.answer || "";
    const correct = correctRaw.toUpperCase().replace(/ANSWER[:\-]?\s*/i, "").trim();
    const userAns = userAnswers[i];

    if (userAns) attempted++;
    if (userAns === correct) score++;
  });

  const resultHTML = `
    <div class="question-block">
      <h2>✅ Exam Submitted!</h2>
      <p><strong>Score:</strong> ${score} / ${total}</p>
      <p><strong>Attempted:</strong> ${attempted} / ${total}</p>
      <p><strong>Unattempted:</strong> ${total - attempted}</p>
    </div>
    <div style="text-align: center;">
      <button class="start-button" onclick="resetQuiz()">🔁 Restart Quiz</button>
    </div>
  `;

  document.getElementById("responseArea").innerHTML = resultHTML;
  document.getElementById("timer").innerText = "";
}

function resetQuiz() {
  quizData = [];
  userAnswers = {};
  markedForReview = new Set();
  currentQuestionIndex = 0;
  clearInterval(timerInterval);

  document.getElementById("userInput").value = "";
  document.querySelector(".quiz-box input").style.display = "block";
  document.querySelector(".radio-group").style.display = "flex";
  document.querySelector(".start-button").style.display = "inline-block";
  document.getElementById("responseArea").innerHTML = "Your quiz will appear here...";
  document.getElementById("timer").innerText = "";
}
