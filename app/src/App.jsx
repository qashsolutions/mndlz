import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DataProvider } from './hooks/useData';
import Layout from './components/Layout';
import TerritoryOverview from './views/TerritoryOverview';
import StockoutHeatmap from './views/StockoutHeatmap';
import OutletArchetypes from './views/OutletArchetypes';
import SmartBasket from './views/SmartBasket';
import OutletDetail from './views/OutletDetail';
import PilotSimulation from './views/PilotSimulation';

export default function App() {
  return (
    <DataProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<TerritoryOverview />} />
            <Route path="stockouts" element={<StockoutHeatmap />} />
            <Route path="archetypes" element={<OutletArchetypes />} />
            <Route path="basket" element={<SmartBasket />} />
            <Route path="outlet" element={<OutletDetail />} />
            <Route path="simulation" element={<PilotSimulation />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </DataProvider>
  );
}
