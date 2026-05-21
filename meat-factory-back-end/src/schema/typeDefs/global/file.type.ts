export default `#graphql
    type File {
        id: ID

        key: String
        size: Int
        url: String
        mimetype: String

        createdAt: Date
        updatedAt: Date
    }
`;
