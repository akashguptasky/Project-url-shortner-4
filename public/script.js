const form = document.getElementById("shorten-form");
const longUrlInput = document.getElementById("longUrl");
const submitBtn = document.getElementById("submitBtn");
const submitLabel = submitBtn.querySelector("span");
const errorEl = document.getElementById("error");
const resultEl = document.getElementById("result");
const shortLink = document.getElementById("shortLink");
const openBtn = document.getElementById("openBtn");
const copyBtn = document.getElementById("copyBtn");

document.getElementById("year").textContent = new Date().getFullYear();

function showError(msg) {
  errorEl.textContent = msg;
  errorEl.classList.remove("hidden");
  resultEl.classList.add("hidden");
}

function showResult(data) {
  errorEl.classList.add("hidden");
  // Build the short link from the page's own origin so it always matches the
  // real public URL. On Codespaces the server is proxied via localhost internally,
  // so the server-built shortUrl can say "localhost" - the browser origin is reliable.
  const shortUrl = window.location.origin + "/" + data.urlCode;
  shortLink.textContent = shortUrl;
  shortLink.href = shortUrl;
  openBtn.href = shortUrl;
  resultEl.classList.remove("hidden");
  copyBtn.textContent = "Copy";
  copyBtn.classList.remove("copied");
}

form.addEventListener("submit", async function (e) {
  e.preventDefault();
  const longUrl = longUrlInput.value.trim();
  if (!longUrl) return;

  submitBtn.disabled = true;
  submitLabel.textContent = "Shortening…";

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
    submitLabel.textContent = "Shorten";
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
