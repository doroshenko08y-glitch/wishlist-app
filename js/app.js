console.log("js/app.js підключено");

const wishlist = [
  { title: "Бездротові навушники", price: 3500, priority: "medium" },
  { title: "Кубик рубика", price: 5000, priority: "high" },
  { title: "Брелок", price: 400, priority: "low" },
  { title: "Кубик рубика", price: 4000, priority: "medium" },
  { title: "Механічна клавіатура", price: 2200, priority: "low" },
];

//Функція для обробки даних циклом та умовною класифікацією
//Цикл for...of підсумовує загальну вартість, а умова класифікує бажання за пріоритетом
function processWishlist(items) {
  let totalCost = 0;

  console.log("Аналіз списку бажань");

  for (const item of items) {
    totalCost += item.price; //Підсумовуємо загальну вартість

    //Умовна класифікація елементів
    if (item.priority === "high") {
      console.log(`[ВИСОКИЙ ПРІОРИТЕТ] ${item.title} — ${item.price} грн`);
    } else if (item.priority === "medium") {
      console.log(`[Середній пріоритет] ${item.title} — ${item.price} грн`);
    } else {
      console.log(`[Низький пріоритет] ${item.title} — ${item.price} грн`);
    }
  }

  console.log(`Загальна вартість усіх бажань: ${totalCost} грн`);
}

processWishlist(wishlist);

//Стрілкова функція для перевірки, чи вписується річ у бюджет
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
