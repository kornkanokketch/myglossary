
const glossaryData = [
    {
        id: 1,
        th: "สวัสดี",
        en: "Hello",
        jp: "こんにちは",
        de: "Hallo",
        es: "Hola"
    },
    {
        id: 2,
        th: "ขอบคุณ",
        en: "Thank you",
        jp: "ありがとう",
        de: "Danke",
        es: "Gracias"
    }
];

const langSelector = document.getElementById('langSelector');
const glossaryList = document.getElementById('glossaryList');

function renderGlossary(lang) {
    glossaryList.innerHTML = '';
    glossaryData.forEach(item => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="term">${item.en}</div>
            <div class="translation">${item[lang]}</div>
        `;
        glossaryList.appendChild(card);
    });
}

langSelector.addEventListener('change', (e) => {
    renderGlossary(e.target.value);
});

// Initial render
renderGlossary('en');