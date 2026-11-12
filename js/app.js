// Обрано React через зручність декларативного керування станом та компонентами.
console.log("js/app.js підключено");

const API_URL = "https://jsonplaceholder.typicode.com/todos?userId=2";
const PRIORITIES = ["low", "medium", "high"];
const PRIORITY_LABELS = {
  high: "Високий пріоритет",
  medium: "Середній пріоритет",
  low: "Низький пріоритет",
};
const DEFAULT_PRICE = 1500;
const CURRENT_BUDGET = 4000;

// Константи для роботи з localStorage та IndexedDB (Варіант 7: wishes, keyPath: "id")
const LS_STORAGE_KEY = "wishlist_items_ls";
const LS_MIGRATED_FLAG = "wishlist_migrated_to_idb";
const DB_NAME = "WishlistDB";
const DB_VERSION = 1;
const STORE_NAME = "wishes";

// Допоміжна функція для приведення запису до актуальної моделі даних { id, title, price, url, purchased, priority }
function normalizeWishItem(item) {
  return {
    id: item.id ?? Date.now(),
    title: item.title || item.name || "Без назви",
    price: Number(item.price ?? DEFAULT_PRICE),
    url: item.url || item.image || "https://via.placeholder.com/150",
    purchased: Boolean(item.purchased ?? item.completed ?? false),
    priority:
      item.priority || (item.purchased || item.completed ? "low" : "medium"),
  };
}

// Допоміжна функція для збагачення даних з API відповідно до моделі даних
function enrichTodo(todo) {
  return normalizeWishItem({
    id: todo.id,
    title: todo.title,
    price: ((todo.id % 10) + 1) * 350,
    url: "https://via.placeholder.com/150",
    purchased: todo.completed,
    priority: todo.completed ? "low" : PRIORITIES[todo.id % 3],
  });
}

// Зберігає масив бажань у localStorage у форматі JSON
function saveToLocalStorage(items) {
  try {
    localStorage.setItem(LS_STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error("Помилка збереження у localStorage:", error);
  }
}

// Завантажує та розбирає масив бажань із localStorage з обробкою помилок парсингу
function loadFromLocalStorage() {
  try {
    const rawData = localStorage.getItem(LS_STORAGE_KEY);
    if (!rawData) return [];
    const parsed = JSON.parse(rawData);
    return Array.isArray(parsed) ? parsed.map(normalizeWishItem) : [];
  } catch (error) {
    console.error("Помилка розбору даних із localStorage:", error);
    return [];
  }
}

// Відкриває з'єднання з базою даних IndexedDB та створює object store при першому запуску
function openDB() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("Ваш браузер не підтримує IndexedDB."));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      // Створюємо сховище "wishes" із первинним ключем "id", якщо воно ще не існує
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      reject(
        event.target.error ||
          new Error("Не вдалося відкрити базу даних IndexedDB."),
      );
    };
  });
}

// Додає новий або оновлює існуючий запис у сховищі IndexedDB (метод put)
async function saveItemToDB(item) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(normalizeWishItem(item));

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Псевдоніми для чіткого розділення операцій створення та оновлення
const addItem = saveItemToDB;
const updateItem = saveItemToDB;

// Отримує всі записи зі сховища "wishes" у режимі читання (readonly)
async function getAllItems() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

// Видаляє запис зі сховища "wishes" за його унікальним ідентифікатором id
async function deleteItem(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Компонент картки окремого бажання
function WishItem({
  id,
  title,
  price,
  priority,
  purchased,
  url,
  onTogglePurchased,
  onChangePriority,
  onDelete,
}) {
  const [isSelectOpen, setIsSelectOpen] = React.useState(false);

  const itemPriority = priority || (purchased ? "low" : "medium");
  const itemPrice = price ?? DEFAULT_PRICE;

  return (
    <article
      className={`card ${itemPriority === "high" ? "priority-high" : ""} ${
        purchased ? "card--purchased" : ""
      }`}
      data-priority={itemPriority}
      onClick={(e) => {
        // Ігноруємо клік по картці, якщо користувач взаємодіє з елементами керування
        if (
          e.target.closest(".priority-select") ||
          e.target.closest(".purchased-checkbox-label") ||
          e.target.closest(".btn-delete")
        ) {
          return;
        }
        setIsSelectOpen(!isSelectOpen);
      }}
    >
      <span className={`priority-badge priority-badge--${itemPriority}`}>
        {PRIORITY_LABELS[itemPriority]}
      </span>

      <label
        className="purchased-checkbox-label"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          fontSize: "0.85rem",
          cursor: "pointer",
        }}
      >
        {/* Чекбокс позначення товару як придбаного (оновлює поле purchased через put) */}
        <input
          type="checkbox"
          className="purchased-checkbox"
          checked={Boolean(purchased)}
          onChange={onTogglePurchased}
        />
        Куплено
      </label>

      <select
        className="priority-select"
        hidden={!isSelectOpen}
        value={itemPriority}
        onChange={(e) => {
          onChangePriority(id, e.target.value);
          setIsSelectOpen(false);
        }}
      >
        <option value="low">Низький</option>
        <option value="medium">Середній</option>
        <option value="high">Високий</option>
      </select>

      <h3 className="card-title">{title}</h3>
      <img src={url || "https://via.placeholder.com/150"} alt={title} />
      <p className="card-price">{itemPrice.toLocaleString()} грн</p>

      {/* Кнопка видалення товару зі списку (викликає deleteItem) */}
      <button
        type="button"
        className="btn-delete"
        onClick={() => onDelete(id)}
        style={{
          marginTop: "0.5rem",
          padding: "0.35rem 0.75rem",
          backgroundColor: "#b83256",
          color: "#fff",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "0.85rem",
        }}
      >
        Видалити
      </button>
    </article>
  );
}

// Головний компонент додатку
function WishListApp() {
  const [wishlist, setWishlist] = React.useState([]);
  const [statusMessage, setStatusMessage] = React.useState(
    "Завантаження списку бажань...",
  );
  const [dbErrorMessage, setDbErrorMessage] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  // Синхронізує стан компонента зі сховищем IndexedDB та дублює в localStorage
  const refreshFromIDB = async () => {
    const items = await getAllItems();
    // Сортуємо так, щоб найновіші (з більшим id) відображалися зверху
    const sortedItems = [...items].sort((a, b) => b.id - a.id);
    setWishlist(sortedItems);
    saveToLocalStorage(sortedItems);
    setStatusMessage(sortedItems.length === 0 ? "Список бажань порожній." : "");
  };

  // Ініціалізація даних: перевірка IndexedDB, одноразова міграція з localStorage або завантаження з API
  const initStorage = async () => {
    setIsLoading(true);
    setStatusMessage("Ініціалізація сховища...");
    try {
      await openDB();
      setDbErrorMessage("");

      let idbItems = await getAllItems();
      const isMigrated = localStorage.getItem(LS_MIGRATED_FLAG) === "true";

      // Одноразова міграція даних із localStorage в IndexedDB, якщо сховище порожнє
      if (!isMigrated && idbItems.length === 0) {
        const lsItems = loadFromLocalStorage();
        if (lsItems.length > 0) {
          for (const item of lsItems) {
            await addItem(item);
          }
          localStorage.setItem(LS_MIGRATED_FLAG, "true");
          idbItems = await getAllItems();
        }
      }

      // Якщо обидва локальні сховища порожні — завантажуємо початкові приклади з API
      if (idbItems.length === 0) {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error(`Помилка HTTP: ${response.status}`);
        const data = await response.json();
        const apiItems = data.map(enrichTodo);

        for (const item of apiItems) {
          await addItem(item);
        }
        localStorage.setItem(LS_MIGRATED_FLAG, "true");
      }

      await refreshFromIDB();
    } catch (error) {
      console.error("Помилка роботи з IndexedDB:", error);
      // Повідомлення користувачу при недоступності IndexedDB та перехід на резервний localStorage
      setDbErrorMessage(
        "Увага: база даних IndexedDB недоступна (можливо, увімкнено приватний режим). Дані тимчасово зберігаються лише в localStorage.",
      );
      const fallbackItems = loadFromLocalStorage();
      setWishlist(fallbackItems);
      setStatusMessage(
        fallbackItems.length === 0 ? "Список бажань порожній." : "",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Примусове оновлення початкових даних із зовнішнього API
  const handleReloadFromAPI = async () => {
    setIsLoading(true);
    setStatusMessage("Оновлення списку з сервера...");
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error(`Помилка HTTP: ${response.status}`);
      const data = await response.json();
      const apiItems = data.map(enrichTodo);

      for (const item of apiItems) {
        await addItem(item);
      }
      setDbErrorMessage("");
      await refreshFromIDB();
    } catch (error) {
      console.error("Деталі помилки:", error);
      // Якщо це помилка доступу до IndexedDB, показуємо червоний банер
      if (error.message && error.message.includes("IndexedDB")) {
        setDbErrorMessage(
          "Увага: база даних IndexedDB недоступна. Дані тимчасово зберігаються лише в localStorage.",
        );
        setStatusMessage("");
      } else {
        setStatusMessage("Список бажань недоступний офлайн.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    initStorage();
  }, []);

  // Позначення «куплено» (put з оновленим полем purchased)
  const handleTogglePurchased = async (item) => {
    const updatedItem = { ...item, purchased: !item.purchased };
    try {
      await updateItem(updatedItem);
      await refreshFromIDB();
    } catch (error) {
      console.error("Не вдалося оновити статус покупки в IndexedDB:", error);
      setWishlist((prev) => {
        const next = prev.map((el) => (el.id === item.id ? updatedItem : el));
        saveToLocalStorage(next);
        return next;
      });
    }
  };

  // Оновлення пріоритету бажання через put у IndexedDB
  const handleChangePriority = async (id, newPriority) => {
    const target = wishlist.find((item) => item.id === id);
    if (!target) return;

    const updatedItem = { ...target, priority: newPriority };
    try {
      await updateItem(updatedItem);
      await refreshFromIDB();
    } catch (error) {
      console.error("Не вдалося оновити пріоритет в IndexedDB:", error);
      setWishlist((prev) => {
        const next = prev.map((el) => (el.id === id ? updatedItem : el));
        saveToLocalStorage(next);
        return next;
      });
    }
  };

  // Видалення товару зі списку (delete у IndexedDB)
  const handleDeleteItem = async (id) => {
    try {
      await deleteItem(id);
      await refreshFromIDB();
    } catch (error) {
      console.error("Не вдалося видалити запис з IndexedDB:", error);
      setWishlist((prev) => {
        const next = prev.filter((el) => el.id !== id);
        saveToLocalStorage(next);
        return next;
      });
    }
  };

  // Розрахунок бюджету та оновлення DOM для підсумку (враховуємо лише ще не куплені товари)
  React.useEffect(() => {
    const totalCost = wishlist
      .filter((item) => !item.purchased)
      .reduce((sum, item) => sum + (item.price ?? DEFAULT_PRICE), 0);

    const totalPriceElem = document.querySelector("#total-price");
    if (totalPriceElem) {
      totalPriceElem.textContent = `${totalCost.toLocaleString()} грн`;
    }

    console.log(
      `Перевірка доступності у межах бюджету (${CURRENT_BUDGET} грн)`,
    );
    for (const item of wishlist) {
      if (item.purchased) continue;
      const itemPrice = item.price ?? DEFAULT_PRICE;
      if (itemPrice <= CURRENT_BUDGET) {
        console.log(`Доступно: "${item.title}" за ${itemPrice} грн`);
      } else {
        console.log(`Занадто дорого: "${item.title}" за ${itemPrice} грн`);
      }
    }
  }, [wishlist]);

  // Обробник сабміту форми додавання нового бажання
  React.useEffect(() => {
    const form = document.querySelector("#wish-form");
    if (!form) return;

    const handleFormSubmit = async (e) => {
      e.preventDefault();
      const nameInput = document.querySelector("#wish-name");
      const priceInput = document.querySelector("#wish-price");
      const priorityInput = document.querySelector("#wish-priority");
      const urlInput = document.querySelector("#wish-url");

      const newItem = normalizeWishItem({
        id: Date.now(),
        title: nameInput.value.trim(),
        price: Number(priceInput.value),
        priority: priorityInput.value,
        url: urlInput.value.trim() || "https://via.placeholder.com/150",
        purchased: false,
      });

      try {
        await addItem(newItem);
        await refreshFromIDB();
      } catch (error) {
        console.error("Не вдалося додати запис в IndexedDB:", error);
        setWishlist((prev) => {
          const next = [newItem, ...prev];
          saveToLocalStorage(next);
          return next;
        });
      }

      form.reset();
    };

    form.addEventListener("submit", handleFormSubmit);
    return () => form.removeEventListener("submit", handleFormSubmit);
  }, []);

  return (
    <div>
      {/* Повідомлення про помилку доступу до IndexedDB (якщо виникла) */}
      {dbErrorMessage && (
        <div
          style={{
            padding: "0.75rem 1rem",
            marginBottom: "1rem",
            backgroundColor: "#fde8e8",
            color: "#9b1c1c",
            border: "1px solid #f8b4b4",
            borderRadius: "6px",
            fontWeight: "500",
          }}
        >
          {dbErrorMessage}
        </div>
      )}

      {statusMessage && (
        <div
          style={{
            margin: "1rem 0",
            fontWeight: "600",
            color: statusMessage.includes("недоступний")
              ? "#b83256"
              : "var(--primary)",
          }}
        >
          {statusMessage}
        </div>
      )}

      <button
        className="btn-add"
        style={{ marginBottom: "1rem", display: "inline-block" }}
        onClick={handleReloadFromAPI}
        disabled={isLoading}
      >
        оновити
      </button>

      {/* Рендер списку бажань із даними, отриманими з IndexedDB */}
      <div className="cards">
        {wishlist.map((item) => (
          <WishItem
            key={item.id}
            id={item.id}
            title={item.title}
            price={item.price}
            priority={item.priority}
            purchased={item.purchased}
            url={item.url}
            onTogglePurchased={() => handleTogglePurchased(item)}
            onChangePriority={handleChangePriority}
            onDelete={handleDeleteItem}
          />
        ))}
      </div>
    </div>
  );
}
(function () {
  const LS_BUDGET_KEY = "wishlist_current_budget";

  function init() {
    const totalEl = document.querySelector("#total-price");
    const budgetInput = document.querySelector("#current-budget");
    const fillEl = document.querySelector("#progress-fill");
    const percentEl = document.querySelector("#progress-percent");
    const hintEl = document.querySelector("#progress-hint");

    if (!totalEl || !budgetInput || !fillEl || !percentEl) return;

    let shownPercent = 0;

    function getTotal() {
      return Number(totalEl.textContent.replace(/\D/g, "")) || 0;
    }

    function animateNumber(from, to, duration = 800) {
      const start = performance.now();
      function frame(now) {
        const t = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        percentEl.textContent = Math.round(from + (to - from) * eased);
        if (t < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }

    function update() {
      const total = getTotal();
      const budget = Number(budgetInput.value) || 0;
      const percent =
        total > 0 ? Math.min(Math.round((budget / total) * 100), 100) : 0;

      fillEl.style.width = percent + "%";
      animateNumber(shownPercent, percent);
      shownPercent = percent;
      fillEl.classList.toggle("complete", percent >= 100);

      if (hintEl) {
        const left = Math.max(total - budget, 0);
        hintEl.textContent =
          total === 0
            ? ""
            : percent >= 100
              ? "Бюджету достатньо для всіх бажань!"
              : `Ще потрібно: ${left.toLocaleString("uk-UA")} грн`;
      }

      try {
        localStorage.setItem(LS_BUDGET_KEY, String(budget));
      } catch (e) {}
    }

    // Оновлення при введенні бюджету
    budgetInput.addEventListener("input", update);

    // Автооновлення, коли React змінює суму (додавання, видалення, "куплено")
    new MutationObserver(update).observe(totalEl, {
      childList: true,
      characterData: true,
      subtree: true,
    });

    // Відновлення збереженого бюджету
    try {
      budgetInput.value = localStorage.getItem(LS_BUDGET_KEY) || "";
    } catch (e) {}
    update();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

// Монтування React-додатку в корінь
const rootElement = document.querySelector("#root");
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<WishListApp />);
}
