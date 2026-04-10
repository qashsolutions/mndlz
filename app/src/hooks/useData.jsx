import { useState, useEffect, createContext, useContext } from 'react';
import { runFullPipeline } from '../analytics/index.js';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [state, setState] = useState({ loading: true, error: null, data: null, analytics: null });

  useEffect(() => {
    async function load() {
      try {
        const base = import.meta.env.BASE_URL || '/';
        const [outlets, skus, monthlySales, weeklySales, distributors, distributorStock, returns, schemes, beats] =
          await Promise.all([
            fetch(`${base}data/outlets.json`).then(r => r.json()),
            fetch(`${base}data/skus.json`).then(r => r.json()),
            fetch(`${base}data/sales-monthly.json`).then(r => r.json()),
            fetch(`${base}data/sales-weekly-detail.json`).then(r => r.json()),
            fetch(`${base}data/distributors.json`).then(r => r.json()),
            fetch(`${base}data/distributor-stock.json`).then(r => r.json()),
            fetch(`${base}data/returns.json`).then(r => r.json()),
            fetch(`${base}data/schemes.json`).then(r => r.json()),
            fetch(`${base}data/beats.json`).then(r => r.json()),
          ]);

        const data = { outlets, skus, monthlySales, weeklySales, distributors, distributorStock, returns, schemes, beats };

        // Run analytics pipeline
        const analytics = await runFullPipeline(data);

        setState({ loading: false, error: null, data, analytics });
      } catch (err) {
        console.error('Failed to load data:', err);
        setState({ loading: false, error: err.message, data: null, analytics: null });
      }
    }
    load();
  }, []);

  return <DataContext.Provider value={state}>{children}</DataContext.Provider>;
}

export function useData() {
  return useContext(DataContext);
}
