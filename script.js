const glossaryData = [
    { en: "Inspiration", th: "แรงบันดาลใจ", jp: "インスピレーション", de: "Inspiration", es: "Inspiración", note: "Use for creative contexts." },
    { en: "Aesthetic", th: "ความงาม", jp: "美学", de: "Ästhetik", es: "Estética", note: "Refers to visual style." }
];

const grid = document.getElementById('glossaryGrid');
const langSelector = document.getElementById('langSelector');

// 1. Render Function
function render(filter = '') {
    grid.innerHTML = '';
    const lang = langSelector.value;
    
    const filtered = glossaryData.filter(item => 
        item.en.toLowerCase().includes(filter.toLowerCase()) || 
        item[lang].toLowerCase().includes(filter.toLowerCase())
    );

    filtered.forEach(item => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="term-main">${item.en}</div>
            <div class="term-sub">${item[lang]}</div>
            <div class="note-area"><strong>Note:</strong> ${item.note}</div>
        `;
        grid.appendChild(card);
    });
}

// 2. CSV Export Logic
function exportToCSV() {
    let csvContent = "data:text/csv;charset=utf-8,English,Translation,Note\n";
    glossaryData.forEach(item => {
        const row = `${item.en},${item[langSelector.value]},${item.note}`;
        csvContent += row + "\n";
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "my_glossary.csv");
    document.body.appendChild(link);
    link.click();
}

// 3. Quick Translate (Uses MyMemory Free API)
async function quickTranslate() {
    const text = document.getElementById('translateInput').value;
    const targetLang = langSelector.value;
    const resultDiv = document.getElementById('translateResult');
    
    if (!text) return;
    resultDiv.innerText = "Translating...";

    try {
        const response = await fetch(`https://api.mymemory.translated.net/get?q=${text}&langpair=en|${targetLang}`);
        const data = await response.json();
        resultDiv.innerText = `Result: ${data.responseData.translatedText}`;
    } catch (error) {
        resultDiv.innerText = "Error fetching translation.";
    }
}

// Listeners
document.getElementById('searchInput').addEventListener('input', (e) => render(e.target.value));
langSelector.addEventListener('change', () => render());

render();
