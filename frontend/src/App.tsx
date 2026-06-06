import { FormEvent, useCallback, useEffect, useState } from "react";

type Item = { id: number; name: string };

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export default function App() {
  const [items, setItems] = useState<Item[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loadItems = useCallback(() => {
    fetch(`${API_URL}/items`)
      .then((r) => r.json())
      .then(setItems)
      .catch((err) => {
        console.error(err);
        setError("Failed to load items");
      });
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    setError(null);
    try {
      const response = await fetch(`${API_URL}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!response.ok) throw new Error("Failed to create item");
      const item: Item = await response.json();
      setItems((prev) => [...prev, item]);
      setName("");
    } catch (err) {
      console.error(err);
      setError("Failed to add item");
    }
  }

  return (
    <main>
      <h1>Items</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Item name"
        />
        <button type="submit">Add item</button>
      </form>
      {error && <p>{error}</p>}
      <ul>
        {items.map((item) => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    </main>
  );
}
