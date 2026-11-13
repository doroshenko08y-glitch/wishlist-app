console.log("js/app.js підключено");

const API_URL = "https://jsonplaceholder.typicode.com/todos?userId=2";
const PRIORITIES = ["low", "medium", "high"];
const PRIORITY_LABELS = {
  high: "Високий пріоритет",
  medium: "Середній пріоритет",
  low: "Низький пріоритет",
};
const DEFAULT_PRICE = 1500;

const LS_STORAGE_KEY = "wishlist_items_ls";
const LS_MIGRATED_FLAG = "wishlist_migrated_to_idb";
const LS_BUDGET_KEY = "wishlist_current_budget";
const DB_NAME = "WishlistDB";
const DB_VERSION = 1;
const STORE_NAME = "wishes";

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

function saveToLocalStorage(items) {
  try {
    localStorage.setItem(LS_STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error("Помилка збереження у localStorage:", error);
  }
}

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

function openDB() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("Ваш браузер не підтримує IndexedDB."));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) =>
      reject(
        event.target.error ||
          new Error("Не вдалося відкрити базу даних IndexedDB."),
      );
  });
}

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

const addItem = saveItemToDB;
const updateItem = saveItemToDB;

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
        if (
          e.target.closest(".priority-select") ||
          e.target.closest(".purchased-checkbox-label") ||
          e.target.closest(".btn-delete") ||
          e.target.closest("a")
        ) {
          return;
        }
        setIsSelectOpen(!isSelectOpen);
      }}
    >
      <span className={`priority-badge priority-badge--${itemPriority}`}>
        {PRIORITY_LABELS[itemPriority]}
      </span>

      <label className="purchased-checkbox-label">
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

      <h3 className="card-title">
        <a href={`#/wishes/${id}`} data-link>
          {title}
        </a>
      </h3>
      <img src={url || "https://via.placeholder.com/150"} alt={title} />
      <p className="card-price">{itemPrice.toLocaleString()} грн</p>

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

// Форма додавання бажання
function WishForm({ onAddWish }) {
  const [name, setName] = React.useState("");
  const [price, setPrice] = React.useState("");
  const [priority, setPriority] = React.useState("medium");
  const [url, setUrl] = React.useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddWish({
      id: Date.now(),
      title: name.trim(),
      price: price ? Number(price) : DEFAULT_PRICE,
      priority,
      url: url.trim() || "https://via.placeholder.com/150",
      purchased: false,
    });

    setName("");
    setPrice("");
    setPriority("medium");
    setUrl("");
  };

  return (
    <form id="wish-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="wish-name">Назва речі:</label>
        <input
          type="text"
          id="wish-name"
          placeholder="Наприклад, Навушники"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="wish-price">Ціна (грн):</label>
        <input
          type="number"
          id="wish-price"
          placeholder="1500"
          min="0"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="wish-priority">Пріоритет:</label>
        <select
          id="wish-priority"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
        >
          <option value="low">Низький</option>
          <option value="medium">Середній</option>
          <option value="high">Високий</option>
        </select>
      </div>
      <div className="form-group">
        <label htmlFor="wish-url">
          Посилання на товар або зображення (URL):
        </label>
        <input
          type="url"
          id="wish-url"
          placeholder="https://example.com/item"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
      </div>
      <button type="submit" className="btn-add" style={{ marginTop: "1rem" }}>
        Додати до списку
      </button>
    </form>
  );
}

// Сайдбар підсумків та бюджету
function SummaryAside({ totalCost }) {
  const [budget, setBudget] = React.useState(() => {
    try {
      return localStorage.getItem(LS_BUDGET_KEY) || "";
    } catch (e) {
      return "";
    }
  });

  const numericBudget = Number(budget) || 0;
  const percent =
    totalCost > 0
      ? Math.min(Math.round((numericBudget / totalCost) * 100), 100)
      : 0;
  const left = Math.max(totalCost - numericBudget, 0);

  const handleBudgetChange = (e) => {
    const val = e.target.value;
    setBudget(val);
    try {
      localStorage.setItem(LS_BUDGET_KEY, val);
    } catch (e) {}
  };

  return (
    <aside id="summary-aside" className="summary-box">
      <h2>Підсумкова сума</h2>
      <p>Загальна вартість усіх бажань:</p>
      <p id="total-price" className="total-amount">
        {totalCost.toLocaleString()} грн
      </p>

      <form
        className="budget-box"
        id="budget-form"
        autoComplete="off"
        onSubmit={(e) => e.preventDefault()}
      >
        <label htmlFor="current-budget">Поточний бюджет (грн):</label>
        <div className="budget-row">
          <input
            type="number"
            id="current-budget"
            min="0"
            step="100"
            placeholder="Наприклад, 5000"
            inputMode="numeric"
            value={budget}
            onChange={handleBudgetChange}
          />
        </div>
      </form>

      <p className="progress-label">
        Накопичено на купівлю: <span id="progress-percent">{percent}</span>%
      </p>
      <div className="progress-track">
        <div
          className={`progress-fill ${percent >= 100 ? "complete" : ""}`}
          id="progress-fill"
          style={{ width: `${percent}%` }}
        ></div>
      </div>
      <p className="progress-hint" id="progress-hint">
        {totalCost === 0
          ? ""
          : percent >= 100
            ? "Бюджету достатньо для всіх бажань!"
            : `Ще потрібно: ${left.toLocaleString("uk-UA")} грн`}
      </p>
    </aside>
  );
}

// ===================================================================
// РОУТИНГ (hash-based). Адреса виглядає як index.html#/wishes/5,
// тому для перевірки не потрібен локальний сервер.
// Таблиця маршрутів: шлях-патерн -> view-функція (React-компонент).
// «:id» - параметр, його значення витягує matchRoute().
// ===================================================================
const routes = [
  { path: "/", view: HomeView }, // список бажаних товарів
  { path: "/wishes/:id", view: WishDetailsView }, // деталі товару (price, url)
  { path: "/purchased", view: PurchasedView }, // фільтр purchased: true
];

// Поточний шлях із hash: "#/wishes/5?x=1" -> "/wishes/5"
function getCurrentPath() {
  const path = window.location.hash.slice(1).split("?")[0];
  return path || "/";
}

// Порівнює шлях із патернами; повертає { route, params } або null
function matchRoute(path) {
  const pathParts = path.split("/").filter(Boolean);

  for (const route of routes) {
    const patternParts = route.path.split("/").filter(Boolean);
    if (patternParts.length !== pathParts.length) continue;

    const params = {};
    try {
      const isMatch = patternParts.every((part, i) => {
        if (part.startsWith(":")) {
          params[part.slice(1)] = decodeURIComponent(pathParts[i]);
          return true;
        }
        return part === pathParts[i];
      });
      if (isMatch) return { route, params };
    } catch (error) {
      return null; // некоректне кодування в URL
    }
  }
  return null;
}

// Клієнтська навігація: змінюємо hash -> спрацьовує hashchange
function navigate(path) {
  if (getCurrentPath() === path) return;
  window.location.hash = path;
}

// Хук: стежить за hashchange (кнопки «назад»/«вперед») і
// перехоплює кліки по посиланнях із атрибутом data-link
function useCurrentPath() {
  const [path, setPath] = React.useState(getCurrentPath);

  React.useEffect(() => {
    const handleHashChange = () => setPath(getCurrentPath());

    const handleLinkClick = (e) => {
      const link = e.target.closest("a[data-link]");
      if (!link) return;
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      navigate(link.getAttribute("href").replace(/^#/, "") || "/");
    };

    window.addEventListener("hashchange", handleHashChange);
    document.addEventListener("click", handleLinkClick);
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
      document.removeEventListener("click", handleLinkClick);
    };
  }, []);

  return path;
}

function isHttpUrl(value) {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch (error) {
    return false;
  }
}

// ---------- View-функції ----------

// Сітка карток (спільна для «/» та «/purchased»)
function WishCards({ items, handlers }) {
  return (
    <div className="cards">
      {items.map((item) => (
        <WishItem
          key={item.id}
          {...item}
          onTogglePurchased={() => handlers.onTogglePurchased(item)}
          onChangePriority={handlers.onChangePriority}
          onDelete={handlers.onDelete}
        />
      ))}
    </div>
  );
}

// Фільтр-чекбокс «Лише куплені»: увімкнено -> маршрут «/purchased», вимкнено -> «/»
function PurchasedFilter({ checked, wishlist }) {
  const purchasedCount = wishlist.filter((item) => item.purchased).length;

  return (
    <label className="filter-checkbox">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => navigate(e.target.checked ? "/purchased" : "/")}
      />
      Показати лише куплені ({purchasedCount})
    </label>
  );
}

// «/» - форма додавання + усі бажання
function HomeView({
  wishlist,
  statusMessage,
  isLoading,
  onReload,
  onAddWish,
  handlers,
}) {
  return (
    <>
      <section id="add-wish-section" className="add-wish-section">
        <h2>Додати бажання</h2>
        <WishForm onAddWish={onAddWish} />
      </section>

      <div style={{ margin: "1rem 0" }}>
        <button
          type="button"
          className="btn-add"
          onClick={onReload}
          disabled={isLoading}
        >
          {isLoading ? "Оновлення..." : "Оновити"}
        </button>
      </div>

      <section id="wish-list-section">
        <h2>Мої бажання</h2>
        <PurchasedFilter checked={false} wishlist={wishlist} />
        {statusMessage && <div className="status-message">{statusMessage}</div>}
        <WishCards items={wishlist} handlers={handlers} />
      </section>
    </>
  );
}

// «/purchased» - лише товари з purchased: true
function PurchasedView({ wishlist, isReady, handlers }) {
  const purchased = wishlist.filter((item) => item.purchased);

  return (
    <section id="purchased-section">
      <h2>Куплені бажання</h2>
      <PurchasedFilter checked={true} wishlist={wishlist} />
      {!isReady ? (
        <div className="status-message">Завантаження...</div>
      ) : purchased.length === 0 ? (
        <div className="status-message">Куплених товарів поки немає.</div>
      ) : (
        <WishCards items={purchased} handlers={handlers} />
      )}
    </section>
  );
}

// «/wishes/:id» - деталі одного товару
function WishDetailsView({ params, wishlist, isReady, handlers }) {
  const item = wishlist.find((el) => String(el.id) === params.id);

  if (!item) {
    if (!isReady) {
      return <div className="status-message">Завантаження...</div>;
    }
    return <NotFoundView message="Бажання з таким id не знайдено." />;
  }

  const priority = item.priority || "medium";

  return (
    <section id="wish-details" className="wish-details">
      <a href="#/" data-link className="back-link">
        ← До списку
      </a>
      <h2>{item.title}</h2>

      <span className={`priority-badge priority-badge--${priority}`}>
        {PRIORITY_LABELS[priority]}
      </span>

      <img src={item.url} alt={item.title} className="wish-details-img" />

      <dl className="wish-details-list">
        <dt>Ціна</dt>
        <dd className="card-price">{item.price.toLocaleString()} грн</dd>

        <dt>Посилання (url)</dt>
        <dd>
          {isHttpUrl(item.url) ? (
            <a href={item.url} target="_blank" rel="noopener noreferrer">
              {item.url}
            </a>
          ) : (
            item.url
          )}
        </dd>

        <dt>Статус</dt>
        <dd>{item.purchased ? "Куплено" : "Ще не куплено"}</dd>
      </dl>

      <div className="wish-details-actions">
        <button
          type="button"
          className="btn-add"
          onClick={() => handlers.onTogglePurchased(item)}
        >
          {item.purchased ? "Позначити як не куплене" : "Позначити як куплене"}
        </button>
        <button
          type="button"
          className="btn-delete"
          onClick={async () => {
            await handlers.onDelete(item.id);
            navigate("/");
          }}
        >
          Видалити
        </button>
      </div>
    </section>
  );
}

// Сторінка «Не знайдено» (matchRoute() повернув null або немає запису)
function NotFoundView({ message = "Такої сторінки не існує." }) {
  return (
    <section id="not-found">
      <h2>Не знайдено</h2>
      <p>{message}</p>
      <a href="#/" data-link className="btn-add">
        На головну
      </a>
    </section>
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
  // true, коли початкове завантаження даних завершилось (потрібно для сторінки деталей)
  const [isReady, setIsReady] = React.useState(false);

  const refreshFromIDB = async () => {
    const items = await getAllItems();
    const sortedItems = [...items].sort((a, b) => b.id - a.id);
    setWishlist(sortedItems);
    saveToLocalStorage(sortedItems);
    setStatusMessage(sortedItems.length === 0 ? "Список бажань порожній." : "");
  };

  const initStorage = async () => {
    setIsLoading(true);
    setStatusMessage("Ініціалізація сховища...");
    try {
      await openDB();
      setDbErrorMessage("");

      let idbItems = await getAllItems();
      const isMigrated = localStorage.getItem(LS_MIGRATED_FLAG) === "true";

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
      setIsReady(true);
    }
  };

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

  const handleAddWish = async (newItem) => {
    const normalized = normalizeWishItem(newItem);
    try {
      await addItem(normalized);
      await refreshFromIDB();
    } catch (error) {
      console.error("Не вдалося додати запис в IndexedDB:", error);
      setWishlist((prev) => {
        const next = [normalized, ...prev];
        saveToLocalStorage(next);
        return next;
      });
    }
  };

  const path = useCurrentPath();

  // При зміні маршруту: прокрутка вгору + підсвічування активного пункту меню
  React.useEffect(() => {
    window.scrollTo(0, 0);
    document.querySelectorAll("nav a[data-link]").forEach((link) => {
      const target = link.getAttribute("href").replace(/^#/, "") || "/";
      if (target === path) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }, [path]);

  const handlers = {
    onTogglePurchased: handleTogglePurchased,
    onChangePriority: handleChangePriority,
    onDelete: handleDeleteItem,
  };

  const totalCost = React.useMemo(() => {
    return wishlist
      .filter((item) => !item.purchased)
      .reduce((sum, item) => sum + (item.price ?? DEFAULT_PRICE), 0);
  }, [wishlist]);

  // Вибір view за поточним шляхом
  const match = matchRoute(path);
  const View = match ? match.route.view : NotFoundView;
  const viewProps = {
    params: match ? match.params : {},
    wishlist,
    statusMessage,
    isLoading,
    isReady,
    onReload: handleReloadFromAPI,
    onAddWish: handleAddWish,
    handlers,
  };

  return (
    <div className="page-wrapper">
      {/* Єдиний контейнер, куди рендеряться усі «сторінки» */}
      <main id="app">
        {dbErrorMessage && <div className="db-error">{dbErrorMessage}</div>}
        <View {...viewProps} />
      </main>

      {/* Сайдбар підсумків видно на всіх маршрутах */}
      <SummaryAside totalCost={totalCost} />
    </div>
  );
}

// Монтування в єдиний загальний #root
const rootElement = document.querySelector("#root");
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<WishListApp />);
}
