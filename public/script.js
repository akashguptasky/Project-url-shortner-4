const form = document.getElementById("shorten-form");
const longUrlInput = document.getElementById("longUrl");
const submitBtn = document.getElementById("submitBtn");
const errorEl = document.getElementById("error");
const resultEl = document.getElementById("result");
const shortLink = document.getElementById("shortLink");
const urlCodeEl = document.getElementById("urlCode");
const copyBtn = document.getElementById("copyBtn");

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
}

form.addEventListener("submit", async function (e) {
  e.preventDefault();
  const longUrl = longUrlInput.value.trim();
  if (!longUrl) return;

  submitBtn.disabled = true;
  submitBtn.textContent = "Shortening...";

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
    submitBtn.textContent = "Shorten";
  }
});

copyBtn.addEventListener("click", async function () {
  try {
    await navigator.clipboard.writeText(shortLink.textContent);
    copyBtn.textContent = "Copied!";
    setTimeout(() => (copyBtn.textContent = "Copy"), 1500);
  } catch (err) {
    copyBtn.textContent = "Failed";
  }
});
