// Локальний сервер «Список бажань» (Express).
// Роздає API (/api/wishes, /api/wishes/:id) і статичні файли клієнта з теки public/.
const express = require("express");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const app = express();

// Крок 4: локальні дані читаємо з JSON-файлу один раз під час старту
const wishes = JSON.parse(
  fs.readFileSync(path.join(__dirname, "data", "wishes.json"), "utf-8"),
);

// Крок 5: список усіх бажань. res.json() сам ставить Content-Type: application/json
app.get("/api/wishes", (req, res) => {
  res.json(wishes);
});

// Крок 6: один товар за id або 404 із JSON-повідомленням
app.get("/api/wishes/:id", (req, res) => {
  const wish = wishes.find((item) => String(item.id) === req.params.id);
  if (!wish) {
    return res
      .status(404)
      .json({ error: `Бажання з id «${req.params.id}» не знайдено` });
  }
  res.json(wish);
});

// Крок 10: будь-який інший шлях /api/... теж повертає JSON 404, а не HTML
app.use("/api", (req, res) => {
  res.status(404).json({ error: "Такого ендпоінта не існує" });
});

// Крок 7: статичні файли клієнта (index.html, css/, js/, img/)
app.use(express.static(path.join(__dirname, "public")));

// Усе, що не знайшлося ні в API, ні серед статичних файлів
app.use((req, res) => {
  res.status(404).json({ error: "Не знайдено" });
});

// Обробник неочікуваних помилок сервера
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Внутрішня помилка сервера" });
});

app.listen(PORT, () => {
  console.log(`Сервер запущено: http://localhost:${PORT}`);
});
