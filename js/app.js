console.log("js/app.js підключено");

//Динамічне видалення статичних прикладів карток на початку скрипта
const staticCards = document.querySelectorAll(".cards .card");
staticCards.forEach((card) => card.remove());

const wishlist = [
  {
    title: "Бездротові навушники",
    price: 3500,
    priority: "medium",
    image: "https://via.placeholder.com/150",
  },
  {
    title: "Кубик рубика",
    price: 5000,
    priority: "high",
    image: "https://via.placeholder.com/150",
  },
  {
    title: "Брелок",
    price: 400,
    priority: "low",
    image: "https://via.placeholder.com/150",
  },
  {
    title: "Кубик рубика",
    price: 4000,
    priority: "medium",
    image: "https://via.placeholder.com/150",
  },
  {
    title: "Механічна клавіатура",
    price: 2200,
    priority: "low",
    image: "https://via.placeholder.com/150",
  },
];

//Вибір контейнера одразу після даних
const listContainer = document.querySelector("#wishlist");

//Функція рендеру
function renderWishlist(items) {
  let totalCost = 0;

  //Цикл для обходу масиву даних
  items.forEach((item) => {
    totalCost += item.price; //Підсумовуємо ціни

    //Створення елемента article та вкладених елементів
    const article = document.createElement("article");
    article.classList.add("card");

    //Бейдж пріоритету (span)
    const badgeSpan = document.createElement("span");
    badgeSpan.classList.add("priority-badge");

    //Додаємо відповідний модифікатор класу та текст залежно від пріоритету
    if (item.priority === "high") {
      badgeSpan.classList.add("priority-badge--high");
      badgeSpan.textContent = "Високий пріоритет";
    } else if (item.priority === "medium") {
      badgeSpan.classList.add("priority-badge--medium");
      badgeSpan.textContent = "Середній пріоритет";
    } else {
      badgeSpan.classList.add("priority-badge--low");
      badgeSpan.textContent = "Низький пріоритет";
    }

    //Select для зміни пріоритету вже доданого елемента
    const prioritySelect = document.createElement("select");
    prioritySelect.classList.add("priority-select");
    prioritySelect.hidden = true; //Select прихований, показується по кліку на картку
    [
      ["low", "Низький"],
      ["medium", "Середній"],
      ["high", "Високий"],
    ].forEach(([value, label]) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      option.selected = value === item.priority;
      prioritySelect.append(option);
    });

    //Назва речі (h3)
    const titleElem = document.createElement("h3");
    titleElem.classList.add("card-title");
    titleElem.textContent = item.title;

    //Зображення (img) — плейсхолдер
    const imgElem = document.createElement("img");
    imgElem.src = item.image || "https://via.placeholder.com/150";
    imgElem.alt = item.title;

    //Ціна (p)
    const priceElem = document.createElement("p");
    priceElem.classList.add("card-price");
    priceElem.textContent = `${item.price.toLocaleString()} грн`;

    //Додавання атрибута data-priority та умовного класу priority-high на саму картку (якщо потрібно)
    article.setAttribute("data-priority", item.priority);
    if (item.priority === "high") {
      article.classList.add("priority-high");
    }

    //Збираємо структуру картки у правильному порядку
    article.append(badgeSpan, prioritySelect, titleElem, imgElem, priceElem);

    //Додавання створеного елемента у контейнер всередині циклу
    listContainer.append(article);
  });

  //Оновлення підсумкового елемента (p#total-price)
  const totalPriceElem = document.querySelector("#total-price");
  if (totalPriceElem) {
    totalPriceElem.textContent = `${totalCost.toLocaleString()} грн`;
  }
}

//Виклик функції рендеру одразу після її оголошення
renderWishlist(wishlist);

//Вибір форми та її полів
const form = document.querySelector(".wish-form");
const nameInput = document.querySelector("#wish-name");
const priceInput = document.querySelector("#wish-price");
const priorityInput = document.querySelector("#wish-priority");
const imgInput = document.querySelector("#wish-img");

//Додаткова валідація (input на price): від'ємне значення -> власне повідомлення
priceInput.addEventListener("input", () => {
  if (priceInput.value !== "" && Number(priceInput.value) < 0) {
    priceInput.setCustomValidity("Ціна не може бути від'ємною");
  } else {
    priceInput.setCustomValidity("");
  }
  priceInput.reportValidity();
});

//Обробник submit: додає нове бажання без перезавантаження сторінки
form.addEventListener("submit", (event) => {
  event.preventDefault();

  const title = nameInput.value.trim();
  const price = Number(priceInput.value);
  const priority = priorityInput.value;
  const image = imgInput.value.trim();

  //Додаємо новий об'єкт у масив тієї ж форми, що й наявні елементи
  wishlist.push({
    title,
    price,
    priority,
    image: image || "https://via.placeholder.com/150",
  });

  //Очищаємо контейнер і перемальовуємо список з оновленим масивом
  listContainer.innerHTML = "";
  renderWishlist(wishlist);

  form.reset();
  priceInput.setCustomValidity("");
});

//Друга подія (делегування): change на priority вже доданого елемента.
//Перефарбовуємо позначку без повного перерендеру.
listContainer.addEventListener("change", (event) => {
  const select = event.target.closest(".priority-select");
  if (!select) return;

  const article = select.closest(".card");
  const badge = article.querySelector(".priority-badge");
  const index = Array.from(listContainer.children).indexOf(article);
  const newPriority = select.value;

  wishlist[index].priority = newPriority;

  badge.classList.remove(
    "priority-badge--high",
    "priority-badge--medium",
    "priority-badge--low",
  );
  badge.classList.add(`priority-badge--${newPriority}`);
  badge.textContent = {
    high: "Високий пріоритет",
    medium: "Середній пріоритет",
    low: "Низький пріоритет",
  }[newPriority];

  article.setAttribute("data-priority", newPriority);
  article.classList.toggle("priority-high", newPriority === "high");

  select.hidden = true;
});

listContainer.addEventListener("click", (event) => {
  if (event.target.closest(".priority-select")) return;

  const card = event.target.closest(".card");
  if (!card) return;

  const select = card.querySelector(".priority-select");
  select.hidden = !select.hidden;
});

// Додаткова логіка перевірки бюджету
const withinBudget = (price, budget) => price <= budget;

const currentBudget = 4000;
console.log(`Перевірка доступності у межах бюджету (${currentBudget} грн)`);

for (const item of wishlist) {
  const isAffordable = withinBudget(item.price, currentBudget);
  if (isAffordable) {
    console.log(`Доступно: "${item.title}" за ${item.price} грн`);
  } else {
    console.log(`Занадто дорого: "${item.title}" за ${item.price} грн`);
  }
}
