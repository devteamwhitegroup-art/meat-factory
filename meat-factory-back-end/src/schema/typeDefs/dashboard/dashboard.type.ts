export default `#graphql
    type AnimalBreakdownItem {
        animalType: String
        totalKg: Float
        totalAmount: Float
    }

    # Byproduct lives entirely in the handoff/log domain after Phase 3 —
    # no price, no enum, just a free-form name + summed weight.
    type ByproductBreakdownItem {
        name: String
        totalKg: Float
    }

    # Pipeline counts mirror the FE /registrations stage chips.
    type PipelineCounts {
        registered: Int
        inProcess: Int
        paymentPending: Int
        paid: Int
    }

    type Dashboard {
        totalMeatIncome: Float
        totalHerderIncome: Float
        pendingPayoutAmount: Float
        activeHerderCount: Int
        transactionCount: Int
        pendingServicesCount: Int
        totalByproductKg: Float
        animalBreakdown: [AnimalBreakdownItem]
        byproductBreakdown: [ByproductBreakdownItem]
        pipeline: PipelineCounts
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
