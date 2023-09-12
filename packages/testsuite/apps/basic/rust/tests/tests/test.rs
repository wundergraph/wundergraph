use app::StreamExt;

fn client() -> app::Client {
    let url = std::env::var("WG_PUBLIC_NODE_URL")
        .map(|url| app::Url::parse(&url).unwrap())
        .ok();
    app::Client::new(url)
}

#[tokio::test]
async fn test_simple() {
    let resp = client().queries().functions_simple().await.unwrap();
    assert_eq!("hello simple", resp);
}

#[tokio::test]
async fn test_with_input() {
    let resp = client()
        .queries()
        .functions_greeting(app::FunctionsGreetingInput {
            name: String::from("rust"),
        })
        .await
        .unwrap();
    assert_eq!("Hello I am rust", resp);
}

#[tokio::test]
async fn test_mutate() {
    let resp = client()
        .mutations()
        .set_name(app::SetNameInput {
            name: String::from("test"),
        })
        .await
        .unwrap();

    assert_eq!(Some("test"), resp.embedded_set_name.as_deref());
}

#[tokio::test]
async fn test_well_known_error() {
    let resp = client()
        .queries()
        .functions_throw(app::FunctionsThrowInput {
            throw: String::from("BadRequest"),
        })
        .await
        .unwrap_err();

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
    let resp = client()
        .queries()
        .functions_throw(app::FunctionsThrowInput {
            throw: String::from("something"),
        })
        .await
        .unwrap_err();

    let app::Error::ResponseError(err) = resp else {
        assert!(false, "error is no a GraphQLError");
        return;
    };
    assert_eq!(400, err.status_code);
    assert_eq!(Some("InputValidationError"), err.code.as_deref());
}

#[tokio::test]
async fn test_subscription() {
    let count = 3usize;
    let resp = client()
        .subscriptions()
        .subscriptions_counter(app::SubscriptionsCounterInput {
            count: Some(count as i64),
            delay: Some(200),
            repeat: None,
        })
        .await
        .unwrap()
        .boxed();

    let results: Vec<_> = resp.collect().await;

    assert_eq!(count, results.len());
    for ii in 0..count {
        assert_eq!(ii.to_string(), results[ii].as_ref().unwrap().hello);
    }
}
