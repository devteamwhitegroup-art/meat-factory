import { SHIPMENT_STATUS } from '../../../types/shipment/shipment.type';
import { PaginationSchema } from '../global/global.type';

export default `#graphql
    enum SHIPMENT_STATUS {
        ${Object.values(SHIPMENT_STATUS).join('\n ')}
    }

    type Shipment {
        id: ID
        shipmentCode: String
        customerId: ID
        customer: Customer
        salesTransactionId: ID
        salesTransaction: SalesTransaction
        weightKg: Float
        status: SHIPMENT_STATUS
        shippedAt: Date
        loadedById: ID
        loadedBy: Admin
        notes: String
        photoFileId: ID
        photo: File
        createdAt: Date
        updatedAt: Date
    }

    type ShipmentResponse {
        success: Boolean
        message: String
        shipment: Shipment
    }

    type ShipmentsResponse {
        success: Boolean
        message: String
        shipments: [Shipment]
        count: Int
    }

    extend type Query {
        shipments(
            status: SHIPMENT_STATUS
            customerId: ID
            salesTransactionId: ID
            dateRange: DateRangeInput
            ${PaginationSchema}
        ): ShipmentsResponse @auth(permissions: ["MANAGER", "STOREKEEPER", "ADMIN", "SUPER_ADMIN"])
        shipment(id: ID!): ShipmentResponse @auth(permissions: ["MANAGER", "STOREKEEPER", "ADMIN", "SUPER_ADMIN"])
    }

    extend type Mutation {
        createShipment(
            customerId: ID
            salesTransactionId: ID
            weightKg: Float!
            notes: String
            photoFileId: ID
        ): ShipmentResponse @auth(permissions: ["MANAGER", "STOREKEEPER", "ADMIN", "SUPER_ADMIN"])

        updateShipmentStatus(
            id: ID!
            status: SHIPMENT_STATUS!
        ): ShipmentResponse @auth(permissions: ["MANAGER", "STOREKEEPER", "ADMIN", "SUPER_ADMIN"])
    }
`;
