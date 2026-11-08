import { PaginationSchema } from "../global/global.type";
import { ORDER_STATUS } from "../../../types/order/order.type";

export default `#graphql
    enum ORDER_STATUS {
        ${Object.values(ORDER_STATUS).join("\n ")}
    }

    # One meat cut in a package, e.g. "Үхрийн өвчүү" 10 kg (kg optional).
    type OrderPackageItem {
        name: String
        kg: Float
    }

    input OrderPackageItemInput {
        name: String!
        kg: Float
    }

    type OrderPackage {
        id: ID
        name: String
        description: String
        # Whole ₮
        price: Int
        items: [OrderPackageItem]
        isActive: Boolean
        createdAt: Date
        updatedAt: Date
    }

    type OrderPackageResponse {
        success: Boolean
        message: String
        orderPackage: OrderPackage
    }

    type OrderPackagesResponse {
        success: Boolean
        message: String
        orderPackages: [OrderPackage]
    }

    # Package snapshot taken when the order was placed.
    type OrderLine {
        packageId: ID
        name: String
        unitPrice: Int
        quantity: Int
        items: [OrderPackageItem]
    }

    input OrderLineInput {
        packageId: ID!
        quantity: Int!
    }

    type Order {
        id: ID
        code: String
        customerName: String
        phone: String
        address: String
        note: String
        lines: [OrderLine]
        total: Int
        status: ORDER_STATUS
        qpayInvoiceId: String
        paidAt: Date
        createdAt: Date
        updatedAt: Date
    }

    type OrderResponse {
        success: Boolean
        message: String
        order: Order
    }

    type OrdersResponse {
        success: Boolean
        message: String
        orders: [Order]
        count: Int
    }

    # Bank-app deep link from the QPay invoice (mobile checkout).
    type QPayUrl {
        name: String
        description: String
        logo: String
        link: String
    }

    # QR fields are only filled by createOrder; checkOrderPayment returns status.
    type OrderPayment {
        orderId: ID
        code: String
        total: Int
        status: ORDER_STATUS
        qrImage: String
        qrText: String
        shortUrl: String
        urls: [QPayUrl]
    }

    type OrderPaymentResponse {
        success: Boolean
        message: String
        payment: OrderPayment
    }

    extend type Query {
        # Public — landing page.
        publicOrderPackages: OrderPackagesResponse

        orderPackages: OrderPackagesResponse @auth(permissions: [ORDER_MANAGE])
        orders(
            status: ORDER_STATUS
            search: String
            ${PaginationSchema}
        ): OrdersResponse @auth(permissions: [ORDER_MANAGE])
    }

    extend type Mutation {
        # Public — landing page checkout. Creates the order + QPay invoice.
        createOrder(
            customerName: String!
            phone: String!
            address: String!
            note: String
            lines: [OrderLineInput!]!
        ): OrderPaymentResponse
        # Public — asks QPay whether a PENDING order is paid.
        checkOrderPayment(id: ID!): OrderPaymentResponse

        setOrderStatus(id: ID!, status: ORDER_STATUS!): OrderResponse @auth(permissions: [ORDER_MANAGE])

        createOrderPackage(
            name: String!
            description: String
            price: Int!
            items: [OrderPackageItemInput!]
        ): OrderPackageResponse @auth(permissions: [ORDER_MANAGE])
        updateOrderPackage(
            id: ID!
            name: String
            description: String
            price: Int
            items: [OrderPackageItemInput!]
            isActive: Boolean
        ): OrderPackageResponse @auth(permissions: [ORDER_MANAGE])
        deleteOrderPackage(id: ID!): Response @auth(permissions: [ORDER_MANAGE])
    }
`;
