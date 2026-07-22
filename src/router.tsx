import { createBrowserRouter, Navigate } from "react-router-dom"
import { AppLayout } from "@/components/layout/app-layout"
import { RequireAuth } from "@/components/layout/require-auth"
import { LoginPage } from "@/pages/login-page"
import { DashboardPage } from "@/pages/dashboard/dashboard-page"
import { OrdersPage } from "@/pages/orders/orders-page"
import { ProductsPage } from "@/pages/products/products-page"
import { AddProductPage } from "@/pages/products/add-product-page"
import { EditProductPage } from "@/pages/products/edit-product-page"
import { InventoryPage } from "@/pages/inventory/inventory-page"
import { CustomersPage } from "@/pages/customers/customers-page"
import { CustomerDetailPage } from "@/pages/customers/customer-detail-page"
import { NotFoundPage } from "@/pages/not-found-page"

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        path: "/",
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: "dashboard", element: <DashboardPage /> },
          { path: "orders", element: <OrdersPage /> },
          { path: "products", element: <ProductsPage /> },
          { path: "products/new", element: <AddProductPage /> },
          { path: "products/:productId/edit", element: <EditProductPage /> },
          { path: "inventory", element: <InventoryPage /> },
          { path: "customers", element: <CustomersPage /> },
          { path: "customers/:customerId", element: <CustomerDetailPage /> },
          { path: "*", element: <NotFoundPage /> },
        ],
      },
    ],
  },
])
