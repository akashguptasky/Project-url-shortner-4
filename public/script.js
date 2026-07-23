const form = document.getElementById("shorten-form");
const longUrlInput = document.getElementById("longUrl");
const submitBtn = document.getElementById("submitBtn");
const submitLabel = submitBtn.querySelector("span");
const errorEl = document.getElementById("error");
const resultEl = document.getElementById("result");
const shortLink = document.getElementById("shortLink");
const urlCodeEl = document.getElementById("urlCode");
const copyBtn = document.getElementById("copyBtn");

// Fill the background with faded sample long URLs (pure decoration)
(function paintBackground() {
  const samples = [
    "https://example.com/products/category/electronics/phones?id=98213&ref=homepage&utm_source=newsletter&utm_campaign=q3",
    "https://docs.google.com/spreadsheets/d/1aBcD3fGhIjKlMnOpQrStUvWxYz/edit#gid=482910345",
    "https://www.amazon.in/dp/B0C4XYZ123/ref=sr_1_3?keywords=mechanical+keyboard&qid=1720423",
    "https://maps.app.example.com/place/Some+Very+Long+Place+Name/@28.6139,77.2090,17z/data=i3m1i4b1",
  ];
  let text = "";
  for (let i = 0; i < 40; i++) {
    text += samples[i % samples.length] + "   ";
  }
  document.getElementById("bgNoise").textContent = text;
})();

function showError(msg) {
  errorEl.textContent = msg;
  errorEl.classList.remove("hidden");
  resultEl.classList.add("hidden");
}

function showResult(data) {
  errorEl.classList.add("hidden");
  shortLink.textContent = data.shortUrl;
  shortLink.href = data.shortUrl;
  urlCodeEl.textContent = data.urlCode;
  resultEl.classList.remove("hidden");
  copyBtn.textContent = "Copy";
  copyBtn.classList.remove("copied");
}

form.addEventListener("submit", async function (e) {
  e.preventDefault();
  const longUrl = longUrlInput.value.trim();
  if (!longUrl) return;

  submitBtn.disabled = true;
  submitLabel.textContent = "SNIPPING...";

  try {
    // Relative path -> same origin (works both locally and on Codespaces)
    const res = await fetch("/url/shorten", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ longUrl }),
    });

    const json = await res.json();

    if (!res.ok || json.status === false) {
      showError(json.message || "Something went wrong. Please try again.");
    } else {
      showResult(json.data);
    }
  } catch (err) {
    showError("Could not reach the server. Is the backend running?");
  } finally {
    submitBtn.disabled = false;
    submitLabel.textContent = "SNIP IT";
  }
});

copyBtn.addEventListener("click", async function () {
  try {
    await navigator.clipboard.writeText(shortLink.textContent);
    copyBtn.textContent = "Copied!";
    copyBtn.classList.add("copied");
    setTimeout(() => {
      copyBtn.textContent = "Copy";
      copyBtn.classList.remove("copied");
    }, 1500);
  } catch (err) {
    copyBtn.textContent = "Failed";
  }
});
