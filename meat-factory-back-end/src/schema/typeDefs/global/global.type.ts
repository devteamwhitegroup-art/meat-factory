export const PaginationSchema = `
    limit: Int = 10, page: Int = 1
`;

export default `#graphql
    directive @adminAuth(permissions: [String!]) on FIELD_DEFINITION
    directive @companyAuth on OBJECT | FIELD_DEFINITION
    directive @sellerAuth on OBJECT | FIELD_DEFINITION
    

     interface IResponse {
        success: Boolean
        message: String
    }
    
    type Response implements IResponse {
        success: Boolean!
        message: String!
    }

    type ErrorType {
        id: ID
        reason: String
    }

    type ErrorResponse {
        success: Boolean
        message: String
        errors: [ErrorType]
    }   

    type DateRange {
        startDate: Date
        endDate: Date
    }

    input DateRangeInput {
        startDate: Date
        endDate: Date
    }

    input QuantityInput {
        min: Int
        max: Int
    }

    type QuantityType {
        min: Int
        max: Int
    }

    scalar Date
    scalar JSON
    type Mutation {
        connect:String
    }
    type Query {
        connect:String
    }
    
`;
