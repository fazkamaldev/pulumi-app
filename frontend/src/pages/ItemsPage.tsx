import { FormEvent, useEffect, useState } from "react";
import {
  clearError,
  createItem,
  fetchItems,
} from "../features/items/itemsSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";

export default function ItemsPage() {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((state) => state.items);
  const [name, setName] = useState("");

  useEffect(() => {
    void dispatch(fetchItems());
  }, [dispatch]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    dispatch(clearError());
    const result = await dispatch(createItem(trimmed));
    if (createItem.fulfilled.match(result)) {
      setName("");
    }
  }

  return (
    <div className="row justify-content-center">
      <div className="col-md-8 col-lg-6">
        <h1 className="mb-4">Items</h1>
        <form className="input-group mb-4" onSubmit={handleSubmit}>
          <input
            type="text"
            className="form-control"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Item name"
          />
          <button className="btn btn-primary" type="submit">
            Add item
          </button>
        </form>
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}
        {loading ? (
          <div className="text-center text-muted">Loading items...</div>
        ) : (
          <ul className="list-group">
            {items.map((item) => (
              <li className="list-group-item" key={item.id}>
                {item.name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
