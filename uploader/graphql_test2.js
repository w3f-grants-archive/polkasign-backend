import axios from "axios";

let upload_endpoint = 'http://127.0.0.1:8080/query';
axios.post(upload_endpoint, {
    query: `query {
\tagreementInfos(filter: {
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
}`
})
    .then(function (response) {
        console.log(response.data.data.agreementInfos);
    })
    .catch(function (error) {
        console.error(error);
    });


axios.post(upload_endpoint, {
    query: `mutation {
  createAgreementInfo(input: {
    index: 3,
    creator: "12213",
    name: "123",
    create_at: "1",
    status: 1,
    signers: ",123,",
    agreement_file: "123",
    sign_infos: "123",
    resources: "123"
  }){
    index
  }
}`
})
    .then(function (response) {
        console.log(response.data.data);
    })
    .catch(function (error) {
        console.error(error);
    });

axios.post(upload_endpoint, {
    query: `mutation {
  updateAgreementInfo(input: {
    index: 1003,
    creator: "123333",
    name: "123",
    create_at: "1",
    status: 1,
    signers: ",123,",
    agreement_file: "123",
    sign_infos: "123",
    resources: "123"
  }){
    index
  }
}`
})
    .then(function (response) {
        console.log(response.data.data);
    })
    .catch(function (error) {
        console.error(error);
    });