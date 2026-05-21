export default `#graphql
    type AnimalBreakdownItem {
        animalType: String
        totalKg: Float
        totalAmount: Float
    }

    type ByproductBreakdownItem {
        byproductType: String
        totalKg: Float
        totalAmount: Float
    }

    type Dashboard {
        totalMeatIncome: Float
        totalHerderIncome: Float
        activeHerderCount: Int
        transactionCount: Int
        pendingServicesCount: Int
        totalByproductKg: Float
        animalBreakdown: [AnimalBreakdownItem]
        byproductBreakdown: [ByproductBreakdownItem]
        recentTransactions: [SalesTransaction]
        recentShipments: [Shipment]
    }

    type DashboardResponse {
        success: Boolean
        message: String
        dashboard: Dashboard
    }

    extend type Query {
        dashboard(dateRange: DateRangeInput): DashboardResponse @auth(permissions: ["MANAGER", "ADMIN", "SUPER_ADMIN"])
    }
`;
