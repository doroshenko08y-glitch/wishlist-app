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

// Крок 4: Створення компонента елемента списку WishItem
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
        {/* Крок 6: Клік по чекбоксу викликає callback-prop onToggle */}
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

// Головний компонент додатку
function WishListApp() {
  // Крок 3: Перенесення даних у реактивний стан useState
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

  // Обробник зміни стану придбано (toggle)
  const handleToggle = (id) => {
    setWishlist((prevList) =>
      prevList.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item,
      ),
    );
  };

  // Обробник зміни пріоритету
  const handleChangePriority = (id, newPriority) => {
    setWishlist((prevList) =>
      prevList.map((item) =>
        item.id === id ? { ...item, priority: newPriority } : item,
      ),
    );
  };

  // Розрахунок бюджету та оновлення DOM для підсумку
  React.useEffect(() => {
    const totalCost = wishlist
      .filter((item) => !item.completed)
      .reduce((sum, item) => sum + (item.price ?? DEFAULT_PRICE), 0);

    const totalPriceElem = document.querySelector("#total-price");
    if (totalPriceElem) {
      totalPriceElem.textContent = `${totalCost.toLocaleString()} грн`;
    }

    // Перевірка бюджету в консолі
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

  // Обробник сабміту форми додавання нового бажання
  React.useEffect(() => {
    const form = document.querySelector("#wish-form");
    if (!form) return;

    const handleFormSubmit = (e) => {
      e.preventDefault();
      const nameInput = document.querySelector("#wish-name");
      const priceInput = document.querySelector("#wish-price");
      const priorityInput = document.querySelector("#wish-priority");
      const imgInput = document.querySelector("#wish-img");

      const newItem = {
        id: Date.now(), // унікальний id для нових елементів
        title: nameInput.value.trim(),
        price: Number(priceInput.value),
        priority: priorityInput.value,
        image: imgInput.value.trim() || "https://via.placeholder.com/150",
        completed: false,
      };

      setWishlist((prev) => [newItem, ...prev]);
      setStatusMessage("");
      form.reset();
    };

    form.addEventListener("submit", handleFormSubmit);
    return () => form.removeEventListener("submit", handleFormSubmit);
  }, []);

  return (
    <div>
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

      <button
        className="btn-add"
        style={{ marginBottom: "1rem", display: "inline-block" }}
        onClick={loadData}
        disabled={isLoading}
      >
        Оновити список
      </button>

      {/* Крок 5: Рендер циклом через .map() з унікальним key */}
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
    </div>
  );
}

// Монтування React-додатку в корінь
const rootElement = document.querySelector("#root");
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<WishListApp />);
}
