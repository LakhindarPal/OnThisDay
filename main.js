// Constants for API URL
const apiUrl = "https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday/all/";

// Get current date in DD/MM format
const dateData = (param) => {
  const date = param ? new Date(param) : new Date();
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const apiDate = `${day}/${month}`;

  const options = { month: "long", day: "numeric" };
  const longDate = date.toLocaleDateString("en-US", options);

  return { apiDate, longDate };
}

// elements 
const allTabs = document.querySelectorAll("section");
const tabButtons = document.querySelectorAll("nav#tabnav button");
const dialog = document.querySelector("dialog#details");
const modalContent = document.querySelector("dialog div");
const modalHeader = document.querySelector("dialog header");
const closeBtn = dialog.querySelector("#closeBtn");
const dateInput = document.getElementById("dateInput");

// display/hide tab
function openTab(tabName) {
  Array.from(allTabs).forEach(tab => tab.style.display = "none");
  const currentTab = document.getElementById(tabName);
  currentTab.style.display = "block";
}

// fetch data and add to sections 
async function fetchAndLoadDataOnce(date) {

  const res = await fetch(`${apiUrl}${dateData(date).apiDate}`);
  const data = await res?.json();

  const sectionIds = ["selected", "births", "deaths", "holidays", "events"];

  sectionIds.forEach(secId => {
    const content = data[secId] || [];
    const containerEl = document.querySelector(`#${secId} div.container`);

    if (!res.ok) {
      containerEl.innerHTML = `<p class="errorText">No data found for the requested date.</p>`;
    } else {
      containerEl.innerHTML = "";
      content.forEach(item => {
        const articleEl = document.createElement("article");
        articleEl.innerHTML = `${item.year ? `<h3>Year ${item.year}</h3>` : ""}
      <p>${item.text}</p>`;

        articleEl.addEventListener("click", () => showDetails(item));

        containerEl.appendChild(articleEl);
      });
    }
  });

  const h1Span = document.querySelector("h1 span");
  h1Span.textContent = dateData(date).longDate;
}

// detailed information of a incident
function showDetails(data) {
  const figureEl = (page) => (page.originalimage?.source) ?
    `<figure>
      <img src="${page.originalimage.source}" alt="${page.description}" width="${page.originalimage.width}" height="${page.originalimage.height}">
      ${page.description?`<figcaption>${page.description}</figcaption>`:""}
    </figure>` : "";

  modalContent.innerHTML = data.pages.map(page =>
    `<article class="page">
      <h3>${page.titles.display}</h3>
      ${figureEl(page)}
      ${page.extract_html}
      <a href="${page.content_urls.desktop.page}" target="_blank">Read more</a>
    </article>`
  ).join("");

  modalHeader.innerHTML =
    `<header>
      ${data.year ? `<h2>Year ${data.year}</h2>` : ""}
      <p>${data.text}</p>
    </header>`

  // Show the dialog
  dialog.showModal();
};

// Close dialog
closeBtn.addEventListener("click", () => {
  dialog.close();
});

async function initializeContentOnce(date) {
  await fetchAndLoadDataOnce(date);
  openTab("selected");
}

document.addEventListener("DOMContentLoaded", async () => {
  await initializeContentOnce();
});

dateInput.addEventListener("change", () => {
  const selectedDate = dateInput.value;
  initializeContentOnce(selectedDate);
});

// event listeners to tab buttons
tabButtons.forEach(button => {
  button.addEventListener("click", () => {
    const tabName = button.dataset.tab;
    openTab(tabName);
  });
});