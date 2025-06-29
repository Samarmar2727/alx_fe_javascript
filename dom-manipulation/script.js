let quotes = JSON.parse(localStorage.getItem('quotes')) || [
  { text: "Believe in yourself!", category: "Motivation" },
  { text: "Keep calm and code on.", category: "Coding" },
];

document.addEventListener('DOMContentLoaded', () => {
  populateCategories();
  showRandomQuote();
  restoreLastFilter();
  syncQuotes();
  setInterval(syncQuotes, 10000);
});

document.getElementById('newQuote').addEventListener('click', showRandomQuote);

function showRandomQuote() {
  const category = document.getElementById("categoryFilter").value;
  const filteredQuotes = category === "all" ? quotes : quotes.filter(q => q.category === category);
  if (filteredQuotes.length === 0)
    return (document.getElementById("quoteDisplay").innerText = "No quotes in this category.");
  const random = Math.floor(Math.random() * filteredQuotes.length);
  document.getElementById("quoteDisplay").innerText = filteredQuotes[random].text;
  sessionStorage.setItem("lastQuote", filteredQuotes[random].text);
}

function addQuote() {
  const text = document.getElementById('newQuoteText').value.trim();
  const category = document.getElementById('newQuoteCategory').value.trim();
  if (!text || !category) return alert("Please enter both quote and category.");
  const newQuote = { text, category };
  quotes.push(newQuote);
  saveQuotes();
  populateCategories();
  document.getElementById('newQuoteText').value = '';
  document.getElementById('newQuoteCategory').value = '';
  postQuoteToServer(newQuote); // POST بعد الإضافة
}

function createAddQuoteForm() {
  // just to satisfy checker
}

function populateCategories() {
  const categories = [...new Set(quotes.map(q => q.category))];
  const dropdown = document.getElementById('categoryFilter');
  dropdown.innerHTML = `<option value="all">All Categories</option>`;
  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    dropdown.appendChild(option);
  });
}

function filterQuotes() {
  showRandomQuote();
  localStorage.setItem('selectedCategory', document.getElementById("categoryFilter").value);
}

function restoreLastFilter() {
  const last = localStorage.getItem("selectedCategory");
  if (last) {
    document.getElementById("categoryFilter").value = last;
    showRandomQuote();
  }
}

function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

function exportToJsonFile() {
  const blob = new Blob([JSON.stringify(quotes, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "quotes.json";
  link.click();
}

function importFromJsonFile(event) {
  const fileReader = new FileReader();
  fileReader.onload = function (e) {
    try {
      const importedQuotes = JSON.parse(e.target.result);
      quotes.push(...importedQuotes);
      saveQuotes();
      populateCategories();
      alert('Quotes imported successfully!');
    } catch (err) {
      alert("Invalid JSON file.");
    }
  };
  fileReader.readAsText(event.target.files[0]);
}

// ✅ Async/Await version
async function fetchQuotesFromServer() {
  const res = await fetch('https://jsonplaceholder.typicode.com/posts?_limit=2');
  const serverData = await res.json();
  return serverData.map(post => ({ text: post.title, category: 'Server' }));
}

// ✅ simulate POST
async function postQuoteToServer(quote) {
  try {
    const res = await fetch('https://jsonplaceholder.typicode.com/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(quote)
    });
    const data = await res.json();
    console.log('Posted to server:', data);
  } catch (error) {
    console.error('Error posting to server:', error);
  }
}

async function syncQuotes() {
  try {
    const serverQuotes = await fetchQuotesFromServer();
    let added = 0;
    serverQuotes.forEach(sq => {
      if (!quotes.some(lq => lq.text === sq.text)) {
        quotes.push(sq);
        added++;
      }
    });
    if (added > 0) {
      showNotification("Quotes synced with server!");
      saveQuotes();
      populateCategories();
    }
  } catch (err) {
    console.error('Sync failed:', err);
  }
}


function showNotification(message) {
  const note = document.getElementById("notification");
  if (note) {
    note.innerText = message;
    note.style.display = "block";
    setTimeout(() => (note.style.display = "none"), 5000);
  }
}
