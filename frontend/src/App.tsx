import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import AccountList from './pages/accounts/AccountList'
import AccountDetail from './pages/accounts/AccountDetail'
import GrantTypeList from './pages/grant-types/GrantTypeList'
import FeeCategoryList from './pages/fee-categories/FeeCategoryList'
import RateCardList from './pages/rate-cards/RateCardList'
import RateCardDetail from './pages/rate-cards/RateCardDetail'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="accounts" element={<AccountList />} />
        <Route path="accounts/:id" element={<AccountDetail />} />
        <Route path="grant-types" element={<GrantTypeList />} />
        <Route path="fee-categories" element={<FeeCategoryList />} />
        <Route path="rate-cards" element={<RateCardList />} />
        <Route path="rate-cards/:id" element={<RateCardDetail />} />
      </Route>
    </Routes>
  )
}
