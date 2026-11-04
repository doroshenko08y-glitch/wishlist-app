console.log("js/app.js підключено");

// Константа з URL ендпоінта для Варіанта 7 (Список бажань)
const API_URL = "https://jsonplaceholder.typicode.com/todos?userId=2";

const PRIORITIES = ["low", "medium", "high"];
const PRIORITY_LABELS = {
  high: "Високий пріоритет",
  medium: "Середній пріоритет",
  low: "Низький пріоритет",
};
const DEFAULT_PRICE = 1500;
const CURRENT_BUDGET = 4000;

// Вибір контейнера
const listContainer = document.querySelector("#wishlist");

// Елемент для статусу завантаження / помилок перед списком
const statusMessageElem = document.createElement("div");
statusMessageElem.style.margin = "1rem 0";
statusMessageElem.style.fontWeight = "600";
listContainer.before(statusMessageElem);

// Кнопка «Оновити»
const refreshButton = document.createElement("button");
refreshButton.textContent = "Оновити список";
refreshButton.className = "btn-add";
refreshButton.style.marginBottom = "1rem";
refreshButton.style.display = "inline-block";
listContainer.before(refreshButton);

// Видалення статичних прикладів карток
document.querySelectorAll(".cards .card").forEach((card) => card.remove());

// Дані розділені: елементи з API та елементи, додані користувачем.
// Це дозволяє не втрачати локальні дані при натисканні «Оновити».
let apiItems = [];
let localItems = [];
// Загальний масив, який відображається
let wishlist = [];

function rebuildWishlist() {
  wishlist = [...localItems, ...apiItems];
}

/**
 * API повертає лише title і completed (+ id, userId).
 * price і priority НЕ приходять з API, тому детерміновано
 * розраховуються на клієнті на основі id (значення стабільні між оновленнями).
 */
function enrichTodo(todo) {
  return {
    ...todo,
    // id для userId=2 це 21–40 → ціна 350–3500 грн
    price: ((todo.id % 10) + 1) * 350,
    // придбане → низький пріоритет, інакше за id
    priority: todo.completed ? "low" : PRIORITIES[todo.id % 3],
  };
}

// Підсумок: виконані бажання НЕ враховуються
function updateTotal() {
  const totalCost = wishlist
    .filter((item) => !item.completed)
    .reduce((sum, item) => sum + (item.price ?? DEFAULT_PRICE), 0);

  const totalPriceElem = document.querySelector("#total-price");
  if (totalPriceElem) {
    totalPriceElem.textContent = `${totalCost.toLocaleString()} грн`;
  }
}

// Функція рендеру
function renderWishlist(items) {
  listContainer.innerHTML = "";

  items.forEach((item, index) => {
    const itemPrice = item.price ?? DEFAULT_PRICE;

    let itemPriority = item.priority;
    if (!itemPriority) {
      itemPriority = item.completed ? "low" : "medium";
    }

    const article = document.createElement("article");
    article.classList.add("card");
    article.dataset.index = index;

    // Чекбокс «Придбано»
    const checkboxLabel = document.createElement("label");
    checkboxLabel.classList.add("purchased-checkbox-label");
    checkboxLabel.style.display = "flex";
    checkboxLabel.style.alignItems = "center";
    checkboxLabel.style.gap = "0.5rem";
    checkboxLabel.style.fontSize = "0.85rem";
    checkboxLabel.style.cursor = "pointer";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.classList.add("purchased-checkbox");
    checkbox.checked = Boolean(item.completed);

    checkboxLabel.append(checkbox, document.createTextNode("Придбано"));

    // Бейдж пріоритету
    const badgeSpan = document.createElement("span");
    badgeSpan.classList.add(
      "priority-badge",
      `priority-badge--${itemPriority}`,
    );
    badgeSpan.textContent = PRIORITY_LABELS[itemPriority];

    const prioritySelect = document.createElement("select");
    prioritySelect.classList.add("priority-select");
    prioritySelect.hidden = true;
    [
      ["low", "Низький"],
      ["medium", "Середній"],
      ["high", "Високий"],
    ].forEach(([value, label]) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      option.selected = value === itemPriority;
      prioritySelect.append(option);
    });

    // Назва
    const titleElem = document.createElement("h3");
    titleElem.classList.add("card-title");
    titleElem.textContent = item.title;

    // Зображення
    const imgElem = document.createElement("img");
    imgElem.src = item.image || "https://via.placeholder.com/150";
    imgElem.alt = item.title;

    // Ціна
    const priceElem = document.createElement("p");
    priceElem.classList.add("card-price");
    priceElem.textContent = `${itemPrice.toLocaleString()} грн`;

    article.setAttribute("data-priority", itemPriority);
    if (itemPriority === "high") {
      article.classList.add("priority-high");
    }
    if (item.completed) {
      article.classList.add("card--purchased");
    }

    article.append(
      badgeSpan,
      checkboxLabel,
      prioritySelect,
      titleElem,
      imgElem,
      priceElem,
    );

    listContainer.append(article);
  });

  updateTotal();
}

// Перевірка бюджету
const withinBudget = (price, budget) => price <= budget;

function checkBudget() {
  console.log(`Перевірка доступності у межах бюджету (${CURRENT_BUDGET} грн)`);
  for (const item of wishlist) {
    if (item.completed) continue; // придбані не перевіряємо
    const itemPrice = item.price ?? DEFAULT_PRICE;
    if (withinBudget(itemPrice, CURRENT_BUDGET)) {
      console.log(`Доступно: "${item.title}" за ${itemPrice} грн`);
    } else {
      console.log(`Занадто дорого: "${item.title}" за ${itemPrice} грн`);
    }
  }
}

// Єдина точка оновлення відображення
function refreshView() {
  rebuildWishlist();
  renderWishlist(wishlist);
  checkBudget();
}

/**
 * Асинхронне завантаження даних з API
 * API: https://jsonplaceholder.typicode.com/todos?userId=2
 */
async function loadData() {
  statusMessageElem.textContent = "Завантаження списку бажань...";
  statusMessageElem.style.color = "var(--primary)";
  refreshButton.disabled = true;

  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error(`Помилка HTTP: ${response.status}`);
    }

    const data = await response.json();
    console.log("Отримані дані з API:", data);

    // Зберігаємо зміни користувача (completed / priority) для елементів API
    const previousById = new Map(apiItems.map((item) => [item.id, item]));
    apiItems = data.map((todo) => {
      const enriched = enrichTodo(todo);
      const prev = previousById.get(todo.id);
      return prev
        ? { ...enriched, completed: prev.completed, priority: prev.priority }
        : enriched;
    });

    refreshView();

    statusMessageElem.textContent =
      wishlist.length === 0 ? "Список бажань порожній." : "";
  } catch (error) {
    console.error("Деталі помилки завантаження:", error);

    // Повідомлення за варіантом показуємо для будь-якої помилки завантаження
    statusMessageElem.textContent = "Список бажань недоступний офлайн.";
    statusMessageElem.style.color = "#b83256";
  } finally {
    refreshButton.disabled = false;
  }
}

// Початковий виклик
loadData();

// Повторний виклик loadData() по кнопці
refreshButton.addEventListener("click", () => {
  loadData();
});

// Форма та її поля
const form = document.querySelector(".wish-form");
const nameInput = document.querySelector("#wish-name");
const priceInput = document.querySelector("#wish-price");
const priorityInput = document.querySelector("#wish-priority");
const imgInput = document.querySelector("#wish-img");
const completedInput = document.querySelector("#wish-completed");

// Валідація ціни: від'ємне значення
priceInput.addEventListener("input", () => {
  if (priceInput.value !== "" && Number(priceInput.value) < 0) {
    priceInput.setCustomValidity("Ціна не може бути від'ємною");
  } else {
    priceInput.setCustomValidity("");
  }
  priceInput.reportValidity();
});

// Submit: додає нове бажання без перезавантаження сторінки
form.addEventListener("submit", (event) => {
  event.preventDefault();

  const title = nameInput.value.trim();
  const price = Number(priceInput.value);
  const priority = priorityInput.value;
  const image = imgInput.value.trim();
  const completed = completedInput ? completedInput.checked : false;

  // Нові елементи зберігаються окремо, тому «Оновити» їх не видаляє
  localItems.unshift({
    title,
    price,
    priority,
    image: image || "https://via.placeholder.com/150",
    completed,
  });

  refreshView();
  statusMessageElem.textContent = "";

  form.reset();
  priceInput.setCustomValidity("");
});

// Чекбокс «Придбано» (делегування)
listContainer.addEventListener("change", (event) => {
  const checkbox = event.target.closest(".purchased-checkbox");
  if (!checkbox) return;

  const article = checkbox.closest(".card");
  const index = Number(article.dataset.index);

  wishlist[index].completed = checkbox.checked;
  article.classList.toggle("card--purchased", checkbox.checked);
  updateTotal();
});

// Зміна пріоритету (делегування)
listContainer.addEventListener("change", (event) => {
  const select = event.target.closest(".priority-select");
  if (!select) return;

  const article = select.closest(".card");
  const badge = article.querySelector(".priority-badge");
  const index = Number(article.dataset.index);
  const newPriority = select.value;

  wishlist[index].priority = newPriority;

  badge.classList.remove(
    "priority-badge--high",
    "priority-badge--medium",
    "priority-badge--low",
  );
  badge.classList.add(`priority-badge--${newPriority}`);
  badge.textContent = PRIORITY_LABELS[newPriority];

  article.setAttribute("data-priority", newPriority);
  article.classList.toggle("priority-high", newPriority === "high");

  select.hidden = true;
});

// Показ/приховування select по кліку на картку
listContainer.addEventListener("click", (event) => {
  if (
    event.target.closest(".priority-select") ||
    event.target.closest(".purchased-checkbox-label")
  )
    return;

  const card = event.target.closest(".card");
  if (!card) return;

  const select = card.querySelector(".priority-select");
  select.hidden = !select.hidden;
});
