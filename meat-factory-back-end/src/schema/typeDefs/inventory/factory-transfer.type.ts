import { PaginationSchema } from "../global/global.type";
import { FACTORY_TRANSFER_STATUS } from "../../../types/inventory/factory-transfer.type";

export default `#graphql
    # IN_TRANSIT: left the sender's stock. RECEIVED: in the receiver's stock.
    # CANCELLED: returned to the sender's stock.
    enum FACTORY_TRANSFER_STATUS {
        ${Object.values(FACTORY_TRANSFER_STATUS).join("\n ")}
    }

    type FactoryTransferLine {
        id: ID
        productType: PRODUCT_TYPE
        animalId: ID
        animal: Animal
        byproductName: String
        quantityKg: Float
        quantityCount: Int
    }

    # Factory → factory shipment (no customer, no invoice).
    type FactoryTransfer {
        id: ID
        # TR-YYYYMMDD-N
        code: String
        fromFactory: String
        toFactory: String
        status: FACTORY_TRANSFER_STATUS
        notes: String
        sentBy: Admin
        # Who received (RECEIVED) or cancelled (CANCELLED).
        closedBy: Admin
        closedAt: Date
        createdAt: Date
        lines: [FactoryTransferLine]
    }

    type FactoryTransferResponse {
        success: Boolean
        message: String
        transfer: FactoryTransfer
    }

    type FactoryTransfersResponse {
        success: Boolean
        message: String
        transfers: [FactoryTransfer]
        count: Int
    }

    # One of the sender's stock rows; kg and/or pieces.
    input FactoryTransferLineInput {
        inventoryItemId: ID!
        quantityKg: Float
        quantityCount: Int
    }

    extend type Query {
        # Staff: their factory's (sent or received). factory = cross-factory filter.
        factoryTransfers(
            status: FACTORY_TRANSFER_STATUS
            factory: String
            ${PaginationSchema}
        ): FactoryTransfersResponse @auth(permissions: [SHIPMENT_VIEW])
    }

    extend type Mutation {
        # Sends now: the lines leave the sender's stock.
        createFactoryTransfer(
            fromFactory: String
            toFactory: String!
            lines: [FactoryTransferLineInput!]!
            notes: String
        ): FactoryTransferResponse @auth(permissions: [SHIPMENT_MANAGE])

        # Receiving factory confirms → into its stock.
        receiveFactoryTransfer(id: ID!): Response @auth(permissions: [SHIPMENT_MANAGE])

        # Sending factory, while in transit → back into its stock.
        cancelFactoryTransfer(id: ID!): Response @auth(permissions: [SHIPMENT_MANAGE])
    }
`;
