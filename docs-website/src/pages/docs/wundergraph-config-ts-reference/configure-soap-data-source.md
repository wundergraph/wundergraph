---
title: Configure SOAP Datasource
pageTitle: WunderGraph - Configure SOAP Datasource
description:
---

The SOAP data source introspects WSDL and generates a GraphQL schema from it.

## Example Configuration

```typescript
// wundergraph.config.ts
const greeting = introspect.soap({
  apiNamespace: 'greeting',
  source: {
    kind: 'file',
    filePath: './greeting.wsdl',
  },
  headers: (builder) =>
    builder.addClientRequestHeader('X-Authorization', 'Authorization').addStaticHeader('X-Static', 'Static'),
});
configureWunderGraphApplication({
  apis: [greeting],
});
```

WunderGraph will automatically cache the introspection result in the local file-system.

## Specifying service address

OAS datasource will use SOAP address from the WSDL file.
At the moment, it is not possible to override the address via introspection options.

## Generated schema

Here's an example schema:

```graphql
type Mutation {
  greeting_GreetingApp_Greeting_Service_Greeting_Port_SayHi(name: String = ""): String
}
```

Which you will get from this wsdl:

```xml
<definitions name = "GreetingService"
   targetNamespace = "http://www.examples.com/wsdl/GreetingService.wsdl"
   xmlns = "http://schemas.xmlsoap.org/wsdl/"
   xmlns:soap = "http://schemas.xmlsoap.org/wsdl/soap/"
   xmlns:tns = "http://www.examples.com/wsdl/GreetingService.wsdl"
   xmlns:xsd = "http://www.w3.org/2001/XMLSchema">

   <message name = "SayHiRequest">
      <part name = "name" type = "xsd:string"/>
   </message>

   <message name = "SayHiResponse">
      <part name = "greeting" type = "xsd:string"/>
   </message>

   <portType name = "Greeting_PortType">
      <operation name = "SayHi">
         <input message = "tns:SayHiRequest"/>
         <output message = "tns:SayHiResponse"/>
      </operation>
   </portType>

   <binding name = "Greeting_Binding" type = "tns:Greeting_PortType">
      <soap:binding style = "rpc"
         transport = "http://schemas.xmlsoap.org/soap/http"/>
      <operation name = "SayHi">
         <soap:operation soapAction = "SayHi"/>
         <input>
            <soap:body
               encodingStyle = "http://schemas.xmlsoap.org/soap/encoding/"
               namespace = "urn:examples:Greetingservice"
               use = "encoded"/>
         </input>

         <output>
            <soap:body
               encodingStyle = "http://schemas.xmlsoap.org/soap/encoding/"
               namespace = "urn:examples:Greetingservice"
               use = "encoded"/>
         </output>
      </operation>
   </binding>

   <service name = "Greeting_Service">
      <documentation>WSDL File for GreetingService</documentation>
      <port binding = "tns:Greeting_Binding" name = "Greeting_Port">
         <soap:address
            location = "http://www.example.example/Greeting/" />
      </port>
   </service>
</definitions>
```
