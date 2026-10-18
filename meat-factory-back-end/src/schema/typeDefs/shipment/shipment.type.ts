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

    # One product group on a shipment. Auto-derived from the cargo manifest —
    # every distinct meat type / byproduct becomes a sale line whose
    # totalWeightKg tracks its cargo entries. Income comes from the
    # salesman's report lines (entries), entered after the shipment leaves.
    type ShipmentSaleLine {
        id: ID
        shipmentId: ID
        productType: PRODUCT_TYPE
        animalType: String
        byproductName: String
        groupKey: String
        # Loaded kg.
        totalWeightKg: Float
        # Average reported selling price (null until reported).
        pricePerKg: Float
        # Derived from the report: Σ sold kg and Σ kg × price.
        soldKg: Float
        amount: Float
        entries: [ShipmentSaleEntry]
        createdAt: Date
        updatedAt: Date
    }

    # Salesman's report line: kg of the group sold at a price.
    type ShipmentSaleEntry {
        id: ID
        saleLineId: ID
        weightKg: Float
        pricePerKg: Float
        amount: Float
        createdBy: Admin
        createdAt: Date
    }

    type ShipmentSaleEntryResponse {
        success: Boolean
        message: String
        saleEntry: ShipmentSaleEntry
    }

    # Admin analytics per meat type: FIFO cost of the loaded kg vs reported
    # income. Cost is null until DELIVERED (stock goes out then).
    type ShipmentAnalyticsLine {
        animalType: String
        shippedKg: Float
        cost: Float
        avgCostPerKg: Float
        soldKg: Float
        income: Float
        avgIncomePerKg: Float
    }

    type ShipmentAnalytics {
        costKnown: Boolean
        lines: [ShipmentAnalyticsLine]
        shippedKg: Float
        cost: Float
        avgCostPerKg: Float
        soldKg: Float
        income: Float
        avgIncomePerKg: Float
        profit: Float
    }

    type ShipmentAnalyticsResponse {
        success: Boolean
        message: String
        analytics: ShipmentAnalytics
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
        factory: String
        shippedAt: Date
        loadedById: ID
        loadedBy: Admin
        vehiclePlate: String
        driverName: String
        driverPhone: String
        # Auto-incremented loading serial (assigned at create, like the
        # registration number).
        serialNumber: Int
        # The factory's own physical seal/lock number applied to the truck —
        # free text, staff-entered. Unrelated to shipmentCode/serialNumber.
        sealNumber: String
        notes: String
        photoFileId: ID
        photo: File
        cargoEntries: [ShipmentCargoEntry]
        saleLines: [ShipmentSaleLine]
        photos: [ShipmentPhoto]
        # Invoice auto-created on delivery (see updateShipmentStatus). Null
        # until DELIVERED, or if the shipment had no customer to bill.
        salesTransaction: SalesTransaction
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

    # Loadable stock of one product group at the shipment's factory.
    type ShipmentStockRow {
        groupKey: String
        productType: PRODUCT_TYPE
        animalType: String
        byproductName: String
        onHandKg: Float
        # Cargo on every undelivered (PENDING/LOADED) shipment.
        reservedKg: Float
        # onHandKg − reservedKg: what more can still be loaded.
        availableKg: Float
    }

    type ShipmentStockResponse {
        success: Boolean
        message: String
        items: [ShipmentStockRow]
    }

    extend type Query {
        shipmentStock(shipmentId: ID!): ShipmentStockResponse @auth(permissions: [SHIPMENT_VIEW, SHIPMENT_MANAGE])
        shipments(
            # Owner/admin only — factory staff always see their own.
            factory: String
            status: SHIPMENT_STATUS
            category: SHIPMENT_CATEGORY
            domesticMarket: DOMESTIC_MARKET
            customerId: ID
            dateRange: DateRangeInput
            ${PaginationSchema}
        ): ShipmentsResponse @auth(permissions: [SHIPMENT_VIEW])
        shipment(id: ID!): ShipmentResponse @auth(permissions: [SHIPMENT_VIEW])
        # Preview the next loading serial (does not consume the sequence).
        nextShipmentSerial: NextShipmentSerialResponse @auth(permissions: [SHIPMENT_MANAGE])
        shipmentAnalytics(id: ID!): ShipmentAnalyticsResponse @auth(permissions: [SHIPMENT_SALES])
    }

    extend type Mutation {
        createShipment(
            # Owner/admin must pick; factory staff ship from their own.
            factory: String
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
            # The factory's own physical seal/lock number, if already known.
            sealNumber: String
            notes: String
            photoFileId: ID
        ): ShipmentResponse @auth(permissions: [SHIPMENT_MANAGE])

        # Forward one step, or LOADED → PENDING (undo, refused once a sales
        # report exists). LOADED needs every cargo group covered by stock.
        updateShipmentStatus(
            id: ID!
            status: SHIPMENT_STATUS!
        ): ShipmentResponse @auth(permissions: [SHIPMENT_MANAGE])

        # Salesman's report (нягтлан / admin), once the shipment has left
        # (LOADED/DELIVERED):
        # kg of one product group sold at a price. Several per group allowed.
        addShipmentSaleEntry(
            saleLineId: ID!
            weightKg: Float!
            pricePerKg: Float!
        ): ShipmentSaleEntryResponse @auth(permissions: [SHIPMENT_SALES])

        deleteShipmentSaleEntry(id: ID!): Response @auth(permissions: [SHIPMENT_SALES])

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
        ): ShipmentCargoEntryResponse @auth(permissions: [SHIPMENT_MANAGE])

        deleteCargoEntry(id: ID!): Response @auth(permissions: [SHIPMENT_MANAGE])

        # Unified loading-info update (driver, vehicle plate, seal number).
        # Pass only the fields you want to change — null clears.
        updateShipmentLoadingInfo(
            id: ID!
            vehiclePlate: String
            driverName: String
            driverPhone: String
            sealNumber: String
        ): ShipmentResponse @auth(permissions: [SHIPMENT_MANAGE])

        addShipmentPhoto(
            shipmentId: ID!
            fileId: ID!
        ): ShipmentPhotoResponse @auth(permissions: [SHIPMENT_MANAGE])

        removeShipmentPhoto(id: ID!): Response @auth(permissions: [SHIPMENT_MANAGE])
    }
`;
