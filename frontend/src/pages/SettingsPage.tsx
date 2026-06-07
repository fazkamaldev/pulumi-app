import { FormEvent, useEffect, useState } from "react";
import {
  clearSettingsError,
  createSetting,
  fetchSettings,
} from "../features/settings/settingsSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";

export default function SettingsPage() {
  const dispatch = useAppDispatch();
  const { settings, loading, error } = useAppSelector((state) => state.settings);
  const [name, setName] = useState("");

  useEffect(() => {
    void dispatch(fetchSettings());
  }, [dispatch]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    dispatch(clearSettingsError());
    const result = await dispatch(createSetting(trimmed));
    if (createSetting.fulfilled.match(result)) {
      setName("");
    }
  }

  return (
    <div className="row justify-content-center">
      <div className="col-md-8 col-lg-6">
        <h1 className="mb-4">Settings</h1>
        <form className="input-group mb-4" onSubmit={handleSubmit}>
          <input
            type="text"
            className="form-control"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Setting name"
          />
          <button className="btn btn-primary" type="submit">
            Add setting
          </button>
        </form>
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}
        {loading ? (
          <div className="text-center text-muted">Loading settings...</div>
        ) : (
          <ul className="list-group">
            {settings.map((setting) => (
              <li className="list-group-item" key={setting.id}>
                {setting.name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
