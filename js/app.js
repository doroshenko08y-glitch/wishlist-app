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
    article.append(badgeSpan, titleElem, imgElem, priceElem);

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
