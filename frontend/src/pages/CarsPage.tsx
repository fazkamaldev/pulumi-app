import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  clearBrandError,
  createBrand,
  fetchBrands,
} from "../features/brands/brandsSlice";
import { clearCarError, createCar, fetchCars } from "../features/cars/carsSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";

export default function CarsPage() {
  const dispatch = useAppDispatch();
  const {
    brands,
    loading: brandsLoading,
    error: brandError,
  } = useAppSelector((state) => state.brands);
  const {
    cars,
    loading: carsLoading,
    error: carError,
  } = useAppSelector((state) => state.cars);

  const [brandName, setBrandName] = useState("");
  const [carName, setCarName] = useState("");
  const [brandId, setBrandId] = useState("");

  useEffect(() => {
    void dispatch(fetchBrands());
    void dispatch(fetchCars());
  }, [dispatch]);

  const brandById = useMemo(
    () => new Map(brands.map((brand) => [brand.id, brand.name])),
    [brands],
  );

  async function handleBrandSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = brandName.trim();
    if (!trimmed) return;

    dispatch(clearBrandError());
    const result = await dispatch(createBrand(trimmed));
    if (createBrand.fulfilled.match(result)) {
      setBrandName("");
    }
  }

  async function handleCarSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = carName.trim();
    const selectedBrandId = Number(brandId);
    if (!trimmed || !selectedBrandId) return;

    dispatch(clearCarError());
    const result = await dispatch(
      createCar({ name: trimmed, brand_id: selectedBrandId }),
    );
    if (createCar.fulfilled.match(result)) {
      setCarName("");
    }
  }

  return (
    <div className="row g-4">
      <div className="col-lg-5">
        <h1 className="mb-4">Brands</h1>
        <form className="input-group mb-4" onSubmit={handleBrandSubmit}>
          <input
            type="text"
            className="form-control"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            placeholder="Brand name"
          />
          <button className="btn btn-primary" type="submit">
            Add brand
          </button>
        </form>
        {brandError && (
          <div className="alert alert-danger" role="alert">
            {brandError}
          </div>
        )}
        {brandsLoading ? (
          <div className="text-muted">Loading brands...</div>
        ) : (
          <ul className="list-group">
            {brands.map((brand) => (
              <li className="list-group-item" key={brand.id}>
                {brand.name}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="col-lg-7">
        <h1 className="mb-4">Cars</h1>
        <form className="row g-2 mb-4" onSubmit={handleCarSubmit}>
          <div className="col-md-5">
            <input
              type="text"
              className="form-control"
              value={carName}
              onChange={(e) => setCarName(e.target.value)}
              placeholder="Car model"
            />
          </div>
          <div className="col-md-5">
            <select
              className="form-select"
              value={brandId}
              onChange={(e) => setBrandId(e.target.value)}
            >
              <option value="">Select brand</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-2">
            <button
              className="btn btn-primary w-100"
              type="submit"
              disabled={brands.length === 0}
            >
              Add car
            </button>
          </div>
        </form>
        {carError && (
          <div className="alert alert-danger" role="alert">
            {carError}
          </div>
        )}
        {carsLoading ? (
          <div className="text-muted">Loading cars...</div>
        ) : (
          <ul className="list-group">
            {cars.map((car) => (
              <li className="list-group-item" key={car.id}>
                {car.name}
                <span className="text-muted ms-2">
                  ({brandById.get(car.brand_id) ?? "Unknown brand"})
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
