import {
  DOMESTIC_MARKET,
  SHIPMENT_CATEGORY,
  SHIPMENT_STATUS,
} from '../../../types/shipment/shipment.type';
import { PaginationSchema } from '../global/global.type';

export default `#graphql
    enum SHIPMENT_STATUS {
        ${Object.values(SHIPMENT_STATUS).join('\n ')}
    }

    enum SHIPMENT_CATEGORY {
        ${Object.values(SHIPMENT_CATEGORY).join('\n ')}
    }

    enum DOMESTIC_MARKET {
        ${Object.values(DOMESTIC_MARKET).join('\n ')}
    }

    # One boxed/weighed load on a shipment. Mirrors the storekeeper's
    # notebook layout: pieces + gross − tare = net. The grossKg/tareKg fields
    # are optional — when both supplied the controller uses gross-minus-tare;
    # otherwise it falls back to the directly-supplied weightKg.
    type ShipmentCargoEntry {
        id: ID
        shipmentId: ID
        # MEAT (animalType) or BYPRODUCT (byproductName).
        productType: PRODUCT_TYPE
        # MEAT line: meat type (EXPORT ⇒ HORSE only). Null on byproduct lines.
        animalType: String
        # BYPRODUCT line: free-form byproduct name. Null on meat lines.
        byproductName: String
        # Traceability link to the byproduct catalogue entry (animal → wrapper
        # → constant), when picked from the catalogue.
        sourceConstantId: ID
        productLabel: String
        pieceCount: Int
        grossKg: Float
        tareKg: Float
        weightKg: Float
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

    # One priced product group on a shipment. Auto-derived from the cargo
    # manifest — every distinct meat type / byproduct becomes a sale line whose
    # totalWeightKg tracks its cargo entries. The end-of-load pricing screen
    # shows each group's weight and lets the user insert a per-kg selling price.
    type ShipmentSaleLine {
        id: ID
        shipmentId: ID
        productType: PRODUCT_TYPE
        animalType: String
        byproductName: String
        groupKey: String
        totalWeightKg: Float
        pricePerKg: Float
        # Derived: totalWeightKg × pricePerKg (null until priced).
        amount: Float
        createdAt: Date
        updatedAt: Date
    }

    type ShipmentSaleLineResponse {
        success: Boolean
        message: String
        saleLine: ShipmentSaleLine
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
        category: SHIPMENT_CATEGORY
        # Sub-market for DOMESTIC shipments (LOCAL / ULAANBAATAR); null for EXPORT.
        domesticMarket: DOMESTIC_MARKET
        customerId: ID
        customer: Customer
        # Aggregate weight — kept in sync with the sum of cargoEntries when
        # the manifest is used. For shipments without a manifest it's whatever
        # was passed to createShipment.
        weightKg: Float
        # Cached grand total = Σ(group weight × group price). Null until any
        # sale line is priced.
        totalPrice: Float
        pricedAt: Date
        status: SHIPMENT_STATUS
        shippedAt: Date
        loadedById: ID
        loadedBy: Admin
        vehiclePlate: String
        driverName: String
        driverPhone: String
        # Auto-incremented loading serial (assigned at create, like the
        # registration number).
        serialNumber: Int
        notes: String
        photoFileId: ID
        photo: File
        cargoEntries: [ShipmentCargoEntry]
        saleLines: [ShipmentSaleLine]
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

    type NextShipmentSerialResponse {
        success: Boolean
        message: String
        serialNumber: Int
    }

    extend type Query {
        shipments(
            status: SHIPMENT_STATUS
            category: SHIPMENT_CATEGORY
            domesticMarket: DOMESTIC_MARKET
            customerId: ID
            dateRange: DateRangeInput
            ${PaginationSchema}
        ): ShipmentsResponse @auth(permissions: ["MANAGER", "STOREKEEPER", "ADMIN", "SUPER_ADMIN"])
        shipment(id: ID!): ShipmentResponse @auth(permissions: ["MANAGER", "STOREKEEPER", "ADMIN", "SUPER_ADMIN"])
        # Preview the next loading serial (does not consume the sequence).
        nextShipmentSerial: NextShipmentSerialResponse @auth(permissions: ["MANAGER", "STOREKEEPER", "ADMIN", "SUPER_ADMIN"])
    }

    extend type Mutation {
        createShipment(
            category: SHIPMENT_CATEGORY!
            # Required when category = DOMESTIC; ignored for EXPORT.
            domesticMarket: DOMESTIC_MARKET
            # Required — create a customer inline first if none exists.
            customerId: ID!
            # Optional — weight is derived from the cargo manifest.
            weightKg: Float
            vehiclePlate: String
            driverName: String
            driverPhone: String
            notes: String
            photoFileId: ID
        ): ShipmentResponse @auth(permissions: ["MANAGER", "STOREKEEPER", "ADMIN", "SUPER_ADMIN"])

        updateShipmentStatus(
            id: ID!
            status: SHIPMENT_STATUS!
        ): ShipmentResponse @auth(permissions: ["MANAGER", "STOREKEEPER", "ADMIN", "SUPER_ADMIN"])

        # End-of-load pricing: insert a per-kg selling price on one product
        # group (sale line). Nullable — agreed on the spot or set later.
        setShipmentSalePrice(
            id: ID!
            pricePerKg: Float
        ): ShipmentSaleLineResponse @auth(permissions: ["MANAGER", "STOREKEEPER", "ADMIN", "SUPER_ADMIN"])

        addCargoEntry(
            shipmentId: ID!
            # MEAT or BYPRODUCT. EXPORT shipments accept MEAT/HORSE only.
            productType: PRODUCT_TYPE!
            # Required for MEAT lines (EXPORT ⇒ HORSE).
            animalType: String
            # BYPRODUCT lines: pass sourceConstantId (name derived) or a
            # free-form byproductName.
            byproductName: String
            sourceConstantId: ID
            # Optional sub-cut label; defaults to the picked type's name.
            productLabel: String
            pieceCount: Int
            grossKg: Float
            tareKg: Float
            # Direct net — required only when grossKg+tareKg both omitted.
            weightKg: Float
        ): ShipmentCargoEntryResponse @auth(permissions: ["MANAGER", "STOREKEEPER", "ADMIN", "SUPER_ADMIN"])

        deleteCargoEntry(id: ID!): Response @auth(permissions: ["MANAGER", "STOREKEEPER", "ADMIN", "SUPER_ADMIN"])

        # Unified loading-info update (driver, serial, vehicle plate).
        # Pass only the fields you want to change — null clears.
        updateShipmentLoadingInfo(
            id: ID!
            vehiclePlate: String
            driverName: String
            driverPhone: String
        ): ShipmentResponse @auth(permissions: ["MANAGER", "STOREKEEPER", "ADMIN", "SUPER_ADMIN"])

        addShipmentPhoto(
            shipmentId: ID!
            fileId: ID!
        ): ShipmentPhotoResponse @auth(permissions: ["MANAGER", "STOREKEEPER", "ADMIN", "SUPER_ADMIN"])

        removeShipmentPhoto(id: ID!): Response @auth(permissions: ["MANAGER", "STOREKEEPER", "ADMIN", "SUPER_ADMIN"])
    }
`;
