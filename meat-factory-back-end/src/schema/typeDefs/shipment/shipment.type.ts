import { SHIPMENT_STATUS } from '../../../types/shipment/shipment.type';
import { PaginationSchema } from '../global/global.type';

export default `#graphql
    enum SHIPMENT_STATUS {
        ${Object.values(SHIPMENT_STATUS).join('\n ')}
    }

    # One boxed/weighed load on a shipment. Mirrors the storekeeper's
    # notebook layout: pieces + gross − tare = net. The grossKg/tareKg fields
    # are optional — when both supplied the controller uses gross-minus-tare;
    # otherwise it falls back to the directly-supplied weightKg.
    type ShipmentCargoEntry {
        id: ID
        shipmentId: ID
        productLabel: String
        pieceCount: Int
        grossKg: Float
        tareKg: Float
        weightKg: Float
        # Buyer-side price agreed at loading. Independent from the herder's
        # weighing-entry price. Nullable for "load now, price later".
        pricePerKg: Float
        sequenceNo: Int
        createdById: ID
        createdBy: Admin
        createdAt: Date
        updatedAt: Date
    }

    type ShipmentCargoEntryResponse {
        success: Boolean
        message: String
        cargoEntry: ShipmentCargoEntry
    }

    # One photo from the loading session (truck side / serial sticker /
    # cargo doors / driver licence …). Multiple per shipment, ordered by
    # sequenceNo.
    type ShipmentPhoto {
        id: ID
        shipmentId: ID
        fileId: ID
        file: File
        sequenceNo: Int
        createdAt: Date
        updatedAt: Date
    }

    type ShipmentPhotoResponse {
        success: Boolean
        message: String
        photo: ShipmentPhoto
    }

    type Shipment {
        id: ID
        shipmentCode: String
        customerId: ID
        customer: Customer
        salesTransactionId: ID
        salesTransaction: SalesTransaction
        # Aggregate weight — kept in sync with the sum of cargoEntries when
        # the manifest is used. For shipments without a manifest it's whatever
        # was passed to createShipment.
        weightKg: Float
        status: SHIPMENT_STATUS
        shippedAt: Date
        loadedById: ID
        loadedBy: Admin
        vehiclePlate: String
        driverName: String
        driverPhone: String
        serialNumber: String
        notes: String
        photoFileId: ID
        photo: File
        cargoEntries: [ShipmentCargoEntry]
        photos: [ShipmentPhoto]
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
            vehiclePlate: String
            driverName: String
            driverPhone: String
            serialNumber: String
            notes: String
            photoFileId: ID
        ): ShipmentResponse @auth(permissions: ["MANAGER", "STOREKEEPER", "ADMIN", "SUPER_ADMIN"])

        updateShipmentStatus(
            id: ID!
            status: SHIPMENT_STATUS!
        ): ShipmentResponse @auth(permissions: ["MANAGER", "STOREKEEPER", "ADMIN", "SUPER_ADMIN"])

        addCargoEntry(
            shipmentId: ID!
            productLabel: String!
            pieceCount: Int
            grossKg: Float
            tareKg: Float
            # Direct net — required only when grossKg+tareKg both omitted.
            weightKg: Float
            # Optional at create-time — set later via updateCargoEntryPrice.
            pricePerKg: Float
        ): ShipmentCargoEntryResponse @auth(permissions: ["MANAGER", "STOREKEEPER", "ADMIN", "SUPER_ADMIN"])

        # Late price update for the "load now, price later" flow.
        updateCargoEntryPrice(
            id: ID!
            pricePerKg: Float
        ): ShipmentCargoEntryResponse @auth(permissions: ["MANAGER", "STOREKEEPER", "ADMIN", "SUPER_ADMIN"])

        deleteCargoEntry(id: ID!): Response @auth(permissions: ["MANAGER", "STOREKEEPER", "ADMIN", "SUPER_ADMIN"])

        # Unified loading-info update (driver, serial, vehicle plate).
        # Pass only the fields you want to change — null clears.
        updateShipmentLoadingInfo(
            id: ID!
            vehiclePlate: String
            driverName: String
            driverPhone: String
            serialNumber: String
        ): ShipmentResponse @auth(permissions: ["MANAGER", "STOREKEEPER", "ADMIN", "SUPER_ADMIN"])

        addShipmentPhoto(
            shipmentId: ID!
            fileId: ID!
        ): ShipmentPhotoResponse @auth(permissions: ["MANAGER", "STOREKEEPER", "ADMIN", "SUPER_ADMIN"])

        removeShipmentPhoto(id: ID!): Response @auth(permissions: ["MANAGER", "STOREKEEPER", "ADMIN", "SUPER_ADMIN"])
    }
`;
