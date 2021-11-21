import {
    ApolloClient,
    InMemoryCache,
    ApolloProvider,
    useQuery,
} from "@apollo/client";
import pkg from '@apollo/client';

const client = new ApolloClient({
    uri: 'https://127.0.0.1:8080',
    cache: new InMemoryCache()
});

client
.query({
    query: pkg.gql`
        query {
            agreementInfos(filter: {
                creator: "",
                signer: "123",
                status: []
            },
                page: {
                    page: 0,
                    size: 2,
                    sortField: "index",
                    order: "desc"
                }){
                page,
                size,
                total,
                data {
                    index,
                    creator,
                    name,
                    create_at,
                    status,
                    signers,
                    agreement_file,
                    sign_infos,
                    resources
                }
            }
        }
    `
})
.then(result => console.log(result));