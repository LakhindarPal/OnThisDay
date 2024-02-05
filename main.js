// Constants for API URL
const apiUrl = "https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday/all/";

// Get current date in DD/MM format
const getDateData = (param) => {
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
async function fetchData(dateParam) {
  const cached = JSON.parse(localStorage.getItem("onthisday"));
  let data = cached?.data;
  const date = getDateData(dateParam).apiDate;

  if (!cached || cached.date !== date || dateParam) {
    const res = await fetch(`${apiUrl}${date}`);
    if (!res.ok) return loadDataOnce("_", false);
    const json = await res?.json();

    data = Object.fromEntries(
      Object.entries(json).map(([section, items]) => [
      section,
      items.map(({ text, year, pages }) => ({
          text,
          year,
          pages: pages.map(({ titles, originalimage, description, extract_html, content_urls }) => ({
            title: titles.normalized,
            image: {
              source: originalimage?.source || "",
              width: originalimage?.width || "",
              height: originalimage?.height || ""
            },
            description: description || "",
            html: extract_html || "",
            url: content_urls.desktop.page || ""
          }))
        }))
      ])
    );

    if (!dateParam) {
      localStorage.setItem("onthisday", JSON.stringify({ date, data }));
    }
  }
  return data;
}

async function loadDataOnce(dateParam) {
  const data = await fetchData(dateParam);
  const sectionIds = ["selected", "births", "deaths", "holidays", "events"];

  sectionIds.forEach(secId => {
    const content = data[secId] || [];
    const containerEl = document.querySelector(`#${secId} div.container`);

    if (!data) {
      containerEl.innerHTML =
        `<p class="errorText">No data found for the requested date.</p>`;
    } else {
      containerEl.innerHTML = "";
      content.forEach(item => {
        const articleEl = document.createElement("article");
        articleEl.classList.add("incident");
        articleEl.innerHTML =
          `${item.year ? `<h3>Year ${item.year}</h3>` : ""}
          <p>${item.text}</p>`;
        articleEl.addEventListener("click", () => showDetails(item));

        containerEl.appendChild(articleEl);
      });
    }
  });

  const h1Span = document.querySelector("h1 span");
  h1Span.textContent = getDateData(dateParam).longDate;
}

// detailed information of a incident
function showDetails(data) {
  const figureEl = (page) => (page.originalimage?.source) ?
    `<figure>
      <img src="${page.image.source}" alt="${page.description}" width="${page.image.width}" height="${page.image.height}">
      ${page.description?`<figcaption>${page.description}</figcaption>`:""}
    </figure>` : "";

  modalContent.innerHTML = data.pages.map(page =>
    `<article class="page">
      <h3>${page.title}</h3>
      ${figureEl(page)}
      ${page.html}
      <a href="${page.url}" target="_blank">Read more</a>
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
  await loadDataOnce(date);
  openTab("selected");
}

document.addEventListener("DOMContentLoaded", async () => {
  await initializeContentOnce();
});

dateInput.addEventListener("change", async () => {
  const selectedDate = dateInput.value;
  await initializeContentOnce(selectedDate);
});

// event listeners to tab buttons
tabButtons.forEach(button => {
  button.addEventListener("click", () => {
    const tabName = button.dataset.tab;
    openTab(tabName);
  });
});