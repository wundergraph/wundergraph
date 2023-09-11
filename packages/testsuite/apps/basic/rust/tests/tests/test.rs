fn client() -> app::Client {
    let url = std::env::var("WG_PUBLIC_NODE_URL")
    .map(|url| app::Url::parse(&url).unwrap())
    .ok();
    app::Client::new(url)
}

#[tokio::test]
async fn test_simple() {
    let resp = client().functions_simple().await.unwrap();
    assert_eq!("hello simple", resp);
}

#[tokio::test]
async fn test_with_input() {
    let resp = client().functions_greeting(app::FunctionsGreetingInput{
        name: String::from("rust"),
    }).await.unwrap();
    assert_eq!("Hello I am rust", resp);
}

#[tokio::test]
async fn test_mutate() {
    let resp = client().set_name(app::SetNameInput{
        name: String::from("test"),
    }).await.unwrap();

    assert_eq!("test", resp.embedded_set_name);
}

#[tokio::test]
async fn test_well_known_error() {
    let resp = client().functions_throw(app::FunctionsThrowInput{
        throw: String::from("BadRequest"),
    }).await.unwrap_err();

    let app::Error::ResponseError(err) = resp else {
        assert!(false, "error is no a GraphQLError");
        return;
    };
    assert_eq!(400, err.status_code);
    assert_eq!(1, err.errors.len());
    assert_eq!("Bad request", err.errors[0].message);
}


#[tokio::test]
async fn test_validation_error() {
    let resp = client().functions_throw(app::FunctionsThrowInput{
        throw: String::from("something"),
    }).await.unwrap_err();

    let app::Error::ResponseError(err) = resp else {
        assert!(false, "error is no a GraphQLError");
        return;
    };
    assert_eq!(400, err.status_code);
    assert_eq!(Some("InputValidationError"), err.code.as_deref());
}
