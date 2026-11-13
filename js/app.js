// Крок 1: Обрано React через зручність декларативного керування станом та компонентами.
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

// Допоміжна функція для збагачення даних з API
function enrichTodo(todo) {
  return {
    ...todo,
    price: ((todo.id % 10) + 1) * 350,
    priority: todo.completed ? "low" : PRIORITIES[todo.id % 3],
  };
}

// Компонент картки бажання
function WishItem({
  id,
  name,
  price,
  priority,
  completed,
  image,
  onToggle,
  onChangePriority,
}) {
  const [isSelectOpen, setIsSelectOpen] = React.useState(false);

  const itemPriority = priority || (completed ? "low" : "medium");
  const itemPrice = price ?? DEFAULT_PRICE;

  return (
    <article
      className={`card ${itemPriority === "high" ? "priority-high" : ""} ${
        completed ? "card--purchased" : ""
      }`}
      data-priority={itemPriority}
      onClick={(e) => {
        if (
          e.target.closest(".priority-select") ||
          e.target.closest(".purchased-checkbox-label")
        )
          return;
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
        <input
          type="checkbox"
          className="purchased-checkbox"
          checked={Boolean(completed)}
          onChange={onToggle}
        />
        Придбано
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

      <h3 className="card-title">{name}</h3>
      <img src={image || "https://via.placeholder.com/150"} alt={name} />
      <p className="card-price">{itemPrice.toLocaleString()} грн</p>
    </article>
  );
}

// Компонент форми додавання (керується станом React через події onChange)
function WishForm({ onAddWish }) {
  const [name, setName] = React.useState("");
  const [price, setPrice] = React.useState("");
  const [priority, setPriority] = React.useState("medium");
  const [image, setImage] = React.useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddWish({
      id: Date.now(),
      title: name.trim(),
      price: price ? Number(price) : DEFAULT_PRICE,
      priority: priority,
      image: image.trim() || "https://via.placeholder.com/150",
      completed: false,
    });

    // Скидання полів форми через стан
    setName("");
    setPrice("");
    setPriority("medium");
    setImage("");
  };

  return (
    <section className="add-wish-section">
      <h2>Додати бажання</h2>
      <form onSubmit={handleSubmit}>
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
          <label htmlFor="wish-img">Зображення речі (URL):</label>
          <input
            type="url"
            id="wish-img"
            placeholder="URL зображення"
            value={image}
            onChange={(e) => setImage(e.target.value)}
          />
        </div>
        <button type="submit" className="btn-add" style={{ marginTop: "1rem" }}>
          Додати до списку
        </button>
      </form>
    </section>
  );
}

// Головний компонент додатку
function WishListApp() {
  const [wishlist, setWishlist] = React.useState([]);
  const [statusMessage, setStatusMessage] = React.useState(
    "Завантаження списку бажань...",
  );
  const [isLoading, setIsLoading] = React.useState(false);

  // Завантаження даних з API при монтуванні
  const loadData = async () => {
    setIsLoading(true);
    setStatusMessage("Завантаження списку бажань...");
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error(`Помилка HTTP: ${response.status}`);
      const data = await response.json();

      const apiItems = data.map(enrichTodo);
      setWishlist(apiItems);
      setStatusMessage(apiItems.length === 0 ? "Список бажань порожній." : "");
    } catch (error) {
      console.error("Деталі помилки:", error);
      setStatusMessage("Список бажань недоступний офлайн.");
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    loadData();
  }, []);

  const handleToggle = (id) => {
    setWishlist((prevList) =>
      prevList.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item,
      ),
    );
  };

  const handleChangePriority = (id, newPriority) => {
    setWishlist((prevList) =>
      prevList.map((item) =>
        item.id === id ? { ...item, priority: newPriority } : item,
      ),
    );
  };

  const handleAddWish = (newItem) => {
    setWishlist((prev) => [newItem, ...prev]);
    setStatusMessage("");
  };

  // Декларативний розрахунок загальної вартості
  const totalCost = wishlist
    .filter((item) => !item.completed)
    .reduce((sum, item) => sum + (item.price ?? DEFAULT_PRICE), 0);

  // Консольні перевірки бюджету без DOM-маніпуляцій
  React.useEffect(() => {
    console.log(
      `Перевірка доступності у межах бюджету (${CURRENT_BUDGET} грн)`,
    );
    for (const item of wishlist) {
      if (item.completed) continue;
      const itemPrice = item.price ?? DEFAULT_PRICE;
      if (itemPrice <= CURRENT_BUDGET) {
        console.log(`Доступно: "${item.title}" за ${itemPrice} грн`);
      } else {
        console.log(`Занадто дорого: "${item.title}" за ${itemPrice} грн`);
      }
    }
  }, [wishlist]);

  return (
    <div className="page-wrapper">
      <main>
        {/* Форма як React-компонент */}
        <WishForm onAddWish={handleAddWish} />

        <section id="wish-list-section">
          <h2>Мої бажання</h2>
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
            onClick={loadData}
            disabled={isLoading}
          >
            Оновити список
          </button>

          <div className="cards">
            {wishlist.map((item) => (
              <WishItem
                key={item.id}
                id={item.id}
                name={item.title}
                price={item.price}
                priority={item.priority}
                completed={item.completed}
                image={item.image}
                onToggle={() => handleToggle(item.id)}
                onChangePriority={handleChangePriority}
              />
            ))}
          </div>
        </section>
      </main>

      {/* Підсумок рендериться декларативно через стан */}
      <aside id="summary-aside" className="summary-box">
        <h2>Підсумкова сума</h2>
        <p>Загальна вартість усіх бажань:</p>
        <p className="total-amount">{totalCost.toLocaleString()} грн</p>
      </aside>
    </div>
  );
}

// Монтування в єдиний корінь
const rootElement = document.querySelector("#root");
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<WishListApp />);
}
